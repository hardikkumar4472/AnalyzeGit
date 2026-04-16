const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
    jobId: {
        type: String,
        required: true,
        index: true
    },
    name: String,
    email: String,
    resumeUrl: {
        type: String,
        required: true
    },
    githubUrl: String,
    analysis: {
        score: Number,
        mismatchingSkills: [String],
        summary: String
    },
    gitAnalysisId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Analysis'
    },
    status: {
        type: String,
        enum: ['pending', 'analyzed', 'rejected'],
        default: 'pending'
    },
    appliedAt: {
        type: Date,
        default: Date.now
    }
});

CandidateSchema.index({ jobId: 1, appliedAt: -1 });
CandidateSchema.index({ jobId: 1, 'analysis.score': -1 });

module.exports = mongoose.model('Candidate', CandidateSchema);
