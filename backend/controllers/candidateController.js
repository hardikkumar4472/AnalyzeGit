const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Analysis = require('../models/Analysis');
const { uploadResume } = require('../services/s3Service');
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

        const candidateEmail = (email || analysisResult.email || '').trim().toLowerCase();
        const candidateName = (name || analysisResult.name || 'Candidate').trim();

        if (!candidateEmail) {
            return res.status(400).json({ error: 'Email could not be determined. Please provide an email.' });
        }

        const candidate = await Candidate.findOneAndUpdate(
            { jobId, email: candidateEmail },
            {
                jobId,
                name: candidateName,
                email: candidateEmail,
                resumeUrl: publicUrl,
                resumeFile: {
                    data: file.buffer,
                    contentType: file.mimetype,
                    originalName: file.originalname
                },
                githubUrl: analysisResult.githubUrl,
                analysis: analysisResult.analysis,
                gitAnalysisId,
                status: 'analyzed'
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const baseUrl = process.env.BACKEND_URL || 'https://analyzegit.onrender.com';
        if (!candidate.resumeUrl || 
            candidate.resumeUrl.includes('analyzegit-resumes.s3') || 
            candidate.resumeUrl.includes('supabase.co')) {
            candidate.resumeUrl = `${baseUrl}/api/candidates/${candidate._id}/resume`;
            await candidate.save();
        }

        await redis.del(`candidates:job:${jobId}`);

        const candidateResponse = candidate.toObject();
        delete candidateResponse.resumeFile;

        const io = req.app.get('io');
        if (io) {
            io.emit(`candidateUpdate:${jobDetails.recruiterId}`, { action: 'applied', candidate: candidateResponse, jobId });
        }

        res.status(201).json({
            success: true,
            message: 'Application submitted and analyzed successfully',
            candidate: candidateResponse
        });

    } catch (error) {
        console.error('Candidate Controller Error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                error: 'An application with this email address has already been submitted.'
            });
        }
        res.status(500).json({ error: error.message || 'Failed to submit application' });
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
            .select('-resumeFile.data')
            .populate('gitAnalysisId')
            .sort({ 'analysis.score': -1 });
            
        const baseUrl = process.env.BACKEND_URL || 'https://analyzegit.onrender.com';
        const formattedCandidates = candidates.map(c => {
            const obj = c.toObject();
            if (!obj.resumeUrl || 
                obj.resumeUrl.includes('analyzegit-resumes.s3') || 
                obj.resumeUrl.includes('supabase.co')) {
                obj.resumeUrl = `${baseUrl}/api/candidates/${obj._id}/resume`;
            }
            delete obj.resumeFile;
            return obj;
        });

        await redis.setex(cacheKey, 300, JSON.stringify(formattedCandidates));
        res.json(formattedCandidates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getCandidateResume = async (req, res) => {
    try {
        const { id } = req.params;
        const candidate = await Candidate.findById(id);
        if (!candidate) {
            return res.status(404).send('Candidate record not found');
        }

        if (candidate.resumeFile && candidate.resumeFile.data) {
            res.setHeader('Content-Type', candidate.resumeFile.contentType || 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${candidate.resumeFile.originalName || 'resume.pdf'}"`);
            return res.send(candidate.resumeFile.data);
        }

        if (candidate.resumeUrl && 
            candidate.resumeUrl.startsWith('http') &&
            !candidate.resumeUrl.includes('omovghdnuiynymeamiph.supabase.co') && 
            !candidate.resumeUrl.includes('analyzegit-resumes.s3.us-east-1.amazonaws.com') &&
            !candidate.resumeUrl.includes('/api/candidates/')) {
            return res.redirect(candidate.resumeUrl);
        }

        return res.status(200).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Resume - AnalyzeGit</title>
                <style>
                    body { font-family: sans-serif; background: #0b0f19; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                    .card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 32px; max-width: 450px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h3 style="color: #f59e0b;">Resume File Not Cached</h3>
                    <p style="color: #94a3b8; font-size: 14px;">This candidate applied before database storage was enabled. Full AI assessment score is preserved.</p>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Error fetching resume:', error);
        res.status(500).send('Error retrieving candidate resume');
    }
};

module.exports = { applyToJob, getCandidatesForJob, getCandidateResume };
