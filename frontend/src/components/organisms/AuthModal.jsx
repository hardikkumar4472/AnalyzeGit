import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AuthModal = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                    />
                    
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-3xl overflow-hidden border border-slate-100 dark:border-slate-800"
                    >
                        <div className="p-10 text-center">
                            <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mx-auto mb-8">
                                <Shield className="w-10 h-10 text-amber-500" />
                            </div>
                            
                            <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">Audit Limit Reached</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-10 font-medium leading-relaxed">
                                You've reached the free limit of 3 guest audits. Please login to unlock unlimited analysis and save your audit history.
                            </p>
                            
                            <div className="flex flex-col gap-4">
                                <Link 
                                    to="/auth" 
                                    onClick={() => {
                                        localStorage.setItem('auth_mode', 'login');
                                        onClose();
                                    }}
                                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    Login Now <ArrowRight size={18} />
                                </Link>
                                
                                <button 
                                    onClick={onClose}
                                    className="w-full text-slate-400 hover:text-slate-600 font-bold text-sm tracking-widest uppercase py-2 transition-colors"
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </div>

                        <button 
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AuthModal;
