const mongoose = require('mongoose');
const crypto = require('crypto');
const config = require('../config/config');

const QuestionSchema = new mongoose.Schema({
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    required: true
  },
  question: {
    type: String,
    required: [true, 'Please add a question'],
    trim: true
  },
  hash: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    enum: ['single', 'multiple', 'boolean'],
    required: [true, 'Please specify question type']
  },
  options: {
    type: [String],
    required: [true, 'Please add options']
  },
  correctOption: {
    type: mongoose.Schema.Types.Mixed, // Can be a number (index) or array of numbers (indices)
    required: [true, 'Please specify the correct option(s)']
  },
  score: {
    type: Number,
    default: config.POINTS_PER_CORRECT_ANSWER
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate hash before saving
QuestionSchema.pre('save', function(next) {
  // Generate SHA-256 hash of the question text for uniqueness check
  if (!this.hash) {
    this.hash = crypto
      .createHash('sha256')
      .update(this.question)
      .digest('hex');
  }
  next();
});

// Validate options based on question type
QuestionSchema.pre('save', function(next) {
  // For boolean, only 2 options are allowed (true/false)
  if (this.questionType === 'boolean' && this.options.length !== 2) {
    throw new Error('Boolean questions must have exactly 2 options');
  }
  
  // For single choice, correctOption must be a single index
  if (this.questionType === 'single' && typeof this.correctOption !== 'number') {
    throw new Error('Single choice questions must have a single correct option index');
  }
  
  // For multiple choice, correctOption must be an array of indices
  if (this.questionType === 'multiple' && !Array.isArray(this.correctOption)) {
    throw new Error('Multiple choice questions must have an array of correct option indices');
  }
  
  next();
});

module.exports = mongoose.model('Question', QuestionSchema);