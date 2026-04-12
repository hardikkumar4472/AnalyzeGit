import React from 'react'
import { motion } from 'framer-motion'

const Logo = () => {
  return (
    <div className="flex items-center gap-3 group px-2 py-1">
      <div className="relative w-8 h-8 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 grid grid-cols-2 gap-1"
        >
          <div className="w-3 h-3 rounded-full bg-yellow-500 group-hover:scale-110 transition-transform" />
          <div className="w-3 h-3 rounded-full bg-slate-400 group-hover:scale-95 transition-transform" />
          <div className="w-3 h-3 rounded-full bg-slate-400 group-hover:scale-95 transition-transform" />
          <div className="w-3 h-3 rounded-full bg-yellow-500 group-hover:scale-110 transition-transform" />
        </motion.div>
        <div className="w-2 h-2 rounded-full bg-yellow-400 blur-[2px] animate-pulse" />
      </div>
      <span className="text-xl font-black tracking-tight text-slate-800 dark:text-white pb-0.5">
        Analyze<span className="text-yellow-500">Git</span>
      </span>
    </div>
  )
}

export default Logo
