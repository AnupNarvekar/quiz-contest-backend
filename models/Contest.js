const mongoose = require('mongoose');
const config = require('../config/config');

const ContestSchema = new mongoose.Schema({
  contestName: {
    type: String,
    required: [true, 'Please add a contest name'],
    trim: true,
    maxlength: [100, 'Contest name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  startTime: {
    type: Date,
    required: [true, 'Please add a start time']
  },
  endTime: {
    type: Date,
    required: [true, 'Please add an end time']
  },
  prize: {
    type: String,
    required: [true, 'Please add prize details']
  },
  status: {
    type: String,
    enum: ['cancelled', 'pending', 'live', 'complete'],
    default: 'pending'
  },
  participantsCount: {
    type: Number,
    default: 0
  },
  maxParticipants: {
    type: Number,
    default: config.MAX_PARTICIPANTS
  },
  minParticipants: {
    type: Number,
    default: config.MIN_PARTICIPANTS
  },
  isVipOnly: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Validate the number of questions
ContestSchema.pre('save', function(next) {
  if (this.questions && this.questions.length !== config.QUESTIONS_PER_CONTEST) {
    throw new Error(`Contest must have exactly ${config.QUESTIONS_PER_CONTEST} questions`);
  }
  next();
});

module.exports = mongoose.model('Contest', ContestSchema);