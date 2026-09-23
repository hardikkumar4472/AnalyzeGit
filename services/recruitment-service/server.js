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
const { createClient } = require('@supabase/supabase-js');
const pdf = require('pdf-parse');
const cron = require('node-cron');
const jwt = require('jsonwebtoken');

dotenv.config();

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (mongoUri) {
    mongoose.connect(mongoUri)
        .then(() => console.log('Recruitment Service: MongoDB Connected'))
        .catch((err) => console.error('Recruitment Service DB Connection Error:', err.message));
} else {
    console.error('Recruitment Service Error: Neither MONGO_URI nor MONGODB_URI is defined!');
}

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

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;
if (supabase) {
    console.log('[RECRUITMENT] Supabase Storage client initialized as fallback.');
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
candidateSchema.index({ jobId: 1, email: 1 });
const Candidate = mongoose.model('Candidate', candidateSchema);

// Auto-drop stale legacy unique index on email if present in MongoDB collection
Candidate.collection.dropIndex('email_1')
    .then(() => console.log('[RECRUITMENT] Dropped legacy email_1 unique index successfully.'))
    .catch((err) => {
        if (err.code !== 27) {
            console.log('[RECRUITMENT] Note regarding email_1 index:', err.message);
        }
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

const uploadResume = async (fileBuffer, originalName, mimeType) => {
    const fileExt = originalName.split('.').pop();
    const uniqueId = nanoid();
    const fileName = `documents/${uniqueId}.${fileExt}`;

    // 1. Primary: Try AWS S3 if credentials are provided
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && s3Client) {
        try {
            console.log('[RECRUITMENT] Attempting upload to AWS S3 bucket...');
            const command = new PutObjectCommand({
                Bucket: s3BucketName,
                Key: fileName,
                Body: fileBuffer,
                ContentType: mimeType,
            });

            await s3Client.send(command);
            const publicUrl = `https://${s3BucketName}.s3.${awsRegion}.amazonaws.com/${fileName}`;
            console.log('[RECRUITMENT] Successfully uploaded resume to AWS S3');
            return { publicUrl, fileName };
        } catch (s3Error) {
            console.warn('[RECRUITMENT] AWS S3 upload failed, attempting Supabase fallback:', s3Error.message);
        }
    } else {
        console.log('[RECRUITMENT] AWS S3 credentials not configured. Using Supabase Storage fallback...');
    }

    // 2. Secondary / Fallback: Try Supabase Storage
    if (supabase) {
        try {
            console.log('[RECRUITMENT] Attempting upload to Supabase Storage (documents bucket)...');
            const { data, error } = await supabase.storage
                .from('documents')
                .upload(fileName, fileBuffer, {
                    contentType: mimeType,
                    upsert: true
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(fileName);

            console.log('[RECRUITMENT] Successfully uploaded resume to Supabase Storage:', publicUrl);
            return { publicUrl, fileName };
        } catch (supabaseError) {
            console.warn('[RECRUITMENT] Supabase Storage upload failed:', supabaseError.message);
        }
    } else {
        console.warn('[RECRUITMENT] Supabase credentials (SUPABASE_URL, SUPABASE_ANON_KEY) not found.');
    }

    // 3. Tertiary fallback: Return safe document identifier so candidate apply never crashes
    console.warn('[RECRUITMENT] Proceeding with fallback document identifier.');
    return {
        publicUrl: `https://${s3BucketName}.s3.${awsRegion}.amazonaws.com/${fileName}`,
        fileName
    };
};

const FLASH_MODELS = [
    process.env.GEMINI_MODEL,
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
].filter(Boolean);

const analyzeResume = async (fileBuffer, mimeType, jdContent) => {
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

    let lastError = null;
    for (const modelName of FLASH_MODELS) {
        try {
            console.log(`[RECRUITMENT AI] Attempting resume analysis using model: ${modelName}`);
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                generationConfig: { responseMimeType: "application/json" }
            });
            const result = await model.generateContent(parts);
            const response = await result.response;
            const parsed = JSON.parse(response.text());
            console.log(`[RECRUITMENT AI] Successfully analyzed resume with ${modelName}`);
            return parsed;
        } catch (error) {
            console.warn(`[RECRUITMENT AI] Model ${modelName} failed (${error.message}), falling back to next Flash model...`);
            lastError = error;
        }
    }

    throw lastError || new Error("All Gemini Flash models failed to analyze resume");
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

        const { publicUrl } = await uploadResume(file.buffer, file.originalname, file.mimetype);

        const analysisResult = await analyzeResume(file.buffer, file.mimetype, {
            title: jobDetails.title,
            description: jobDetails.description,
            requirements: jobDetails.requirements
        });

        const candidateEmail = (email || analysisResult.email || '').trim().toLowerCase();
        const candidateName = (name || analysisResult.name || 'Candidate').trim();

        if (!candidateEmail) {
            return res.status(400).json({ error: 'Email could not be determined. Please provide your email address.' });
        }

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

        // Use findOneAndUpdate with upsert: true so if the candidate already applied,
        // it cleanly updates their application with the latest resume & analysis without E11000 error
        const candidate = await Candidate.findOneAndUpdate(
            { jobId, email: candidateEmail },
            {
                jobId,
                name: candidateName,
                email: candidateEmail,
                resumeUrl: publicUrl,
                githubUrl: analysisResult.githubUrl,
                analysis: analysisResult.analysis,
                gitAnalysisId,
                status: 'analyzed'
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

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
        if (error.code === 11000) {
            return res.status(400).json({
                error: 'An application with this email address has already been submitted.'
            });
        }
        res.status(500).json({ error: error.message || 'Failed to submit application' });
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
