const express = require('express');
const router = express.Router();
const { 
  createContest,
  updateContest,
  deleteContest,
  cancelContest,
  getAllContests,
  getAllUsers,
  updateUser,
  awardPrize,
  getAllParticipations,
  getAllPrizes
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting
router.use(apiLimiter);

// Apply authentication and admin authorization to all routes
router.use(protect);
router.use(authorize('admin'));

// Contest routes
router.route('/contests')
  .post(createContest)
  .get(getAllContests);

router.route('/contests/:id')
  .put(updateContest)
  .delete(deleteContest);

router.put('/contests/:id/cancel', cancelContest);

// User routes
router.route('/users')
  .get(getAllUsers);

router.route('/users/:id')
  .put(updateUser);

// Participation routes
router.route('/participations')
  .get(getAllParticipations);

// Prize routes
router.route('/prizes')
  .post(awardPrize)
  .get(getAllPrizes);

module.exports = router;