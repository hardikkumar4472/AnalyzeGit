import React from 'react'
import { motion } from 'framer-motion'
import { Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const ScoreCard = ({ score, summary }) => {
  const { t } = useTranslation()
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-premium border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center w-full transition-all duration-500 hover:shadow-glow"
    >
      <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center mb-6">
        <Target className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
      </div>
      
      <div className="relative mb-8 group/glass">
        {/* Glass Container */}
        <div className="relative w-36 h-52 border-4 border-slate-200 dark:border-slate-800 rounded-b-xl rounded-t-sm overflow-hidden bg-slate-50 dark:bg-slate-950 shadow-inner">
          
          {/* Surface Shine/Glint */}
          <div className="absolute top-0 left-4 w-4 h-full bg-white/10 dark:bg-white/5 z-20 skew-x-12" />
          <div className="absolute top-0 left-10 w-1 h-full bg-white/5 dark:bg-white/0 z-20 skew-x-12" />

          {/* Liquid Container */}
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: `${score * 10}%` }}
            transition={{ duration: 2.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-yellow-600 via-yellow-400 to-yellow-300 overflow-hidden"
          >
            {/* Bubbles */}
            {[...Array(6)].map((_, i) => (
              <div 
                key={i}
                className="absolute bg-white/30 rounded-full animate-bubble"
                style={{
                  width: `${Math.random() * 6 + 2}px`,
                  height: `${Math.random() * 6 + 2}px`,
                  left: `${Math.random() * 100}%`,
                  bottom: `-10px`,
                  animationDelay: `${Math.random() * 4}s`,
                  animationDuration: `${Math.random() * 2 + 3}s`
                }}
              />
            ))}

            {/* Complex Wave Stack */}
            <div className="absolute top-0 left-1/2 w-[400px] h-[400px] bg-white/40 dark:bg-black/20 rounded-[40%] animate-liquid -translate-x-1/2 -mt-[380px]" />
            <div className="absolute top-0 left-1/2 w-[400px] h-[400px] bg-white/20 dark:bg-black/10 rounded-[35%] animate-liquid -translate-x-1/2 -mt-[380px] [animation-duration:7s]" />
            <div className="absolute top-0 left-1/2 w-[400px] h-[400px] bg-yellow-200/40 dark:bg-yellow-600/20 rounded-[45%] animate-liquid -translate-x-1/2 -mt-[382px] [animation-duration:12s]" />
            
            {/* Surface Glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/40 blur-sm" />
          </motion.div>

          {/* Floating Score */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 mix-blend-difference pointer-events-none">
            <span className="text-7xl font-black text-white drop-shadow-lg">{score}</span>
            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/90">RATIO</span>
          </div>
        </div>
      </div>
      
      <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-3">{t('dashboard.overall_quality')}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{summary}</p>
    </motion.div>
  )
}

export default ScoreCard
