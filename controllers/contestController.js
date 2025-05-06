const Contest = require('../models/Contest');
const Question = require('../models/Question');
const Participation = require('../models/Participation');
const Leaderboard = require('../models/Leaderboard');
const { getRedisClient } = require('../config/redis');
const config = require('../config/config');

// @desc    Get all contests
// @route   GET /api/contests
// @access  Public (with filtering)
exports.getContests = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by type (VIP or Normal)
    if (req.query.type === 'vip') {
      query.isVipOnly = true;
    } else if (req.query.type === 'normal') {
      query.isVipOnly = false;
    }
    
    // For guests, only show live normal contests
    if (!req.user) {
      query.status = 'live';
      query.isVipOnly = false;
    }
    
    // Get redis client for caching
    const redisClient = await getRedisClient();
    const cacheKey = `contests:${JSON.stringify(query)}:${page}:${limit}`;
    
    // Try to get from cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }
    
    // Execute query
    const contests = await Contest.find(query)
      .select('contestName description startTime endTime prize status participantsCount maxParticipants minParticipants isVipOnly')
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Contest.countDocuments(query);
    
    const response = {
      success: true,
      count: contests.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: contests
    };
    
    // Cache the response
    await redisClient.set(cacheKey, JSON.stringify(response), {
      EX: config.REDIS_CACHE_EXPIRE
    });
    
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving contests',
      error: err.message
    });
  }
};

// @desc    Get single contest
// @route   GET /api/contests/:contestId
// @access  Private (with role-based access)
exports.getContest = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.contestId)
      .select('contestName description startTime endTime prize status participantsCount maxParticipants minParticipants isVipOnly');
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }
    
    // Check access permissions
    if (contest.isVipOnly && !req.user.isAdmin && req.user.userType !== 'VIP') {
      return res.status(403).json({
        success: false,
        message: 'Access to VIP contest details is restricted'
      });
    }
    
    res.status(200).json({
      success: true,
      data: contest
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving contest',
      error: err.message
    });
  }
};

