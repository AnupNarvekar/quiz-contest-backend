const Contest = require('../models/Contest');
const Question = require('../models/Question');
const User = require('../models/User');
const Participation = require('../models/Participation');
const Leaderboard = require('../models/Leaderboard');
const Prize = require('../models/Prize');
const { getRedisClient } = require('../config/redis');
const crypto = require('crypto');
const config = require('../config/config');

// @desc    Create a new contest
// @route   POST /api/admin/contests
// @access  Private (Admin only)
exports.createContest = async (req, res) => {
  try {
    const { 
      contestName, 
      description, 
      startTime, 
      endTime, 
      prize, 
      isVipOnly,
      maxParticipants,
      minParticipants,
      questions
    } = req.body;
    
    // Validate required fields
    if (!contestName || !description || !startTime || !endTime || !prize) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    // Validate date
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }
    
    // Validate questions (must be exactly 15)
    if (!questions || !Array.isArray(questions) || questions.length !== config.QUESTIONS_PER_CONTEST) {
      return res.status(400).json({
        success: false,
        message: `Contest must have exactly ${config.QUESTIONS_PER_CONTEST} questions`
      });
    }
    
    // Create a new contest
    const contest = await Contest.create({
      contestName,
      description,
      startTime,
      endTime,
      prize,
      isVipOnly: isVipOnly || false,
      maxParticipants: maxParticipants || config.MAX_PARTICIPANTS,
      minParticipants: minParticipants || config.MIN_PARTICIPANTS,
      createdBy: req.user._id
    });
    
    // Create questions for the contest
    const questionIds = [];
    
    for (const questionData of questions) {
      // Generate hash for the question
      const hash = crypto
        .createHash('sha256')
        .update(questionData.question)
        .digest('hex');
      
      // Create question
      const question = await Question.create({
        contestId: contest._id,
        question: questionData.question,
        hash,
        questionType: questionData.questionType,
        options: questionData.options,
        correctOption: questionData.correctOption,
        score: questionData.score || config.POINTS_PER_CORRECT_ANSWER
      });
      
      questionIds.push(question._id);
    }
    
    // Update contest with question ids
    contest.questions = questionIds;
    await contest.save();
    
    // Clear cache
    const redisClient = await getRedisClient();
    await redisClient.del('contests:*');
    
    res.status(201).json({
      success: true,
      message: 'Contest created successfully',
      data: contest
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error creating contest',
      error: err.message
    });
  }
};

// @desc    Update a contest
// @route   PUT /api/admin/contests/:id
// @access  Private (Admin only)
exports.updateContest = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }
    
    // Check if contest can be updated (only pending contests can be updated)
    if (contest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot update a contest with status: ${contest.status}`
      });
    }
    
    // Update contest
    const { contestName, description, startTime, endTime, prize, isVipOnly, maxParticipants, minParticipants } = req.body;
    
    const updatedContest = await Contest.findByIdAndUpdate(
      req.params.id,
      {
        contestName: contestName || contest.contestName,
        description: description || contest.description,
        startTime: startTime || contest.startTime,
        endTime: endTime || contest.endTime,
        prize: prize || contest.prize,
        isVipOnly: isVipOnly !== undefined ? isVipOnly : contest.isVipOnly,
        maxParticipants: maxParticipants || contest.maxParticipants,
        minParticipants: minParticipants || contest.minParticipants
      },
      { new: true }
    );
    
    // Clear cache
    const redisClient = await getRedisClient();
    await redisClient.del('contests:*');
    
    res.status(200).json({
      success: true,
      message: 'Contest updated successfully',
      data: updatedContest
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating contest',
      error: err.message
    });
  }
};

// @desc    Delete a contest
// @route   DELETE /api/admin/contests/:id
// @access  Private (Admin only)
exports.deleteContest = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }
    
    // Check if contest can be deleted (only pending contests with no participants)
    if (contest.status !== 'pending' || contest.participantsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a contest that is not in pending status or has participants'
      });
    }
    
    // Delete related questions
    await Question.deleteMany({ contestId: contest._id });
    
    // Delete contest
    await Contest.findByIdAndDelete(contest._id);
    
    // Clear cache
    const redisClient = await getRedisClient();
    await redisClient.del('contests:*');
    
    res.status(200).json({
      success: true,
      message: 'Contest and related questions deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error deleting contest',
      error: err.message
    });
  }
};

// @desc    Cancel a contest
// @route   PUT /api/admin/contests/:id/cancel
// @access  Private (Admin only)
exports.cancelContest = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }
    
    // Check if contest can be cancelled (only pending contests can be cancelled)
    if (contest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a contest with status: ${contest.status}`
      });
    }
    
    // Update contest status
    contest.status = 'cancelled';
    await contest.save();
    
    // Clear cache
    const redisClient = await getRedisClient();
    await redisClient.del('contests:*');
    
    res.status(200).json({
      success: true,
      message: 'Contest cancelled successfully',
      data: contest
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling contest',
      error: err.message
    });
  }
};

