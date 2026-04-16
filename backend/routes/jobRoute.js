const express = require('express');
const router = express.Router();
const { createJob, getRecruiterJobs, getJobDetails, deleteJob } = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createJob);
router.get('/', protect, getRecruiterJobs);
router.get('/:jobId', getJobDetails); 
router.delete('/:jobId', protect, deleteJob);

module.exports = router;
