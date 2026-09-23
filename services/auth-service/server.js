const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Brevo = require('@getbrevo/brevo');
const { register, metricsMiddleware } = require('./metrics');
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Auth Service: MongoDB Connected'))
    .catch((err) => {
        console.error('Auth Service DB Connection Error:', err);
        process.exit(1);
    });

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
    avatar: { type: String },
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date }
}, { timestamps: true });

userSchema.pre('save', async function() {
    if (!this.isModified('password') || !this.password) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

const sendWelcomeEmail = async (email, name) => {
    try {
        if (!process.env.BREVO_API_KEY) return;
        const client = new Brevo.BrevoClient({ apiKey: process.env.BREVO_API_KEY });
        const emailData = {
            subject: "Welcome to AnalyzeGit!",
            htmlContent: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; color: #1e293b; background-color: #f8fafc; text-align: center;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 48px; border-radius: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);">
                        <div style="display: inline-block; padding: 12px; background-color: #eff6ff; border-radius: 16px; margin-bottom: 24px;">
                            <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.025em; color: #1e293b;">
                                Analyze<span style="color: #2563eb;">Git</span>
                            </div>
                        </div>
                        <h2 style="font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 16px; letter-spacing: -0.025em;">Welcome aboard, ${name}!</h2>
                        <p style="font-size: 16px; color: #64748b; line-height: 24px; margin-bottom: 32px;">
                            We're thrilled to have you join <b>AnalyzeGit</b>. You've just unlocked professional-grade repository auditing and developer persona scoring.
                        </p>
                    </div>
                </div>
            `,
            sender: { "name": "AnalyzeGit", "email": process.env.BREVO_SENDER_EMAIL || "noreply@analyzegit.com" },
            to: [{ "email": email, "name": name }]
        };
        await client.transactionalEmails.sendTransacEmail(emailData);
    } catch (error) {
        console.error('Brevo Email Service Error:', error);
    }
};

const sendOTPEmail = async (email, name, otp) => {
    try {
        if (!process.env.BREVO_API_KEY) return;
        const client = new Brevo.BrevoClient({ apiKey: process.env.BREVO_API_KEY });
        const emailData = {
            subject: `${otp} is your AnalyzeGit Verification Code`,
            htmlContent: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; color: #1e293b; background-color: #f8fafc; text-align: center;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 48px; border-radius: 32px;">
                        <h2>Verify your email</h2>
                        <p>Hello ${name}, use the verification code below to complete your registration. Valid for 5 minutes.</p>
                        <div style="margin: 20px auto; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${otp}</div>
                    </div>
                </div>
            `,
            sender: { "name": "AnalyzeGit", "email": process.env.BREVO_SENDER_EMAIL || "noreply@analyzegit.com" },
            to: [{ "email": email, "name": name }]
        };
        await client.transactionalEmails.sendTransacEmail(emailData);
    } catch (error) {
        console.error('Brevo OTP Email Error:', error);
    }
};

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware('auth-service'));

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (ex) {
        res.status(500).end(ex.message);
    }
});

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    console.log(`[AUTH SERVICE] Registration attempt for: ${email}`);
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
        res.status(201).json({ message: 'OTP sent to email. Please verify.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    console.log(`[AUTH SERVICE] OTP verification for: ${email}`);
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
});

app.post('/resend-otp', async (req, res) => {
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
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`[AUTH SERVICE] Login attempt for: ${email}`);
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
});

app.post('/google', async (req, res) => {
    const { googleId, email, name, avatar } = req.body;
    console.log("[AUTH SERVICE] Google Auth Attempt for:", email);
    try {
        let user = await User.findOne({ googleId });
        if (!user) {
            user = await User.findOne({ email });
            if (user) {
                user.googleId = googleId;
                user.avatar = avatar;
                user.isVerified = true;
                await user.save();
            } else {
                user = await User.create({ name, email, googleId, avatar, isVerified: true });
                sendWelcomeEmail(email, name);
            }
        }
        const token = generateToken(user._id);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'auth-service' });
});

const PORT = process.env.PORT_AUTH || 5001;
app.listen(PORT, () => {
    console.log(`Auth Service running on port ${PORT}`);
});
