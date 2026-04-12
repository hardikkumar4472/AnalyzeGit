import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Lightbulb } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const InsightsCard = ({ goodPoints, badPoints }) => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-8 w-full font-['Outfit',sans-serif]">
      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl shadow-premium border border-slate-200/50 dark:border-slate-800/50 transition-all duration-500 hover:shadow-glow"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl transition-colors">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">{t('insights.strengths')}</h4>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goodPoints.map((point, i) => (
            <motion.li 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="flex gap-3 text-slate-600 dark:text-slate-400 text-sm leading-relaxed"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" /> {point}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl shadow-premium border border-slate-200/50 dark:border-slate-800/50 transition-all duration-500 hover:shadow-glow"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl transition-colors">
            <Lightbulb className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">{t('insights.improvements')}</h4>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {badPoints.map((point, i) => (
            <motion.li 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="flex gap-3 text-slate-600 dark:text-slate-400 text-sm leading-relaxed"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" /> {point}
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  )
}

export default InsightsCard
