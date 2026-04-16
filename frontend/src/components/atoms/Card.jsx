import React from 'react'
import { motion } from 'framer-motion'

const Card = ({ children, className = '', delay = 0, interactive = false, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 md:p-8 ${interactive ? 'hover:shadow-xl hover:ring-1 hover:ring-amber-500/30 transition-all cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default Card
