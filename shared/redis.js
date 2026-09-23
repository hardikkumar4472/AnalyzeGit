const Redis = require('ioredis');

const getRedisClient = () => {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    const redisConnection = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        retryStrategy: (times) => {
            const delay = Math.min(times * 100, 3000);
            return delay;
        }
    });

    redisConnection.on('connect', () => console.log('Redis Connected Successfully'));
    redisConnection.on('error', (err) => console.error('Redis Connection Error:', err));
    return redisConnection;
};

module.exports = getRedisClient;
