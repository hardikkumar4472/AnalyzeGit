const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['user', 'repo'],
        required: true
    },
    metadata: {
        name: String,
        avatar: String,
    },
    analysis: {
        score: Number,
        goodPoints: [String],
        badPoints: [String],
        summary: String
    },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lang: {
        type: String,
        default: 'en'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

AnalysisSchema.index({ url: 1 });
AnalysisSchema.index({ users: 1, createdAt: -1 });

module.exports = mongoose.model('Analysis', AnalysisSchema);
