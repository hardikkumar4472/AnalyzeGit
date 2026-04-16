const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    jobId: {
        type: String,
        required: true,
        unique: true
    },
    recruiterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    requirements: [{
        type: String
    }],
    targetCount: {
        type: Number,
        default: 5
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

JobSchema.index({ recruiterId: 1, createdAt: -1 });

module.exports = mongoose.model('Job', JobSchema);
