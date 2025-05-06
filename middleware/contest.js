const Contest = require('../models/Contest');
const Participation = require('../models/Participation');
const config = require('../config/config');

// Middleware to check if contest exists
exports.checkContestExists = async (req, res, next) => {
  try {
    const contest = await Contest.findById(req.params.contestId);

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }

    // Add contest to request object
    req.contest = contest;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error checking contest existence',
      error: err.message
    });
  }
};

// Middleware to check if user can participate in contest
exports.canParticipate = async (req, res, next) => {
  try {
    const contest = req.contest;
    const user = req.user;

    // Check if contest is in pending status
    if (contest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot participate in a contest with status: ${contest.status}`
      });
    }

    // Check if the contest is VIP only and user is not VIP
    if (contest.isVipOnly && user.userType !== 'VIP') {
      return res.status(403).json({
        success: false,
        message: 'This contest is for VIP users only'
      });
    }

    // Check if max participants limit reached
    if (contest.participantsCount >= contest.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Contest has reached maximum participants limit'
      });
    }

    // Check if user is already participating in another ongoing contest
    const activeParticipation = await Participation.findOne({
      userId: user._id,
      submissionState: 'pending'
    });

    if (activeParticipation) {
      const activeContest = await Contest.findById(activeParticipation.contestId);
      if (activeContest && (activeContest.status === 'pending' || activeContest.status === 'live')) {
        return res.status(400).json({
          success: false,
          message: 'You are already participating in another contest'
        });
      }
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error checking participation eligibility',
      error: err.message
    });
  }
};

// Middleware to check if user has active participation in the contest
exports.hasActiveParticipation = async (req, res, next) => {
  try {
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

    // Add participation to request object
    req.participation = participation;
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error checking active participation',
      error: err.message
    });
  }
};

// Check if question index is valid and if time limit is respected
exports.validateQuestionSubmission = async (req, res, next) => {
  try {
    const participation = req.participation;
    
    // Check if the answer is for the current question
    if (req.body.questionIndex !== participation.currentQuestionIndex) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question index'
      });
    }
    
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
    
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error validating question submission',
      error: err.message
    });
  }
};