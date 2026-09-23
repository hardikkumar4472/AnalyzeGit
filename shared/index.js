const db = require('./db');
const getRedisClient = require('./redis');
const { protect, checkAuth } = require('./authMiddleware');
const metrics = require('./metrics');

module.exports = {
    connectDB: db,
    getRedisClient,
    protect,
    checkAuth,
    ...metrics
};
