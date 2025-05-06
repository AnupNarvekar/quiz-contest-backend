const mongoose = require('mongoose');

const ParticipationSchema = new mongoose.Schema({
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  submissionState: {
    type: String,
    enum: ['pending', 'submitted'],
    default: 'pending'
  },
  submissionTime: {
    type: Date
  },
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    selectedOptions: mongoose.Schema.Types.Mixed // Can be a number or array of numbers
  }],
  startTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create a compound index to ensure a user can participate in a contest only once
ParticipationSchema.index({ contestId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Participation', ParticipationSchema);