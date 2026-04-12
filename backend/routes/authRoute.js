const express = require('express');
const router = express.Router();
const { register, login, googleAuth, verifyOTP, resendOTP } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

module.exports = router;
