const { Worker, Queue } = require('bullmq');
const redisConnection = require('./config/redis');
const { getGitHubData } = require('./services/githubService');
const { analyzeWithAI } = require('./services/aiService');
const Analysis = require('./models/Analysis');
const analysisQueue = new Queue('analysis-queue', { connection: redisConnection });

const createWorker = (io) => {
    const worker = new Worker('analysis-queue', async (job) => {
        const { url, userId, socketId, lang } = job.data;
        const targetRooms = new Set();
        if (userId && userId !== 'anonymous') {
            targetRooms.add(`user-${userId}`);
        }
        if (socketId) {
            if (socketId.startsWith('socket-') || socketId.startsWith('user-')) {
                targetRooms.add(socketId);
            } else if (socketId.startsWith('guest_')) {
                targetRooms.add(`socket-${socketId}`);
            } else {
                targetRooms.add(`user-${socketId}`);
                targetRooms.add(`socket-${socketId}`);
            }
        }
        if (targetRooms.size === 0) {
            targetRooms.add('user-anonymous');
        }

        const emitToRooms = (event, payload) => {
            for (const room of targetRooms) {
                console.log(`[Worker] Emitting ${event} to room: ${room}`);
                io.to(room).emit(event, payload);
            }
        };

        try {
            console.log(`Working on job ${job.id} for ${url}`);
            emitToRooms('analysis-progress', { stage: 'Job Started...', progress: 15 });
            emitToRooms('analysis-progress', { stage: 'Analysis in Progress...', progress: 20 });
            const githubData = await getGitHubData(url);
            emitToRooms('analysis-progress', { stage: 'Analysis in Progress...', progress: 50 });
            const analysis = await analyzeWithAI(githubData.data, githubData.type, lang);
            emitToRooms('analysis-progress', { stage: 'Analysis in Progress...', progress: 80 });
            const result = {
                type: githubData.type,
                metadata: {
                    name: githubData.type === 'user' ? githubData.data.profile.name || githubData.data.profile.login : githubData.data.details.name,
                    avatar: githubData.type === 'user' ? githubData.data.profile.avatar_url : githubData.data.details.owner.avatar_url,
                    url: url,
                    language: githubData.type === 'repo' ? githubData.data.details.language : 'GitHub Persona',
                    lastUpdate: githubData.type === 'repo' ? githubData.data.details.updated_at : githubData.data.profile.updated_at
                },
                analysis: analysis
            };
            const updateDoc = {
                $set: {
                    type: result.type,
                    metadata: result.metadata,
                    analysis: result.analysis,
                    createdAt: Date.now()
                }
            };
            
            if (userId && userId !== 'anonymous') {
                updateDoc.$addToSet = { users: userId };
            }

            await Analysis.findOneAndUpdate(
                { url, lang },
                updateDoc,
                { upsert: true, returnDocument: 'after' }
            );
            emitToRooms('analysis-complete', result);
            return result;

        } catch (error) {
            console.error(`Worker error for job ${job.id} (Attempt ${job.attemptsMade}):`, error.message);
            if (job.attemptsMade >= job.opts.attempts) {
                emitToRooms('analysis-error', { error: error.message });
            } else {
                emitToRooms('analysis-progress', { stage: 'AI resolving timeout, retrying...', progress: 40 });
            }
            throw error; 
        }
    }, { 
        connection: redisConnection,
        concurrency: 5 
    });

    worker.on('completed', job => console.log(`Job ${job.id} completed`));
    worker.on('failed', (job, err) => console.error(`Job ${job.id} failed:`, err.message));

    return worker;
};

module.exports = { analysisQueue, createWorker };
