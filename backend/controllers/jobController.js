const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const { nanoid } = require('nanoid');
const redis = require('../config/redis');

const createJob = async (req, res) => {
    try {
        const { title, description, requirements, targetCount } = req.body;
        const recruiterId = req.user._id;
        console.log(`[USER STEP] Recruiter (${req.user.email}) creating new job: ${title}`);

        const jobId = nanoid(10);
        const newJob = await Job.create({
            jobId,
            recruiterId,
            title,
            description,
            requirements,
            targetCount
        });

        res.status(201).json({
            success: true,
            job: newJob,
            applyLink: `${process.env.FRONTEND_URL}/apply/${jobId}`
        });


        await redis.del(`jobs:recruiter:${recruiterId}`);
        const io = req.app.get('io');
        if (io) io.emit(`jobUpdate:${recruiterId}`, { action: 'created', job: newJob });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getRecruiterJobs = async (req, res) => {
    try {
        const cacheKey = `jobs:recruiter:${req.user._id}`;
        const cachedJobs = await redis.get(cacheKey);
        if (cachedJobs) return res.json(JSON.parse(cachedJobs));

        const jobs = await Job.find({ recruiterId: req.user._id }).sort({ createdAt: -1 });
        await redis.setex(cacheKey, 300, JSON.stringify(jobs)); // Cache for 5 mins
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getJobDetails = async (req, res) => {
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
};

const deleteJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const recruiterId = req.user._id;
        console.log(`[USER STEP] Recruiter (${req.user.email}) deleting job: ${jobId}`);

        const job = await Job.findOne({ jobId, recruiterId });
        if (!job) {
            return res.status(404).json({ error: 'Job not found or unauthorized' });
        }

        await Candidate.deleteMany({ jobId });

        await Job.deleteOne({ _id: job._id });
        await redis.del(`jobs:recruiter:${recruiterId}`);
        await redis.del(`job:detail:${jobId}`);
        const io = req.app.get('io');
        if (io) io.emit(`jobUpdate:${recruiterId}`, { action: 'deleted', jobId });

        res.json({ success: true, message: 'Job and associated candidates deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createJob, getRecruiterJobs, getJobDetails, deleteJob };
