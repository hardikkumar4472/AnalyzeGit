import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, X, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Logo from './Logo';

const AuthModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-10 overflow-hidden"
                    >
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-yellow-50 dark:bg-yellow-900/10 rounded-full blur-3xl opacity-50" />
                        
                        <button 
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="relative flex flex-col items-center text-center">
                            <div className="mb-8 p-5 bg-yellow-500 rounded-2xl shadow-xl shadow-yellow-500/20">
                                <Lock className="w-10 h-10 text-black" />
                            </div>

                            <Logo />
                            
                            <h2 className="text-3xl font-extrabold text-slate-800 mt-6 tracking-tight">
                                {t('modal.limit_title')}
                            </h2>
                            
                            <p className="text-slate-500 mt-4 text-lg leading-relaxed">
                                {t('modal.limit_desc')}
                            </p>

                            <div className="mt-10 w-full space-y-4">
                                <button 
                                    onClick={() => navigate('/auth')}
                                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-black py-4 rounded-xl shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2 group"
                                >
                                    {t('nav.login')} / {t('nav.signup')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                
                                <button 
                                    onClick={onClose}
                                    className="w-full text-slate-400 font-bold py-2 hover:text-slate-600 transition-colors text-sm"
                                >
                                    {t('modal.maybe_later')}
                                </button>
                            </div>

                            <div className="mt-8 flex items-center gap-4 text-slate-400">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} alt="" />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs font-bold uppercase tracking-widest">{t('community.join_text')}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AuthModal;
