import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector, useDispatch } from 'react-redux'
import { 
    setAnalysisLoading, 
    setAnalysisProgress, 
    setAnalysisResult, 
    setAnalysisError 
} from '../store'
import { useTranslation } from 'react-i18next'
import SearchBar from '../components/SearchBar'
import ScoreCard from '../components/ScoreCard'
import InsightsCard from '../components/InsightsCard'
import MetadataCard from '../components/MetadataCard'
import Logo from '../components/Logo'
import Header from '../components/Header'
import AuthModal from '../components/AuthModal'
import SkeletonDashboard from '../components/SkeletonDashboard'
import { API_BASE_URL } from '../config'

const API_URL = `${API_BASE_URL}/analyze`

const Dashboard = () => {
    const [url, setUrl] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [socketId, setSocketId] = useState(null)
    
    const { user } = useSelector((state) => state.auth)
    const { result, loading, error, progress } = useSelector((state) => state.analysis)
    const dispatch = useDispatch()
    
    const { t, i18n } = useTranslation()
    const resultsRef = useRef(null)

    useEffect(() => {
        if (result) {
            // Small delay to ensure the component is mounted and layout is stable
            const timer = setTimeout(() => {
                if (resultsRef.current) {
                    const targetY = resultsRef.current.getBoundingClientRect().top + window.pageYOffset - 80;
                    const initialY = window.pageYOffset;
                    const distance = targetY - initialY;
                    const duration = 1200;
                    let start = null;

                    const step = (timestamp) => {
                        if (!start) start = timestamp;
                        const progress = timestamp - start;
                        const percentage = Math.min(progress / duration, 1);
                        const easing = percentage < 0.5 
                            ? 4 * percentage * percentage * percentage 
                            : 1 - Math.pow(-2 * percentage + 2, 3) / 2;

                        window.scrollTo(0, initialY + distance * easing);
                        if (progress < duration) window.requestAnimationFrame(step);
                    };

                    window.requestAnimationFrame(step);
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [result]);

    useEffect(() => {
        const socketInstance = io(API_BASE_URL.replace('/api', ''), {
            transports: ['websocket']
        });

        socketInstance.on('connect', () => {
            setSocketId(socketInstance.id);
            if (user) {
                socketInstance.emit('join-analysis', user._id);
            } else {
                socketInstance.emit('join-analysis', 'anonymous');
            }
        });

        socketInstance.on('analysis-progress', (data) => {
            dispatch(setAnalysisProgress({ stage: data.stage, percent: data.progress }));
        });

        socketInstance.on('analysis-complete', (data) => {
            dispatch(setAnalysisResult(data));
        });

        socketInstance.on('analysis-error', (data) => {
            dispatch(setAnalysisError(data.error));
        });

        return () => socketInstance.disconnect();
    }, [user, API_BASE_URL, dispatch]);

    const handleAnalyze = async (e) => {
        e.preventDefault()
        if (!url) return

        if (!user) {
            const guestCount = parseInt(localStorage.getItem('guest_analysis_count') || '0');
            if (guestCount >= 3) {
                setIsModalOpen(true);
                return;
            }
        }

        dispatch(setAnalysisLoading(true))

        try {
            const config = {
                headers: user ? { Authorization: `Bearer ${user.token}` } : {}
            }
            const { data } = await axios.post(API_URL, { url, lang: i18n.language }, config)
            
            if (data.cached) {
                dispatch(setAnalysisResult(data))
            } else {
                dispatch(setAnalysisProgress({ stage: 'Analysis in Progress...', percent: 10 }));
            }

            if (!user) {
                const currentCount = parseInt(localStorage.getItem('guest_analysis_count') || '0');
                localStorage.setItem('guest_analysis_count', (currentCount + 1).toString());
            }
        } catch (err) {
            dispatch(setAnalysisError(err.response?.data?.error || t('dashboard.error_generic')))
        }
    }

    return (
        <div className="min-h-screen text-[var(--foreground)] relative transition-colors duration-500 overflow-x-hidden">
            {/* Immersive Background */}
            <div className="bg-mesh" />
            <div className="bg-dot-grid absolute inset-0 z-0 opacity-40" />
            
            <Header />

            <main className="relative z-10 w-full max-w-[1440px] mx-auto pt-24 pb-16">
                {/* Hero Section */}
                <div className={`flex flex-col items-center text-center transition-all duration-1000 ${result ? 'mb-8 scale-95 opacity-80' : 'mb-0'}`}>
                    {user && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-10 flex flex-col items-center group"
                        >
                            <h2 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight mb-2">
                                {t('dashboard.hi')}, <span className="text-yellow-600 dark:text-yellow-500">{user.name.split(' ')[0]}</span>
                            </h2>
                        </motion.div>
                    )}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6"
                    >
                        <span className="text-gradient">{t('dashboard.title')}</span> <br /> 
                        <span className="text-slate-500 dark:text-slate-400">{t('dashboard.subtitle')}</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-2xl mb-8 px-6"
                    >
                        {t('dashboard.description')}
                    </motion.p>

                    <div className="w-full max-w-2xl px-6">
                        <SearchBar 
                            url={url} 
                            setUrl={setUrl} 
                            loading={loading} 
                            onAnalyze={handleAnalyze} 
                            error={error} 
                        />
                    </div>

                    <AnimatePresence>
                        {loading && progress.percent > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="mt-16 w-full max-w-lg px-6"
                            >
                                <div className="flex justify-between items-center mb-3 px-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-yellow-500 dark:text-yellow-400 animate-pulse">
                                        {progress.stage}
                                    </span>
                                    <span className="text-xs font-black text-slate-800 dark:text-white bg-yellow-400 dark:bg-yellow-400/20 px-3 py-1 rounded-full">
                                        {progress.percent}%
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden shadow-inner p-0.5 border border-slate-200/20 dark:border-slate-700/20">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress.percent}%` }}
                                        transition={{ duration: 1, ease: "circOut" }}
                                        className="h-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-[length:200%_auto] animate-shimmer rounded-full relative"
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!result && !loading && null}
                </div>

                {/* Structured Audit Dashboard */}
                <AnimatePresence>
                    {loading && progress.percent > 0 && !result && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <SkeletonDashboard />
                        </motion.div>
                    )}
                    {result && (
                        <motion.div 
                            ref={resultsRef}
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="px-6 pt-8 pb-20"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                {/* Insights - Left Pillar */}
                                <div className="lg:col-span-12 xl:col-span-8 space-y-8 order-2 xl:order-1">
                                    <InsightsCard goodPoints={result.analysis.goodPoints} badPoints={result.analysis.badPoints} />
                                </div>

                                {/* Summary & Score - Right Sidebar */}
                                <div className="lg:col-span-12 xl:col-span-4 space-y-8 order-1 xl:order-2">
                                    <ScoreCard score={result.analysis.score} summary={result.analysis.summary} />
                                    <MetadataCard metadata={result.metadata} type={result.type} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    )
}

export default Dashboard
