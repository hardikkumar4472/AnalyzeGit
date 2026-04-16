const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail, sendOTPEmail } = require('../services/emailService');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.register = async (req, res) => {
    const { name, email, password } = req.body;
    console.log(`[USER STEP] Registration attempt for: ${email}`);
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            if (userExists.isVerified) {
                return res.status(400).json({ error: 'User already exists and is verified' });
            }
            const otp = generateOTP();
            userExists.otp = otp;
            userExists.otpExpires = Date.now() + 5 * 60 * 1000; 
            userExists.name = name;
            userExists.password = password;
            await userExists.save();
            await sendOTPEmail(email, name, otp);
            return res.status(200).json({ message: 'OTP sent to email. Please verify.' });
        }

        const otp = generateOTP();
        const otpExpires = Date.now() + 5 * 60 * 1000;

        await User.create({ 
            name, 
            email, 
            password, 
            otp, 
            otpExpires,
            isVerified: false 
        });
        
        await sendOTPEmail(email, name, otp);

        res.status(201).json({
            message: 'OTP sent to email. Please verify.'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    console.log(`[USER STEP] OTP verification for: ${email}`);
    try {
        const user = await User.findOne({ email, otp, otpExpires: { $gt: Date.now() } });
        
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        sendWelcomeEmail(user.email, user.name);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.resendOTP = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = Date.now() + 5 * 60 * 1000;
        await user.save();

        await sendOTPEmail(email, user.name, otp);
        res.json({ message: 'New OTP sent to email' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.login = async (req, res) => {
    const { email, password } = req.body;
    console.log(`[USER STEP] Login attempt for: ${email}`);
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });
        
        if (!user.isVerified) {
            return res.status(401).json({ error: 'Please verify your email first', unverified: true });
        }

        if (await user.comparePassword(password)) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.googleAuth = async (req, res) => {
    const { googleId, email, name, avatar } = req.body;
    console.log("DEBUG: Google Auth Attempt for:", email);
    
    try {
        let user = await User.findOne({ googleId });
        if (!user) {
            user = await User.findOne({ email });
            if (user) {
                user.googleId = googleId;
                user.avatar = avatar;
                user.isVerified = true; 
                await user.save();
                console.log("DEBUG: Existing user linked to Google:", email);
            } else {
                user = await User.create({ name, email, googleId, avatar, isVerified: true });
                sendWelcomeEmail(email, name);
                console.log("DEBUG: New Google user created:", email);
            }
        }
        
        const token = generateToken(user._id);
        console.log("DEBUG: Token generated successfully");

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token
        });
    } catch (error) {
        console.error("DEBUG: GOOGLE AUTH ERROR DETAILS:", error.message);
        res.status(500).json({ error: error.message });
    }
};
