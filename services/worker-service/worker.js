const { Worker } = require('bullmq');
const Redis = require('ioredis');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Octokit } = require('octokit');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const retry = require("async-retry");

const http = require('http');
const { register, auditJobsCounter } = require('./metrics');

dotenv.config();

// Expose Prometheus metrics for Worker Service on port 9102
const metricsServer = http.createServer(async (req, res) => {
    if (req.url === '/metrics') {
        try {
            res.setHeader('Content-Type', register.contentType);
            res.end(await register.metrics());
        } catch (ex) {
            res.statusCode = 500;
            res.end(ex.message);
        }
    } else if (req.url === '/health') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'ok', service: 'worker-service' }));
    } else {
        res.statusCode = 404;
        res.end('Not Found');
    }
});
const WORKER_METRICS_PORT = process.env.PORT_WORKER_METRICS || 9102;
metricsServer.listen(WORKER_METRICS_PORT, () => console.log(`Worker Service: Metrics listening on port ${WORKER_METRICS_PORT}`))
    .on('error', (err) => console.warn(`Worker Service Metrics Warning: ${err.message}`));

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (mongoUri) {
    mongoose.connect(mongoUri)
        .then(() => console.log('Worker Service: MongoDB Connected'))
        .catch((err) => console.error('Worker Service DB Connection Error:', err.message));
} else {
    console.error('Worker Service Error: Neither MONGO_URI nor MONGODB_URI is defined!');
}

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redisConnection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 100, 3000)
});
const redisPub = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 100, 3000)
});

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

const getGitHubData = async (url) => {
    const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN
    });

    try {
        const pathParts = new URL(url).pathname.split('/').filter(p => p);
        
        if (pathParts.length === 1) {
            const username = pathParts[0];
            const { data: user } = await octokit.rest.users.getByUsername({ username });
            const { data: repos } = await octokit.rest.repos.listForUser({ 
                username, 
                sort: 'pushed', 
                per_page: 5 
            });

            return {
                type: 'user',
                data: {
                    profile: user,
                    topRepos: repos.map(r => ({
                        name: r.name,
                        description: r.description,
                        language: r.language,
                        stars: r.stargazers_count,
                        url: r.html_url
                    }))
                }
            };
        } else if (pathParts.length >= 2) {
            const owner = pathParts[0];
            const repo = pathParts[1];

            const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
            
            let readmeContent = '';
            try {
                const { data: readme } = await octokit.rest.repos.getReadme({ owner, repo });
                readmeContent = Buffer.from(readme.content, 'base64').toString();
            } catch (e) {
                readmeContent = 'No README found.';
            }
            const { data: tree } = await octokit.rest.git.getTree({
                owner,
                repo,
                tree_sha: repoData.default_branch,
                recursive: true
            });

            const structure = tree.tree
                .filter(item => !item.path.includes('node_modules') && !item.path.includes('.git'))
                .slice(0, 50)
                .map(item => item.path);

            return {
                type: 'repo',
                data: {
                    details: repoData,
                    readme: readmeContent,
                    structure: structure,
                    languages: repoData.language
                }
            };
        } else {
            throw new Error('Invalid GitHub URL');
        }
    } catch (error) {
        console.error('GitHub API Error:', error);
        throw new Error('Failed to fetch data from GitHub. Check the URL or the repo is private.');
    }
};

