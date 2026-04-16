import React from 'react';
import { motion } from 'framer-motion';
import { Globe, GitBranch, Terminal, Calendar } from 'lucide-react';

const MetadataCard = ({ metadata, type }) => {
    if (!metadata) return null;

    const stats = [
        { icon: Globe, label: type === 'user' ? 'GitHub Profile' : 'Repository', value: metadata.name },
        { icon: GitBranch, label: type === 'user' ? 'Analysis Level' : 'Primary Language', value: metadata.language || 'N/A' },
        { icon: Calendar, label: type === 'user' ? 'Last Activity' : 'Last Updated', value: metadata.lastUpdate ? new Date(metadata.lastUpdate).toLocaleDateString() : 'N/A' },
        { icon: Terminal, label: 'Analysis Type', value: type || 'Generic' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-premium"
        >
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-2xl">
                    <Globe className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Artifact Metadata</h3>
            </div>

            <div className="space-y-4">
                {stats.map((stat, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                            <stat.icon className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{stat.label}</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default MetadataCard;
