import React from 'react';
import { motion } from 'framer-motion';
import Logo from './Logo';

const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white dark:bg-[#09090b] transition-colors duration-500">

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)] pointer-events-none" />
            
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                    opacity: [0.5, 1, 0.5],
                    scale: [0.98, 1.02, 0.98]
                }}
                transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                }}
                className="relative flex flex-col items-center"
            >
                <div className="mb-8 p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-amber-500/10 border border-slate-100 dark:border-slate-800 transition-colors duration-500">
                    <Logo />
                </div>
                <div className="w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-amber-600"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ 
                            duration: 1.5, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                        }}
                    />
                </div>
            </motion.div>
        </div>
    );
};

export default LoadingScreen;