const FLASH_MODELS = [
    process.env.GEMINI_MODEL,
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
    "gemini-1.5-flash-8b"
].filter(Boolean);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeWithAI = async (data, type, lang = 'en') => {
    const targetLang = lang === 'hi' ? 'Hindi' : 'English';
    let prompt = "";

    if (type === 'user') {
        prompt = `
Analyze the following GitHub User Profile and provide a scorecard.
Data: ${JSON.stringify({
            login: data.profile.login,
            bio: data.profile.bio,
            public_repos: data.profile.public_repos,
            followers: data.profile.followers,
            topRepos: data.topRepos
        })}

Requirements:
1. Provide a generalized overall score out of 10.
2. Provide exactly 5 Good points.
3. Provide exactly 5 Bad points.
4. Provide a 2-3 sentence visual summary.

IMPORTANT: Content in the JSON must be in ${targetLang}.

Return ONLY as a JSON object:
{
  "score": number, 
  "goodPoints": [string, string, string, string, string],
  "badPoints": [string, string, string, string, string],
  "summary": string
}
        `;
    } else {
        prompt = `
Analyze binary repository data and provide a "Deep Code Quality" assessment.
Data: ${JSON.stringify({ 
            name: data.details.name, 
            description: data.details.description,
            readme: data.readme.substring(0, 3000), 
            structure: data.structure,
            language: data.languages
        })}

Requirements:
1. Provide a score out of 10.
2. Provide exactly 5 Good points.
3. Provide exactly 5 Bad points.
4. Provide a 2-3 sentence modularity insight.

IMPORTANT: Content in the JSON must be in ${targetLang}.

Return ONLY as a JSON object:
{
  "score": number, 
  "goodPoints": [string, string, string, string, string],
  "badPoints": [string, string, string, string, string],
  "summary": string
}
        `;
    }

    let lastError = null;
    for (const modelName of FLASH_MODELS) {
        try {
            console.log(`[WORKER AI] Attempting analysis using model: ${modelName}`);
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                generationConfig: { responseMimeType: "application/json" }
            });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const parsed = JSON.parse(response.text());
            console.log(`[WORKER AI] Successfully completed analysis with ${modelName}`);
            return parsed;
        } catch (error) {
            console.warn(`[WORKER AI] Model ${modelName} failed (${error.message}), falling back to next Flash model...`);
            lastError = error;
        }
    }

    throw lastError || new Error("All Gemini Flash models failed to respond");
};

const emitAnalysisEvent = (room, event, data) => {
    redisPub.publish('analysisEvents', JSON.stringify({ room, event, data }));
};

const worker = new Worker('analysis-queue', async (job) => {
    const { url, userId, socketId, lang } = job.data;
    const room = (userId === 'anonymous' && socketId) ? `socket-${socketId}` : `user-${userId}`;
    console.log(`[WORKER] Job ${job.id} target room: ${room}`);

    try {
        console.log(`[WORKER] Working on job ${job.id} for ${url}`);
        emitAnalysisEvent(room, 'analysis-progress', { stage: 'Job Started...', progress: 15 });
        emitAnalysisEvent(room, 'analysis-progress', { stage: 'Analysis in Progress...', progress: 20 });

        const githubData = await getGitHubData(url);
        emitAnalysisEvent(room, 'analysis-progress', { stage: 'Analysis in Progress...', progress: 50 });

        const analysis = await analyzeWithAI(githubData.data, githubData.type, lang);
        emitAnalysisEvent(room, 'analysis-progress', { stage: 'Analysis in Progress...', progress: 80 });

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
        
        if (userId && userId !== 'anonymous' && !userId.startsWith('candidate-auto')) {
            updateDoc.$addToSet = { users: userId };
        }

        await Analysis.findOneAndUpdate(
            { url, lang },
            updateDoc,
            { upsert: true, new: true }
        );

        emitAnalysisEvent(room, 'analysis-complete', result);
        console.log(`[WORKER] Finished job ${job.id} successfully`);
        return result;

    } catch (error) {
        console.error(`Worker error for job ${job.id} (Attempt ${job.attemptsMade}):`, error.message);
        if (job.attemptsMade >= job.opts.attempts) {
            emitAnalysisEvent(room, 'analysis-error', { error: error.message });
        } else {
            emitAnalysisEvent(room, 'analysis-progress', { stage: 'AI resolving timeout, retrying...', progress: 40 });
        }
        throw error; 
    }
}, { 
    connection: redisConnection,
    concurrency: 5 
});

worker.on('completed', job => console.log(`[WORKER] Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`[WORKER] Job ${job.id} failed:`, err.message));

console.log('Worker Service initialized and listening to analysis-queue...');
