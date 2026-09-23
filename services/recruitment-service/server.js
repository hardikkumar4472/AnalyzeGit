const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const multer = require('multer');
const { nanoid } = require('nanoid');
const Redis = require('ioredis');
const { Queue } = require('bullmq');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const pdf = require('pdf-parse');
const cron = require('node-cron');
const jwt = require('jsonwebtoken');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Recruitment Service: MongoDB Connected'))
    .catch((err) => {
        console.error('Recruitment Service DB Connection Error:', err);
        process.exit(1);
    });

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new Redis(redisUrl, { maxRetriesPerRequest: null });
const redisPub = new Redis(redisUrl, { maxRetriesPerRequest: null });
const analysisQueue = new Queue('analysis-queue', { connection: redis });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const awsRegion = process.env.AWS_REGION || 'us-east-1';
const s3BucketName = process.env.AWS_S3_BUCKET_NAME || 'analyzegit-resumes';

let s3Client = null;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    s3Client = new S3Client({
        region: awsRegion,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
    });
} else {
    s3Client = new S3Client({ region: awsRegion });
}

const jobSchema = new mongoose.Schema({
    jobId: { type: String, required: true, unique: true },
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: [String], default: [] },
    targetCount: { type: Number, default: 10 }
}, { timestamps: true });
const Job = mongoose.model('Job', jobSchema);

const candidateSchema = new mongoose.Schema({
    jobId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    resumeUrl: { type: String, required: true },
    githubUrl: { type: String },
    analysis: {
        score: { type: Number, required: true },
        mismatchingSkills: { type: [String], default: [] },
        summary: { type: String, required: true }
    },
    gitAnalysisId: { type: mongoose.Schema.Types.ObjectId, ref: 'Analysis' },
    status: { type: String, enum: ['applied', 'analyzed', 'rejected', 'shortlisted'], default: 'analyzed' }
}, { timestamps: true });
const Candidate = mongoose.model('Candidate', candidateSchema);

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

const uploadResume = async (fileBuffer, originalName, mimeType) => {
    try {
        const fileExt = originalName.split('.').pop();
        const fileName = `documents/${nanoid()}.${fileExt}`;

        const command = new PutObjectCommand({
            Bucket: s3BucketName,
            Key: fileName,
            Body: fileBuffer,
            ContentType: mimeType,
        });

        await s3Client.send(command);

        const publicUrl = `https://${s3BucketName}.s3.${awsRegion}.amazonaws.com/${fileName}`;
        return { publicUrl, fileName };
    } catch (error) {
        console.error('AWS S3 Upload Error:', error.message);
        throw error;
    }
};

const analyzeResume = async (fileBuffer, mimeType, jdContent) => {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    let resumeText = "";
    let parts = [];

    if (mimeType === 'application/pdf') {
        try {
            const data = await pdf(fileBuffer);
            resumeText = data.text;
        } catch (err) {
            console.error('PDF Parse Error:', err.message);
        }
    }

    if (!resumeText) {
        parts = [{
            inlineData: {
                mimeType: mimeType,
                data: fileBuffer.toString('base64')
            }
        }];
    }

    const prompt = `
Analyze the following resume against the provided Job Description (JD).
Data:
JD: ${JSON.stringify(jdContent)}
${resumeText ? `Resume Text: ${resumeText}` : "Resume is provided as an image/file attachment."}

Requirements:
1. Extract the candidate's name and email.
2. Identify the primary GitHub profile URL (e.g., https://github.com/username). If not found, return null.
3. Provide a score out of 10 based on the fit for the JD.
4. Identify ONLY specific skills that are explicitly required in the JD but are missing from the resume. Return them as an array of short skill names (e.g., "Docker", "Python"). If all required skills are perfectly matched in the resume, return an empty array []. Do not include generic areas of improvement or long sentences.
5. Provide a 2-sentence professional summary of the fit.

Return ONLY as a JSON object:
{
  "name": "string",
  "email": "string",
  "githubUrl": "string or null",
  "analysis": {
    "score": number, 
    "mismatchingSkills": [string],
    "summary": string
  }
}
`;
    parts.push(prompt);
    const result = await model.generateContent(parts);
    const response = await result.response;
    return JSON.parse(response.text());
};

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

const { register, metricsMiddleware } = require('./metrics');

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware('recruitment-service'));

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (ex) {
        res.status(500).end(ex.message);
    }
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