// @desc    Get all contests (admin view)
// @route   GET /api/admin/contests
// @access  Private (Admin only)
exports.getAllContests = async (req, res) => {
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
    
    // Filter by VIP type if provided
    if (req.query.vipOnly === 'true') {
      query.isVipOnly = true;
    } else if (req.query.vipOnly === 'false') {
      query.isVipOnly = false;
    }
    
    const contests = await Contest.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Contest.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: contests.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: contests
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving contests',
      error: err.message
    });
  }
};

// @desc    Get all users (admin view)
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    
    // Filter by user type if provided
    if (req.query.userType) {
      query.userType = req.query.userType;
    }
    
    // Filter by admin status if provided
    if (req.query.isAdmin === 'true') {
      query.isAdmin = true;
    } else if (req.query.isAdmin === 'false') {
      query.isAdmin = false;
    }
    
    const users = await User.find(query)
      .select('name email userType isAdmin createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: users.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: users
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving users',
      error: err.message
    });
  }
};

// @desc    Update user (admin view)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update user
    const { name, userType, isAdmin } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: name || user.name,
        userType: userType || user.userType,
        isAdmin: isAdmin !== undefined ? isAdmin : user.isAdmin
      },
      { new: true }
    ).select('name email userType isAdmin');
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: err.message
    });
  }
};

// @desc    Award prize to user
// @route   POST /api/admin/prizes
// @access  Private (Admin only)
exports.awardPrize = async (req, res) => {
  try {
    const { userId, contestId, prize } = req.body;
    
    if (!userId || !contestId || !prize) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId, contestId, and prize'
      });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if contest exists
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }
    
    // Check if contest is completed
    if (contest.status !== 'complete') {
      return res.status(400).json({
        success: false,
        message: 'Prize can only be awarded for completed contests'
      });
    }
    
    // Check if user participated in the contest
    const participation = await Participation.findOne({
      userId,
      contestId,
      submissionState: 'submitted'
    });
    
    if (!participation) {
      return res.status(400).json({
        success: false,
        message: 'User did not participate in this contest'
      });
    }
    
    // Create prize record
    const prizeRecord = await Prize.create({
      userId,
      contestId,
      prize,
      wonAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      message: 'Prize awarded successfully',
      data: prizeRecord
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error awarding prize',
      error: err.message
    });
  }
};

// @desc    Get all participations (admin view)
// @route   GET /api/admin/participations
// @access  Private (Admin only)
exports.getAllParticipations = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    
    // Filter by contestId if provided
    if (req.query.contestId) {
      query.contestId = req.query.contestId;
    }
    
    // Filter by userId if provided
    if (req.query.userId) {
      query.userId = req.query.userId;
    }
    
    // Filter by submission state if provided
    if (req.query.submissionState) {
      query.submissionState = req.query.submissionState;
    }
    
    const participations = await Participation.find(query)
      .populate('userId', 'name email userType')
      .populate('contestId', 'contestName status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Participation.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: participations.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: participations
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving participations',
      error: err.message
    });
  }
};

// @desc    Get all prizes (admin view)
// @route   GET /api/admin/prizes
// @access  Private (Admin only)
exports.getAllPrizes = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    
    // Filter by contestId if provided
    if (req.query.contestId) {
      query.contestId = req.query.contestId;
    }
    
    // Filter by userId if provided
    if (req.query.userId) {
      query.userId = req.query.userId;
    }
    
    const prizes = await Prize.find(query)
      .populate('userId', 'name email userType')
      .populate('contestId', 'contestName')
      .sort({ wonAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Prize.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: prizes.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: prizes
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving prizes',
      error: err.message
    });
  }
};