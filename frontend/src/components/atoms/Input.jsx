import React from 'react'

export const Input = ({ value, onChange, placeholder, type = 'text', required = false, className = '' }) => {
  return (
    <input 
      type={type} 
      className={`w-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-4 focus:ring-2 ring-amber-500 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900 dark:text-white ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
    />
  )
}

export const TextArea = ({ value, onChange, placeholder, required = false, className = '', height = 'h-32' }) => {
  return (
    <textarea 
      className={`w-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-4 ${height} focus:ring-2 ring-amber-500 outline-none transition-all resize-none placeholder:text-slate-400 font-medium text-slate-900 dark:text-white ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
    />
  )
}