app.post('/jobs', protect, async (req, res) => {
    try {
        const { title, description, requirements, targetCount } = req.body;
        const recruiterId = req.user._id;
        const jobId = nanoid(10);
        const newJob = await Job.create({
            jobId,
            recruiterId,
            title,
            description,
            requirements,
            targetCount
        });

        await redis.del(`jobs:recruiter:${recruiterId}`);
        
        redisPub.publish('jobUpdate', JSON.stringify({
            recruiterId: recruiterId.toString(),
            action: 'created',
            job: newJob
        }));

        res.status(201).json({
            success: true,
            job: newJob,
            applyLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/apply/${jobId}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/jobs', protect, async (req, res) => {
    try {
        const cacheKey = `jobs:recruiter:${req.user._id}`;
        const cachedJobs = await redis.get(cacheKey);
        if (cachedJobs) return res.json(JSON.parse(cachedJobs));

        const jobs = await Job.find({ recruiterId: req.user._id }).sort({ createdAt: -1 });
        await redis.setex(cacheKey, 300, JSON.stringify(jobs));
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/jobs/:jobId', async (req, res) => {
    try {
        const cacheKey = `job:detail:${req.params.jobId}`;
        const cachedJob = await redis.get(cacheKey);
        if (cachedJob) return res.json(JSON.parse(cachedJob));

        const job = await Job.findOne({ jobId: req.params.jobId });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        await redis.setex(cacheKey, 300, JSON.stringify(job));
        res.json(job);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/jobs/:jobId', protect, async (req, res) => {
    try {
        const { jobId } = req.params;
        const recruiterId = req.user._id;

        const job = await Job.findOne({ jobId, recruiterId });
        if (!job) return res.status(404).json({ error: 'Job not found or unauthorized' });

        await Candidate.deleteMany({ jobId });
        await Job.deleteOne({ _id: job._id });

        await redis.del(`jobs:recruiter:${recruiterId}`);
        await redis.del(`job:detail:${jobId}`);

        redisPub.publish('jobUpdate', JSON.stringify({
            recruiterId: recruiterId.toString(),
            action: 'deleted',
            jobId
        }));

        res.json({ success: true, message: 'Job and associated candidates deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/candidates/apply', upload.single('resume'), async (req, res) => {
    try {
        const { jobId, name, email } = req.body;
        const file = req.file;

        if (!jobId || !file) {
            return res.status(400).json({ error: 'Job ID and Resume file are required' });
        }

        const jobDetails = await Job.findOne({ jobId });
        if (!jobDetails) return res.status(404).json({ error: 'Job not found' });

        if (email) {
            const existingCandidate = await Candidate.findOne({ jobId, email });
            if (existingCandidate) {
                return res.status(400).json({ error: 'A user with this email has already applied for this role.' });
            }
        }

        const { publicUrl } = await uploadResume(file.buffer, file.originalname, file.mimetype);

        const analysisResult = await analyzeResume(file.buffer, file.mimetype, {
            title: jobDetails.title,
            description: jobDetails.description,
            requirements: jobDetails.requirements
        });

        let gitAnalysisId = null;
        if (analysisResult.githubUrl) {
            const existingGitAnalysis = await Analysis.findOne({
                url: analysisResult.githubUrl,
            }).sort({ createdAt: -1 });

            if (existingGitAnalysis) {
                gitAnalysisId = existingGitAnalysis._id;
            } else {
                console.log(`Enqueuing Git analysis for candidate: ${analysisResult.githubUrl}`);
                await analysisQueue.add('analyze', {
                    url: analysisResult.githubUrl,
                    userId: 'candidate-auto',
                    lang: 'en'
                });
            }
        }

        const candidate = await Candidate.create({
            jobId,
            name: req.body.name || analysisResult.name,
            email: req.body.email || analysisResult.email,
            resumeUrl: publicUrl,
            githubUrl: analysisResult.githubUrl,
            analysis: analysisResult.analysis,
            gitAnalysisId,
            status: 'analyzed'
        });

        await redis.del(`candidates:job:${jobId}`);

        redisPub.publish('candidateUpdate', JSON.stringify({
            recruiterId: jobDetails.recruiterId.toString(),
            action: 'applied',
            candidate,
            jobId
        }));

        res.status(201).json({
            success: true,
            message: 'Application submitted and analyzed successfully',
            candidate
        });
    } catch (error) {
        console.error('Candidate Apply Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/candidates/:jobId', protect, async (req, res) => {
    try {
        const { jobId } = req.params;
        const cacheKey = `candidates:job:${jobId}`;
        const cachedCandidates = await redis.get(cacheKey);

        if (cachedCandidates) {
            return res.json(JSON.parse(cachedCandidates));
        }

        const candidates = await Candidate.find({ jobId })
            .populate('gitAnalysisId')
            .sort({ 'analysis.score': -1 });

        await redis.setex(cacheKey, 300, JSON.stringify(candidates));
        res.json(candidates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'recruitment-service' });
});

const PORT = process.env.PORT_RECRUITMENT || 5003;
app.listen(PORT, () => {
    console.log(`Recruitment Service running on port ${PORT}`);
});
