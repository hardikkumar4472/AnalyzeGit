import React from 'react'

const Badge = ({ children, variant = 'gray', className = '', icon: Icon }) => {
  const variants = {
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-800/50',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border-red-100 dark:border-red-900/30',
    gray: 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/50'
  }

  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 w-fit ${variants[variant]} ${className}`}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  )
}

export default Badge
