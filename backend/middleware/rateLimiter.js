const rateLimit = require('express-rate-limit');

const analyzeRateLimiter = rateLimit({
    windowMs: 15 * 1000, 
    max: 1, 
    message: {
        error: 'Too many requests. Please wait 15 seconds between each repository analysis.'
    },
    standardHeaders: true, 
    legacyHeaders: false, 
});

module.exports = { analyzeRateLimiter };
