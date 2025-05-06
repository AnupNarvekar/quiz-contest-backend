const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

// Import models
const User = require('../models/User');
const Contest = require('../models/Contest');
const Question = require('../models/Question');
const Participation = require('../models/Participation');
const Leaderboard = require('../models/Leaderboard');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/quiz-contest', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Generate SHA-256 hash
const generateHash = (text) => {
  return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex');
};

// Sample data
const adminUsers = [
  {
    name: 'Admin User 1',
    email: 'admin1@example.com',
    password: bcrypt.hashSync('password123', 10),
    userType: 'Normal',
    isAdmin: true,
  },
  {
    name: 'Admin User 2',
    email: 'admin2@example.com',
    password: bcrypt.hashSync('password123', 10),
    userType: 'Normal',
    isAdmin: true,
  },
];

const vipUsers = [
  {
    name: 'VIP User 1',
    email: 'vip1@example.com',
    password: bcrypt.hashSync('password123', 10),
    userType: 'VIP',
    isAdmin: false,
  },
  {
    name: 'VIP User 2',
    email: 'vip2@example.com',
    password: bcrypt.hashSync('password123', 10),
    userType: 'VIP',
    isAdmin: false,
  },
  {
    name: 'VIP User 3',
    email: 'vip3@example.com',
    password: bcrypt.hashSync('password123', 10),
    userType: 'VIP',
    isAdmin: false,
  },
];

const normalUsers = [
  {
    name: 'Normal User 1',
    email: 'user1@example.com',
    password: bcrypt.hashSync('password123', 10),
    userType: 'Normal',
    isAdmin: false,
  },
  {
    name: 'Normal User 2',
    email: 'user2@example.com',
    password: bcrypt.hashSync('password123', 10),
    userType: 'Normal',
    isAdmin: false,
  },
  {
    name: 'Normal User 3',
    email: 'user3@example.com',
    password: bcrypt.hashSync('password123', 10),
    userType: 'Normal',
    isAdmin: false,
  },
  {
    name: 'Normal User 4',
    email: 'user4@example.com',
    password: bcrypt.hashSync('password123', 10),
    userType: 'Normal',
    isAdmin: false,
  },
  {
    name: 'Normal User 5',
    email: 'user5@example.com',
    password: bcrypt.hashSync('password123', 10),
    userType: 'Normal',
    isAdmin: false,
  },
];

// Sample questions for contests
const generateQuestions = (contestId, prefix) => {
  const questions = [];

  // Generate single choice questions
  for (let i = 1; i <= 5; i++) {
    const question = `${prefix} Single Choice Question ${i}`;
    questions.push({
      contestId,
      question,
      hash: generateHash(question),
      questionType: 'single',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctOption: Math.floor(Math.random() * 4), // Random index between 0-3
      score: 5,
    });
  }

  // Generate multiple choice questions
  for (let i = 1; i <= 5; i++) {
    const question = `${prefix} Multiple Choice Question ${i}`;
    questions.push({
      contestId,
      question,
      hash: generateHash(question),
      questionType: 'multiple',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctOption: [0, 2], // First and third options
      score: 5,
    });
  }

  // Generate boolean questions
  for (let i = 1; i <= 5; i++) {
    const question = `${prefix} Boolean Question ${i}`;
    questions.push({
      contestId,
      question,
      hash: generateHash(question),
      questionType: 'boolean',
      options: ['True', 'False'],
      correctOption: i % 2, // Alternating between 0 and 1
      score: 5,
    });
  }

  return questions;
};

// Function to seed data
const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Contest.deleteMany({});
    await Question.deleteMany({});
    await Participation.deleteMany({});
    await Leaderboard.deleteMany({});

    console.log('Data cleared');

    // Insert admin users
    const createdAdmins = await User.insertMany(adminUsers);
    console.log(`${createdAdmins.length} admin users created`);

    // Insert VIP users
    const createdVips = await User.insertMany(vipUsers);
    console.log(`${createdVips.length} VIP users created`);

    // Insert normal users
    const createdNormalUsers = await User.insertMany(normalUsers);
    console.log(`${createdNormalUsers.length} normal users created`);

    // Create normal contests
    const normalContests = [];
    for (let i = 1; i <= 3; i++) {
      normalContests.push({
        contestName: `Normal Contest ${i}`,
        description: `This is a normal contest open to all users. Contest number ${i}.`,
        startTime: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)), // Start i days from now
        endTime: new Date(Date.now() + (i * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000)), // 2 hours duration
        prize: `Prize for Normal Contest ${i}`,
        status: 'pending',
        isVipOnly: false,
        createdBy: createdAdmins[0]._id,
        questions: [],
      });
    }

    const createdNormalContests = await Contest.insertMany(normalContests);
    console.log(`${createdNormalContests.length} normal contests created`);

    // Create VIP contests
    const vipContests = [];
    for (let i = 1; i <= 2; i++) {
      vipContests.push({
        contestName: `VIP Contest ${i}`,
        description: `This is a VIP-only contest. Contest number ${i}.`,
        startTime: new Date(Date.now() + (i * 48 * 60 * 60 * 1000)), // Start i*2 days from now
        endTime: new Date(Date.now() + (i * 48 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000)), // 2 hours duration
        prize: `Premium Prize for VIP Contest ${i}`,
        status: 'pending',
        isVipOnly: true,
        createdBy: createdAdmins[1]._id,
        questions: [],
      });
    }

    const createdVipContests = await Contest.insertMany(vipContests);
    console.log(`${createdVipContests.length} VIP contests created`);

    // Create questions for normal contests
    for (const contest of createdNormalContests) {
      const questions = generateQuestions(contest._id, `Normal ${contest.contestName}`);
      const createdQuestions = await Question.insertMany(questions);

      // Update contest with question IDs
      await Contest.findByIdAndUpdate(contest._id, {
        questions: createdQuestions.map(q => q._id)
      });

      console.log(`${createdQuestions.length} questions created for ${contest.contestName}`);
    }

    // Create questions for VIP contests
    for (const contest of createdVipContests) {
      const questions = generateQuestions(contest._id, `VIP ${contest.contestName}`);
      const createdQuestions = await Question.insertMany(questions);

      // Update contest with question IDs
      await Contest.findByIdAndUpdate(contest._id, {
        questions: createdQuestions.map(q => q._id)
      });

      console.log(`${createdQuestions.length} questions created for ${contest.contestName}`);
    }

    // Create some participations for normal contests
    const normalContest = createdNormalContests[0];
    const participants = createdNormalUsers.slice(0, 3); // First 3 normal users

    for (const user of participants) {
      const participation = await Participation.create({
        contestId: normalContest._id,
        userId: user._id,
        score: Math.floor(Math.random() * 50), // Random score between 0-49
        submissionState: 'submitted',
        submissionTime: new Date(),
        currentQuestionIndex: 15, // Completed all questions
        answers: [],
      });

      // Create leaderboard entry
      await Leaderboard.create({
        contestId: normalContest._id,
        userId: user._id,
        participationId: participation._id,
        score: participation.score,
        submissionTime: participation.submissionTime,
      });

      console.log(`Participation created for ${user.name} in ${normalContest.contestName}`);
    }

    // Update contest participant count
    await Contest.findByIdAndUpdate(normalContest._id, {
      participantsCount: participants.length
    });

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database', error);
    process.exit(1);
  }
};

// Run seeder
seedData();