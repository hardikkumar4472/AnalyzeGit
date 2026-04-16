const { analysisQueue } = require('../worker');
const Analysis = require('../models/Analysis');

const performAnalysis = async (req, res) => {
    const { url, lang = 'en', socketId } = req.body;
    const userId = req.user ? req.user._id.toString() : 'anonymous';
    const userIdentifier = req.user ? req.user.email : 'guest';
    console.log(`[USER STEP] Analysis request for: ${url} by ${userIdentifier}`);
    if (!url) {
        return res.status(400).json({ error: 'GitHub URL is required' });
    }
    try {
        const CACHE_EXPIRATION_DAYS = 3;
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() - CACHE_EXPIRATION_DAYS);

        const existingAnalysis = await Analysis.findOne({
            url,
            lang,
            createdAt: { $gte: expirationDate }
        });

        if (existingAnalysis) {
            console.log(`Serving cached analysis for ${url}`);
            
            if (userId !== 'anonymous') {
                if (!existingAnalysis.users.includes(userId)) {
                    existingAnalysis.users.push(userId);
                    await existingAnalysis.save();
                }
            }

            const io = req.app.get('io');
            const room = (userId === 'anonymous' && socketId) ? `socket-${socketId}` : `user-${userId}`;
            
            io.to(room).emit('analysis-complete', {
                type: existingAnalysis.type,
                metadata: existingAnalysis.metadata,
                analysis: existingAnalysis.analysis
            });

            return res.status(200).json({
                success: true,
                status: 'cached',
                message: 'Analysis served from cache.',
                data: existingAnalysis
            });
        }

        console.log(`Enqueuing fresh analysis job for ${url}`);
        const targetUserId = userId.toString();
        const job = await analysisQueue.add('analyze', {
            url,
            userId: targetUserId,
            socketId,
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
