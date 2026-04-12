const Redis = require('ioredis');
const dotenv = require('dotenv');
dotenv.config();
const redisConnection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
        return delay;
    }
});
redisConnection.on('connect', () => console.log('Redis Connected Successfully'));
redisConnection.on('error', (err) => console.error('Redis Connection Error:', err));
module.exports = redisConnection;
