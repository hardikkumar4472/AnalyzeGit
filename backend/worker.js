const { Worker, Queue } = require('bullmq');
const redisConnection = require('./config/redis');
const { getGitHubData } = require('./services/githubService');
const { analyzeWithAI } = require('./services/aiService');
const Analysis = require('./models/Analysis');
const analysisQueue = new Queue('analysis-queue', { connection: redisConnection });

const createWorker = (io) => {
    const worker = new Worker('analysis-queue', async (job) => {
        const { url, userId, socketId, lang } = job.data;
        const room = (userId === 'anonymous' && socketId) ? `socket-${socketId}` : `user-${userId}`;
        console.log(`Job ${job.id} target room: ${room}`);

        try {
            console.log(`Working on job ${job.id} for ${url}`);
            io.to(room).emit('analysis-progress', { stage: 'Job Started...', progress: 15 });
            io.to(room).emit('analysis-progress', { stage: 'Analysis in Progress...', progress: 20 });
            const githubData = await getGitHubData(url);
            io.to(room).emit('analysis-progress', { stage: 'Analysis in Progress...', progress: 50 });
            const analysis = await analyzeWithAI(githubData.data, githubData.type, lang);
            io.to(room).emit('analysis-progress', { stage: 'Analysis in Progress...', progress: 80 });
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
                { upsert: true, new: true }
            );
            io.to(room).emit('analysis-complete', result);
            return result;

        } catch (error) {
            console.error(`Worker error for job ${job.id} (Attempt ${job.attemptsMade}):`, error.message);
            if (job.attemptsMade >= job.opts.attempts) {
                io.to(room).emit('analysis-error', { error: error.message });
            } else {
                io.to(room).emit('analysis-progress', { stage: 'AI resolving timeout, retrying...', progress: 40 });
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
