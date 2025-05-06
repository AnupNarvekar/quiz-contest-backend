const redis = require('redis');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    await redisClient.connect();
    
    redisClient.on('error', (err) => {
      console.error('Redis Client Error', err);
    });
    
    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });
    
    return redisClient;
  } catch (error) {
    console.error(`Error connecting to Redis: ${error.message}`);
    process.exit(1);
  }
};

const getRedisClient = async () => {
  if (!redisClient) {
    await connectRedis();
  }
  return redisClient;
};

module.exports = { connectRedis, getRedisClient };