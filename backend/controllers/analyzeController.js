const { analysisQueue } = require('../worker');
const Analysis = require('../models/Analysis');

const performAnalysis = async (req, res) => {
    const { url, lang = 'en' } = req.body;
    const userId = req.user ? req.user._id.toString() : 'anonymous';
    if (!url) {
        return res.status(400).json({ error: 'GitHub URL is required' });
    }
    try {
        console.log(`Enqueuing fresh analysis job for ${url}`);
        const targetUserId = userId.toString();
        const job = await analysisQueue.add('analyze', {
            url,
            userId: targetUserId,
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
        console.error('Analysis Controller Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal Server Error' 
        });
    }
};

const getUserHistory = async (req, res) => {
    try {
        const history = await Analysis.find({ users: req.user._id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    performAnalysis,
    getUserHistory
};
