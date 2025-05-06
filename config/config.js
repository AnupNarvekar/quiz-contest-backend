module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'quiz-contest-secret-key',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
  QUESTIONS_PER_CONTEST: 15,
  QUESTION_TIME_LIMIT: 60, // 1 minute per question in seconds
  POINTS_PER_CORRECT_ANSWER: 5,
  MAX_SCORE_PER_CONTEST: 75,
  MIN_PARTICIPANTS: 3,
  MAX_PARTICIPANTS: 50,
  REDIS_CACHE_EXPIRE: 3600, // 1 hour in seconds
};