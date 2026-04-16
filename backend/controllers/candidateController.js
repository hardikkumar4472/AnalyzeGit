const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Analysis = require('../models/Analysis');
const { uploadResume } = require('../services/supabaseService');
const { analyzeResume } = require('../services/resumeService');
const { analysisQueue } = require('../worker');
const redis = require('../config/redis');

const applyToJob = async (req, res) => {
    try {
        const { jobId, name, email } = req.body;
        const file = req.file;
        console.log(`[USER STEP] Candidate applying for job ${jobId}: ${email || 'Anonymous'}`);

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

        res.status(201).json({
            success: true,
            message: 'Application submitted and analyzed successfully',
            candidate
        });

        await redis.del(`candidates:job:${jobId}`);
        const io = req.app.get('io');
        if (io) {
            io.emit(`candidateUpdate:${jobDetails.recruiterId}`, { action: 'applied', candidate, jobId });
        }

    } catch (error) {
        console.error('Candidate Controller Error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getCandidatesForJob = async (req, res) => {
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
};

module.exports = { applyToJob, getCandidatesForJob };
