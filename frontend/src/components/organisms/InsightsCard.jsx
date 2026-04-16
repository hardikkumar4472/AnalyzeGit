import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const InsightsCard = ({ goodPoints = [], badPoints = [] }) => {
    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 md:p-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-premium"
            >
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Strengths</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goodPoints.map((point, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-emerald-50/80 dark:bg-emerald-900/20 rounded-xl">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{point}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 md:p-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-premium"
            >
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-2xl">
                        <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Areas for Improvement</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {badPoints.map((point, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-rose-50/80 dark:bg-rose-900/20 rounded-xl">
                            <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{point}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default InsightsCard;
