const express = require('express');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const { createProxyMiddleware } = require('http-proxy-middleware');
const Redis = require('ioredis');
const { register, metricsMiddleware } = require('./metrics');

dotenv.config();

const app = express();
app.use(metricsMiddleware('api-gateway'));

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (ex) {
        res.status(500).end(ex.message);
    }
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redisSub = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 100, 3000)
});

redisSub.subscribe('analysisEvents', 'jobUpdate', 'candidateUpdate', (err, count) => {
    if (err) {
        console.error('[GATEWAY REDIS SUB] Failed to subscribe to channels:', err);
    } else {
        console.log(`[GATEWAY REDIS SUB] Subscribed successfully to ${count} channels.`);
    }
});

redisSub.on('message', (channel, message) => {
    try {
        const payload = JSON.parse(message);
        if (channel === 'analysisEvents') {
            const { room, event, data } = payload;
            if (room && event) {
                io.to(room).emit(event, data);
            }
        } else if (channel === 'jobUpdate') {
            const { recruiterId, action, job, jobId } = payload;
            if (recruiterId) {
                io.emit(`jobUpdate:${recruiterId}`, { action, job, jobId });
            }
        } else if (channel === 'candidateUpdate') {
            const { recruiterId, action, candidate, jobId } = payload;
            if (recruiterId) {
                io.emit(`candidateUpdate:${recruiterId}`, { action, candidate, jobId });
            }
        }
    } catch (e) {
        console.error('[GATEWAY REDIS SUB ERROR]:', e);
    }
});

io.on('connection', (socket) => {
    console.log('[GATEWAY SOCKET] Client Connected:', socket.id);

    socket.on('join-analysis', (userId) => {
        if (userId && userId !== 'anonymous') {
            if (userId.startsWith('guest_')) {
                socket.join(`socket-${userId}`);
                console.log(`[GATEWAY SOCKET] Guest ${socket.id} joined room: socket-${userId}`);
            } else {
                socket.join(`user-${userId}`);
                console.log(`[GATEWAY SOCKET] User ${socket.id} joined room: user-${userId}`);
            }
        } else {
            socket.join(`socket-${socket.id}`);
            console.log(`[GATEWAY SOCKET] Socket ${socket.id} joined private room: socket-${socket.id}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('[GATEWAY SOCKET] Client Disconnected:', socket.id);
    });
});

app.use(cors());

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:5001';
const RECRUITMENT_SERVICE_URL = process.env.RECRUITMENT_SERVICE_URL || 'http://127.0.0.1:5003';
const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL || 'http://127.0.0.1:5004';

app.use(createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/auth',
    pathRewrite: { '^/api/auth': '' },
    on: {
        error: (err, req, res) => {
            console.error('[PROXY ERROR -> Auth Service]:', err.message);
            res.status(503).json({ error: 'Auth Service unavailable' });
        }
    }
}));

app.use(createProxyMiddleware({
    target: RECRUITMENT_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/jobs',
    pathRewrite: { '^/api/jobs': '/jobs' },
    on: {
        error: (err, req, res) => {
            console.error('[PROXY ERROR -> Recruitment Service (Jobs)]:', err.message);
            res.status(503).json({ error: 'Recruitment Service unavailable' });
        }
    }
}));

app.use(createProxyMiddleware({
    target: RECRUITMENT_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/candidates',
    pathRewrite: { '^/api/candidates': '/candidates' },
    on: {
        error: (err, req, res) => {
            console.error('[PROXY ERROR -> Recruitment Service (Candidates)]:', err.message);
            res.status(503).json({ error: 'Recruitment Service unavailable' });
        }
    }
}));

app.use(createProxyMiddleware({
    target: ANALYSIS_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/analyze',
    pathRewrite: { '^/api/analyze': '/analyze' },
    on: {
        error: (err, req, res) => {
            console.error('[PROXY ERROR -> Analysis Service (/analyze)]:', err.message);
            res.status(503).json({ error: 'Analysis Service unavailable' });
        }
    }
}));

app.use(createProxyMiddleware({
    target: ANALYSIS_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/history',
    pathRewrite: { '^/api/history': '/history' },
    on: {
        error: (err, req, res) => {
            console.error('[PROXY ERROR -> Analysis Service (/history)]:', err.message);
            res.status(503).json({ error: 'Analysis Service unavailable' });
        }
    }
}));

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        gateway: 'AnalyzeGit API Gateway',
        services: {
            auth: AUTH_SERVICE_URL,
            recruitment: RECRUITMENT_SERVICE_URL,
            analysis: ANALYSIS_SERVICE_URL
        }
    });
});

app.get('/', (req, res) => {
    res.json({ message: 'AnalyzeGit Microservices API Gateway is running...' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`API Gateway & Socket Hub is running on port ${PORT}`);
});
