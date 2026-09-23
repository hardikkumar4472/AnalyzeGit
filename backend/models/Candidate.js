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
        required: false
    },
    resumeFile: {
        data: Buffer,
        contentType: String,
        originalName: String
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
const Candidate = mongoose.model('Candidate', CandidateSchema);

Candidate.collection.dropIndex('email_1')
    .then(() => console.log('[BACKEND] Dropped legacy email_1 unique index successfully.'))
    .catch((err) => {
        if (err.code !== 27) {
            console.log('[BACKEND] Note regarding email_1 index:', err.message);
        }
    });

module.exports = Candidate;
