import React from 'react'
import { motion } from 'framer-motion'
import { Zap, Shield, Search, Terminal } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const Features = () => {
    const { t } = useTranslation()

    const features = [
        {
            icon: <Zap className="w-6 h-6 text-yellow-500" />,
            title: t('features.speed_title') || 'Instant Scaler',
            desc: t('features.speed_desc') || 'Real-time analysis powered by BullMQ and Redis for ultra-fast architectural audits.'
        },
        {
            icon: <Shield className="w-6 h-6 text-emerald-500" />,
            title: t('features.ai_title') || 'Gemini 1.5 Pro',
            desc: t('features.ai_desc') || 'Advanced LLM cross-references your code with industrial standards and best practices.'
        },
        {
            icon: <Search className="w-6 h-6 text-amber-500" />,
            title: t('features.search_title') || 'Deep Insights',
            desc: t('features.search_desc') || 'Go beyond stars and forks. Understand the actual architectural patterns of a repo.'
        },
        {
            icon: <Terminal className="w-6 h-6 text-slate-500" />,
            title: t('features.tech_title') || 'Tech Profiling',
            desc: t('features.tech_desc') || 'Identify developer personas and technology stacks from repository fingerprints.'
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 px-6">
            {features.map((f, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="p-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-premium hover:shadow-glow transition-all"
                >
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                        {f.icon}
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white mb-3">{f.title}</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </motion.div>
            ))}
        </div>
    )
}

export default Features
