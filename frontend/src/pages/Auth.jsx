import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { login, signup, verifyOTP, googleLogin, clearError } from '../store';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, Loader2, ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react';
import Logo from '../components/Logo';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { API_BASE_URL } from '../config';

import { useTranslation } from 'react-i18next'
import Header from '../components/Header';

const AuthContent = () => {
    const { t } = useTranslation();
    const [isLogin, setIsLogin] = useState(true);
    const [showOtp, setShowOtp] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(300); 
    const [success, setSuccess] = useState('');
    const { user, loading, error } = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    const navigate = useNavigate();
    const otpRefs = useRef([]);
    useEffect(() => {
        let interval;
        if (showOtp && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [showOtp, timer]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const decoded = jwtDecode(credentialResponse.credential);
            const resultAction = await dispatch(googleLogin({
                googleId: decoded.sub,
                email: decoded.email,
                name: decoded.name,
                avatar: decoded.picture
            }));
            
            if (googleLogin.fulfilled.match(resultAction)) {
                navigate('/');
            }
        } catch (err) {
            console.error('Google Login Error:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(clearError());
        
        try {
            if (isLogin) {
                const resultAction = await dispatch(login({ email: formData.email, password: formData.password }));
                if (login.fulfilled.match(resultAction)) {
                    navigate('/');
                }
            } else {
                const resultAction = await dispatch(signup(formData));
                if (signup.fulfilled.match(resultAction)) {
                    setShowOtp(true);
                    setTimer(300);
                }
            }
        } catch (err) {
            console.error('Auth Submit Error:', err);
        }
    };

    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);
        
        if (value && index < 5) {
            otpRefs.current[index + 1].focus();
        }
    };

    const handleOtpVerify = async (e) => {
        e.preventDefault();
        dispatch(clearError());
        
        const resultAction = await dispatch(verifyOTP({ email: formData.email, otp: otp.join('') }));
        if (verifyOTP.fulfilled.match(resultAction)) {
            navigate('/');
        }
    };

    const handleResend = async () => {
        dispatch(clearError());
        try {
            await axios.post(`${API_BASE_URL}/auth/resend-otp`, { email: formData.email });
            setTimer(300);
            setOtp(['', '', '', '', '', '']);
            setSuccess('New OTP sent to your email!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Resend Error:', err);
        }
    };

    return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <div className="min-h-screen bg-[#f3f4f6] dark:bg-[#09090b] bg-dot-grid flex flex-col transition-colors duration-500">
                <Header />
                <div className="flex-1 flex items-center justify-center p-6">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl p-10 border border-slate-100 dark:border-slate-800 transition-colors duration-500"
                    >
                    <AnimatePresence mode="wait">
                        {!showOtp ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <div className="flex flex-col items-center mb-10">
                                    <button 
                                        onClick={() => navigate('/')}
                                        className="self-start mb-6 text-slate-400 hover:text-blue-600 flex items-center gap-1 text-sm font-bold transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> {t('auth.back_btn')}
                                    </button>
                                    <Logo />
                                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-6">
                                        {isLogin ? t('auth.welcome_back') : t('auth.create_account')}
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center px-4">
                                        {isLogin ? t('auth.login_desc') : t('auth.signup_desc')}
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {!isLogin && (
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input 
                                                type="text" 
                                                placeholder={t('auth.name_placeholder')}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-4 pl-12 pr-4 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                                value={formData.name}
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            />
                                        </div>
                                    )}

                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input 
                                            type="email" 
                                            placeholder={t('auth.email_placeholder')}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-4 pl-12 pr-4 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            required
                                        />
                                    </div>

                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input 
                                            type="password" 
                                            placeholder="Password"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-4 pl-12 pr-4 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                            value={formData.password}
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            required
                                        />
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 text-red-500 text-sm font-medium bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/20">
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}

                                    <button 
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Sign Up')}
                                    </button>
                                </form>

                                <div className="mt-8">
                                    <div className="relative flex items-center mb-6">
                                        <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                                        <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Or</span>
                                        <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                                    </div>

                                    <div className="flex justify-center">
                                        <GoogleLogin
                                            onSuccess={handleGoogleSuccess}
                                            onError={() => console.log('Google Login Failed')}
                                            theme="outline"
                                            shape="pill"
                                            width="320"
                                        />
                                    </div>
                                </div>

                                <p className="text-center mt-10 text-slate-500 text-sm">
                                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                                    <button 
                                        onClick={() => setIsLogin(!isLogin)}
                                        className="text-blue-600 font-bold hover:underline"
                                    >
                                        {isLogin ? 'Sign Up' : 'Sign In'}
                                    </button>
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="otp"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col items-center"
                            >
                                <button 
                                    onClick={() => setShowOtp(false)}
                                    className="self-start mb-6 text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-bold"
                                >
                                    <ArrowLeft className="w-4 h-4" /> {t('auth.back_btn')}
                                </button>
 
                                <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-8 transition-colors">
                                    <ShieldCheck className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                                </div>
 
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Verify Email</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 text-center px-6">
                                    We've sent a 6-digit code to <br />
                                    <b className="text-slate-700 dark:text-slate-200 font-bold">{formData.email}</b>
                                </p>

                                <form onSubmit={handleOtpVerify} className="w-full mt-10">
                                    <div className="flex justify-between gap-2 mb-8">
                                        {otp.map((digit, i) => (
                                            <input
                                                key={i}
                                                ref={(el) => (otpRefs.current[i] = el)}
                                                type="text"
                                                value={digit}
                                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Backspace' && !otp[i] && i > 0) {
                                                        otpRefs.current[i - 1].focus();
                                                    }
                                                }}
                                                className="w-12 h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-center text-xl font-black text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                                                maxLength={1}
                                            />
                                        ))}
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 text-red-500 text-sm font-medium bg-red-50 p-3 rounded-xl border border-red-100 mb-6">
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}

                                    {success && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-2 text-emerald-600 text-sm font-medium bg-emerald-50 p-3 rounded-xl border border-emerald-100 mb-6 font-bold"
                                        >
                                            <ShieldCheck className="w-4 h-4" />
                                            {success}
                                        </motion.div>
                                    )}

                                    <div className="bg-slate-50 dark:bg-slate-800 py-3 px-4 rounded-xl flex items-center justify-between mb-8 transition-colors">
                                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Expires in</span>
                                        <span className={`text-sm font-black ${timer < 60 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {formatTime(timer)}
                                        </span>
                                    </div>

                                    <button
                                        disabled={loading || timer === 0}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
                                    </button>

                                    <button 
                                        type="button"
                                        onClick={handleResend}
                                        className="w-full mt-6 text-slate-400 hover:text-blue-600 flex items-center justify-center gap-2 text-sm font-bold transition-colors"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Resend OTP
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

const Auth = () => <AuthContent />;
export default Auth;
