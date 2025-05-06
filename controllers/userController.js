const User = require('../models/User');
const Participation = require('../models/Participation');
const Prize = require('../models/Prize');

// @desc    Get current logged in user
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving user information',
      error: err.message
    });
  }
};

// @desc    Upgrade to VIP
// @route   POST /api/users/vip
// @access  Private
exports.upgradeToVip = async (req, res) => {
  try {
    // In a real-world scenario, this would include payment processing
    // For this implementation, we'll just update the user type
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { userType: 'VIP' },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Successfully upgraded to VIP',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error upgrading to VIP',
      error: err.message
    });
  }
};

// @desc    Get user participations
// @route   GET /api/users/participations
// @access  Private
exports.getParticipations = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    const participations = await Participation.find({ userId: req.user.id })
      .populate('contestId', 'contestName description status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Participation.countDocuments({ userId: req.user.id });
    
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

// @desc    Get user prizes
// @route   GET /api/users/prizes
// @access  Private
exports.getPrizes = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    const prizes = await Prize.find({ userId: req.user.id })
      .populate('contestId', 'contestName')
      .sort({ wonAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Prize.countDocuments({ userId: req.user.id });
    
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