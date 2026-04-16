import React from 'react';
import { motion } from 'framer-motion';
import { Target, Info } from 'lucide-react';

const ScoreCard = ({ score, summary }) => {
    const getScoreColor = (s) => {
        if (s >= 8) return 'text-emerald-500 bg-emerald-500/10';
        if (s >= 5) return 'text-amber-500 bg-amber-500/10';
        return 'text-rose-500 bg-rose-500/10';
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 md:p-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-premium"
        >
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-xl shadow-sm">
                        <Target className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Audit Score</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Overall Assessment</p>
                    </div>
                </div>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm ${getScoreColor(score)}`}>
                    {score}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-start gap-4 p-5 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">
                        "{summary}"
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default ScoreCard;
