const express = require('express');
const router = express.Router();
const { performAnalysis, getUserHistory } = require('../controllers/analyzeController');
const { protect, checkAuth } = require('../middleware/authMiddleware');
const { analyzeRateLimiter } = require('../middleware/rateLimiter');

router.post('/analyze', analyzeRateLimiter, checkAuth, performAnalysis);
router.get('/history', protect, getUserHistory);

module.exports = router;
