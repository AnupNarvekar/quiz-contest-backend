const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

// Rate limit auth routes
router.use(authLimiter);

// Register a user
router.post('/register', register);

// Login a user
router.post('/login', login);

module.exports = router;