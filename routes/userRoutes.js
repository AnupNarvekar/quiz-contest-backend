const express = require('express');
const router = express.Router();
const { getMe, upgradeToVip, getParticipations, getPrizes } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting
router.use(apiLimiter);

// Get current user
router.get('/me', protect, getMe);

// Upgrade to VIP
router.post('/vip', protect, upgradeToVip);

// Get user participations
router.get('/participations', protect, getParticipations);

// Get user prizes
router.get('/prizes', protect, getPrizes);

module.exports = router;