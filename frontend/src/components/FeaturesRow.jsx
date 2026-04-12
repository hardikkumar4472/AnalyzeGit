import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Zap, BarChart3, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const features = [
  { icon: Zap, key: 'speed' },
  { icon: Shield, key: 'security' },
  { icon: BarChart3, key: 'insights' },
  { icon: Globe, key: 'global' },
]

const FeaturesRow = () => {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl w-full mt-20 px-4">
      {features.map((feature, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.1 }}
          className="flex flex-col items-center text-center group"
        >
          <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl shadow-premium border border-slate-100 dark:border-slate-800 flex items-center justify-center mb-4 group-hover:border-blue-500 dark:group-hover:border-blue-400 group-hover:shadow-glow transition-all duration-300">
            <feature.icon className="w-5 h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
            {t(`features.${feature.key}.title`)}
          </h4>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            {t(`features.${feature.key}.tag`)}
          </p>
        </motion.div>
      ))}
    </div>
  )
}

export default FeaturesRow
