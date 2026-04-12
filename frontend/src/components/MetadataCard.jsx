import React from 'react'
import { motion } from 'framer-motion'
import { Code2, Globe, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const MetadataCard = ({ metadata, type }) => {
  const { t } = useTranslation()
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl shadow-premium border border-slate-200/50 dark:border-slate-800/50 flex items-center gap-6 w-full transition-all duration-500 hover:shadow-glow font-['Outfit',sans-serif]"
    >
      <div className="relative shrink-0">
        <img src={metadata.avatar} className="w-16 h-16 rounded-xl object-cover ring-4 ring-yellow-50 dark:ring-yellow-900/20" alt="" />
        <div className="absolute -bottom-1 -right-1 bg-yellow-500 p-2 rounded-xl shadow-lg">
          {type === 'user' ? <User className="w-3.5 h-3.5 text-white" /> : <Code2 className="w-3.5 h-3.5 text-white" />}
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 truncate tracking-tight">{metadata.name}</h4>
        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">
          {type === 'user' ? t('metadata.user') : t('metadata.repo')}
        </p>
      </div>

      <a 
        href={metadata.url} 
        target="_blank" 
        rel="noreferrer"
        className="p-4 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all active:scale-90 group border border-slate-100 dark:border-slate-700"
      >
        <Globe className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-yellow-600 dark:group-hover:text-yellow-400" />
      </a>
    </motion.div>
  )
}

export default MetadataCard
