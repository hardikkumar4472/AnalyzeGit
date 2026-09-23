const express = require('express');
const router = express.Router();
const multer = require('multer');
const { applyToJob, getCandidatesForJob, getCandidateResume } = require('../controllers/candidateController');
const { protect } = require('../middleware/authMiddleware');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 
    }
});

router.post('/apply', upload.single('resume'), applyToJob);
router.get('/:jobId', protect, getCandidatesForJob);
router.get('/:id/resume', getCandidateResume);
router.get('/resume/:id', getCandidateResume);

module.exports = router;
