import React from 'react'
import { motion } from 'framer-motion'
import { Search, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const SearchBar = ({ url, setUrl, loading, onAnalyze, error }) => {
  const { t } = useTranslation()

  return (
    <div className="w-full relative group">
      <form onSubmit={onAnalyze} className="relative z-10">
        <div className={`relative flex flex-col sm:flex-row items-stretch sm:items-center p-1.5 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[1.5rem] shadow-premium border transition-all duration-500 hover:shadow-glow focus-within:shadow-glow focus-within:ring-4 focus-within:ring-yellow-500/10 ${error ? 'border-red-200 dark:border-red-900/50' : 'border-slate-100 dark:border-slate-800 focus-within:border-yellow-500'}`}>
          <div className="hidden sm:flex pl-6 pr-2">
            <Search className={`w-6 h-6 transition-colors duration-300 ${loading ? 'text-yellow-500 animate-pulse' : 'text-slate-400 group-focus-within:text-yellow-600'}`} />
          </div>
          
          <input 
            type="text" 
            placeholder={t('dashboard.search_placeholder')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="flex-1 bg-transparent border-none outline-none py-3 sm:py-4 px-4 sm:px-0 text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-normal disabled:opacity-50"
          />

          <button 
            type="submit" 
            disabled={loading || !url}
            className="sm:ml-2 px-6 sm:px-8 py-3 sm:py-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-black rounded-xl sm:rounded-[1rem] font-black uppercase tracking-[0.2em] text-[10px] sm:text-[11px] shadow-glow transition-all active:scale-95 flex items-center justify-center gap-2 group/btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('dashboard.analyzing')}</span>
              </>
            ) : (
              <>
                <span>{t('dashboard.analyze')}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Hero Visual Effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 blur-3xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 px-8 py-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
        </motion.div>
      )}
    </div>
  )
}

export default SearchBar
