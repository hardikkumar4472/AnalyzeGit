const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const { Queue } = require('bullmq');
const jwt = require('jsonwebtoken');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Analysis Service: MongoDB Connected'))
    .catch((err) => {
        console.error('Analysis Service DB Connection Error:', err);
        process.exit(1);
    });

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new Redis(redisUrl, { maxRetriesPerRequest: null });
const redisPub = new Redis(redisUrl, { maxRetriesPerRequest: null });
const analysisQueue = new Queue('analysis-queue', { connection: redis });

const analysisSchema = new mongoose.Schema({
    url: { type: String, required: true },
    type: { type: String, enum: ['user', 'repo'], required: true },
    lang: { type: String, default: 'en' },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    metadata: {
        name: String,
        avatar: String,
        url: String,
        language: String,
        lastUpdate: String
    },
    analysis: {
        score: Number,
        goodPoints: [String],
        badPoints: [String],
        summary: String
    },
    createdAt: { type: Date, default: Date.now }
});

const Analysis = mongoose.model('Analysis', analysisSchema);

const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = { _id: decoded.id };
            return next();
        } catch (error) {
            return res.status(401).json({ error: 'Not authorized, token failed' });
        }
    }
    if (!token) return res.status(401).json({ error: 'Not authorized, no token' });
};

const checkAuth = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = { _id: decoded.id };
        } catch (error) {}
    }
    next();
};

const { register, metricsMiddleware, auditJobsCounter } = require('./metrics');

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware('analysis-service'));

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (ex) {
        res.status(500).end(ex.message);
    }
});

app.post('/analyze', checkAuth, async (req, res) => {
    const { url, lang = 'en', socketId } = req.body;
    const userId = req.user ? req.user._id.toString() : 'anonymous';
    console.log(`[ANALYSIS SERVICE] Request for: ${url} by ${userId}`);

    if (!url) {
        return res.status(400).json({ error: 'GitHub URL is required' });
    }

    try {
        const CACHE_EXPIRATION_DAYS = 3;
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() - CACHE_EXPIRATION_DAYS);

        const existingAnalysis = await Analysis.findOne({
            url,
            lang,
            createdAt: { $gte: expirationDate }
        });

        if (existingAnalysis) {
            console.log(`Serving cached analysis for ${url}`);

            if (userId !== 'anonymous') {
                if (!existingAnalysis.users.includes(userId)) {
                    existingAnalysis.users.push(userId);
                    await existingAnalysis.save();
                }
            }

            const room = (userId === 'anonymous' && socketId) ? `socket-${socketId}` : `user-${userId}`;
            
            redisPub.publish('analysisEvents', JSON.stringify({
                room,
                event: 'analysis-complete',
                data: {
                    type: existingAnalysis.type,
                    metadata: existingAnalysis.metadata,
                    analysis: existingAnalysis.analysis
                }
            }));

            return res.status(200).json({
                success: true,
                status: 'cached',
                message: 'Analysis served from cache.',
                data: existingAnalysis
            });
        }

        console.log(`Enqueuing fresh analysis job for ${url}`);
        const job = await analysisQueue.add('analyze', {
            url,
            userId,
            socketId,
            lang
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000
            }
        });

        res.status(202).json({
            success: true,
            status: 'pending',
            jobId: job.id,
            message: 'Analysis started. Progress will be sent via Socket.io.'
        });

    } catch (error) {
        console.error('Analysis Service Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
});

app.get('/history', protect, async (req, res) => {
    try {
        const history = await Analysis.find({ users: req.user._id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'analysis-service' });
});

const PORT = process.env.PORT_ANALYSIS || 5004;
app.listen(PORT, () => {
    console.log(`Analysis Service running on port ${PORT}`);
});
