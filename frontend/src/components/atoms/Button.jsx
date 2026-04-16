import React from 'react'
import { motion } from 'framer-motion'

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  disabled = false, 
  className = '',
  icon: Icon
}) => {
  const variants = {
    primary: 'bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-500/20 active:scale-95',
    secondary: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-amber-500 shadow-sm active:scale-95',
    outline: 'bg-transparent border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white active:scale-95',
    ghost: 'bg-transparent text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all',
    accent: 'bg-black dark:bg-white text-white dark:text-black font-black hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 transition-all'
  }

  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-xl font-black uppercase tracking-[0.1em] text-[10px] sm:text-[11px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </motion.button>
  )
}

export default Button