// @desc    Participate in a contest
// @route   POST /api/contests/:contestId/participate
// @access  Private
exports.participateInContest = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.contestId);
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }
    
    // Check if contest is in pending status
    if (contest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot participate in a contest with status: ${contest.status}`
      });
    }
    
    // Check if the contest is VIP only and user is not VIP
    if (contest.isVipOnly && req.user.userType !== 'VIP') {
      return res.status(403).json({
        success: false,
        message: 'This contest is for VIP users only'
      });
    }
    
    // Check if user is already participating
    const existingParticipation = await Participation.findOne({
      contestId: contest._id,
      userId: req.user._id
    });
    
    if (existingParticipation) {
      return res.status(400).json({
        success: false,
        message: 'You are already participating in this contest'
      });
    }
    
    // Check if user is already participating in another active contest
    const activeParticipation = await Participation.findOne({
      userId: req.user._id,
      submissionState: 'pending'
    });
    
    if (activeParticipation) {
      const activeContest = await Contest.findById(activeParticipation.contestId);
      if (activeContest && (activeContest.status === 'pending' || activeContest.status === 'live')) {
        return res.status(400).json({
          success: false,
          message: 'You are already participating in another active contest'
        });
      }
    }
    
    // Create participation
    const participation = await Participation.create({
      contestId: contest._id,
      userId: req.user._id,
      score: 0,
      submissionState: 'pending',
      currentQuestionIndex: 0,
      answers: [],
      startTime: new Date()
    });
    
    // Update contest participant count
    await Contest.findByIdAndUpdate(
      contest._id,
      { $inc: { participantsCount: 1 } }
    );
    
    res.status(201).json({
      success: true,
      message: 'Successfully registered for the contest',
      data: participation
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error participating in contest',
      error: err.message
    });
  }
};

// @desc    Get contest leaderboard
// @route   GET /api/contests/:contestId/leaderboard
// @access  Public/Private (depending on contest type)
exports.getLeaderboard = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.contestId);
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }
    
    // Check access permissions for VIP contests
    if (contest.isVipOnly) {
      // For VIP contests, ensure user is authenticated and VIP
      if (!req.user || (req.user.userType !== 'VIP' && !req.user.isAdmin)) {
        return res.status(403).json({
          success: false,
          message: 'Access to VIP contest leaderboard is restricted'
        });
      }
    }
    
    // For non-live contests, normal users should only see their own results
    if (contest.status !== 'live' && !contest.isVipOnly && req.user && !req.user.isAdmin && req.user.userType !== 'VIP') {
      const userPosition = await Leaderboard.findOne({
        contestId: contest._id,
        userId: req.user._id
      }).populate('userId', 'name');
      
      if (!userPosition) {
        return res.status(404).json({
          success: false,
          message: 'You are not on the leaderboard for this contest'
        });
      }
      
      // Find user's rank
      const higherScores = await Leaderboard.countDocuments({
        contestId: contest._id,
        $or: [
          { score: { $gt: userPosition.score } },
          {
            score: userPosition.score,
            submissionTime: { $lt: userPosition.submissionTime }
          }
        ]
      });
      
      return res.status(200).json({
        success: true,
        data: {
          myPosition: {
            rank: higherScores + 1,
            name: userPosition.userId.name,
            score: userPosition.score,
            submissionTime: userPosition.submissionTime
          }
        }
      });
    }
    
    // Get the leaderboard with pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    const leaderboard = await Leaderboard.find({ contestId: contest._id })
      .populate('userId', 'name')
      .sort({ score: -1, submissionTime: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Leaderboard.countDocuments({ contestId: contest._id });
    
    res.status(200).json({
      success: true,
      count: leaderboard.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: leaderboard.map((entry, index) => ({
        rank: skip + index + 1,
        userId: entry.userId._id,
        name: entry.userId.name,
        score: entry.score,
        submissionTime: entry.submissionTime
      }))
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving leaderboard',
      error: err.message
    });
  }
};

// @desc    Submit answer for current question
// @route   POST /api/contests/:contestId/submit-answer
// @access  Private
exports.submitAnswer = async (req, res) => {
  try {
    const { questionIndex, selectedOptions } = req.body;
    
    if (questionIndex === undefined || selectedOptions === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide questionIndex and selectedOptions'
      });
    }
    
    // Get the participation
    const participation = await Participation.findOne({
      contestId: req.params.contestId,
      userId: req.user._id,
      submissionState: 'pending'
    });
    
    if (!participation) {
      return res.status(404).json({
        success: false,
        message: 'No active participation found for this contest'
      });
    }
    
    // Check if the answer is for the current question
    if (questionIndex !== participation.currentQuestionIndex) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question index'
      });
    }
    
    // Get the contest and the current question
    const contest = await Contest.findById(req.params.contestId).populate({
      path: 'questions',
      options: { limit: 1, skip: questionIndex }
    });
    
    if (!contest || !contest.questions || contest.questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contest or question not found'
      });
    }
    
    const currentQuestion = contest.questions[0];
    
    // Check if time limit is respected (1 minute per question)
    const currentTime = new Date();
    const questionStartTime = new Date(participation.updatedAt);
    const elapsedSeconds = (currentTime - questionStartTime) / 1000;
    
    if (elapsedSeconds > config.QUESTION_TIME_LIMIT) {
      return res.status(400).json({
        success: false,
        message: 'Time limit exceeded for this question'
      });
    }
    
    // Calculate score for the answer
    let scoreForQuestion = 0;
    let isCorrect = false;
    
    if (currentQuestion.questionType === 'single' || currentQuestion.questionType === 'boolean') {
      // For single and boolean, selectedOptions should be a single index
      if (selectedOptions === currentQuestion.correctOption) {
        scoreForQuestion = currentQuestion.score;
        isCorrect = true;
      }
    } else if (currentQuestion.questionType === 'multiple') {
      // For multiple choice, selectedOptions should be an array of indices
      // Check if arrays have same length and same elements (order doesn't matter)
      if (Array.isArray(selectedOptions) && 
          Array.isArray(currentQuestion.correctOption) &&
          selectedOptions.length === currentQuestion.correctOption.length &&
          selectedOptions.every(item => currentQuestion.correctOption.includes(item))) {
        scoreForQuestion = currentQuestion.score;
        isCorrect = true;
      }
    }
    
    // Save the answer
    participation.answers.push({
      questionId: currentQuestion._id,
      selectedOptions
    });
    
    // Update score
    participation.score += scoreForQuestion;
    
    // Move to next question
    participation.currentQuestionIndex += 1;
    
    // Check if all questions have been answered
    if (participation.currentQuestionIndex >= config.QUESTIONS_PER_CONTEST) {
      participation.submissionState = 'submitted';
      participation.submissionTime = new Date();
      
      // Update leaderboard
      await Leaderboard.create({
        contestId: contest._id,
        userId: req.user._id,
        participationId: participation._id,
        score: participation.score,
        submissionTime: participation.submissionTime
      });
    }
    
    await participation.save();
    
    res.status(200).json({
      success: true,
      message: isCorrect ? 'Correct answer!' : 'Incorrect answer',
      data: {
        isCorrect,
        scoreForQuestion,
        totalScore: participation.score,
        nextQuestionIndex: participation.currentQuestionIndex,
        isContestCompleted: participation.submissionState === 'submitted'
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error submitting answer',
      error: err.message
    });
  }
};

// @desc    Submit entire contest (for time-up cases)
// @route   POST /api/contests/:contestId/submit-contest
// @access  Private
exports.submitContest = async (req, res) => {
  try {
    // Get the participation
    const participation = await Participation.findOne({
      contestId: req.params.contestId,
      userId: req.user._id,
      submissionState: 'pending'
    });
    
    if (!participation) {
      return res.status(404).json({
        success: false,
        message: 'No active participation found for this contest'
      });
    }
    
    // Mark as submitted
    participation.submissionState = 'submitted';
    participation.submissionTime = new Date();
    
    await participation.save();
    
    // Update leaderboard
    await Leaderboard.create({
      contestId: req.params.contestId,
      userId: req.user._id,
      participationId: participation._id,
      score: participation.score,
      submissionTime: participation.submissionTime
    });
    
    res.status(200).json({
      success: true,
      message: 'Contest submitted successfully',
      data: {
        totalScore: participation.score,
        questionsAnswered: participation.answers.length
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error submitting contest',
      error: err.message
    });
  }
};