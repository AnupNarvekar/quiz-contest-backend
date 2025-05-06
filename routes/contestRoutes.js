const express = require('express');
const router = express.Router();
const { 
  getContests, 
  getContest, 
  participateInContest, 
  getLeaderboard, 
  submitAnswer, 
  submitContest 
} = require('../controllers/contestController');
const { protect, authorize } = require('../middleware/auth');
const { checkContestExists, canParticipate, hasActiveParticipation, validateQuestionSubmission } = require('../middleware/contest');
const { apiLimiter, participationLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting
router.use(apiLimiter);

// Get all contests (public with filtering)
router.get('/', getContests);

// Get single contest
router.get('/:contestId', protect, checkContestExists, getContest);

// Participate in a contest (apply participation limiter)
router.post('/:contestId/participate', protect, participationLimiter, checkContestExists, canParticipate, participateInContest);

// Get contest leaderboard
router.get('/:contestId/leaderboard', checkContestExists, getLeaderboard);

// Submit answer for current question
router.post('/:contestId/submit-answer', protect, checkContestExists, hasActiveParticipation, validateQuestionSubmission, submitAnswer);

// Submit entire contest
router.post('/:contestId/submit-contest', protect, checkContestExists, hasActiveParticipation, submitContest);

module.exports = router;