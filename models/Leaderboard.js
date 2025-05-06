const mongoose = require('mongoose');

const LeaderboardSchema = new mongoose.Schema({
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
  participationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participation',
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  submissionTime: {
    type: Date
  }
}, {
  timestamps: true
});

// Create a compound index on contestId and score for efficient leaderboard queries
LeaderboardSchema.index({ contestId: 1, score: -1, submissionTime: 1 });

module.exports = mongoose.model('Leaderboard', LeaderboardSchema);