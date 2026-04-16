import React from 'react'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'

const JobSidebarItem = ({ job, isSelected, onClick, onDelete }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative group p-4 rounded-2xl cursor-pointer transition-all border shadow-sm
        ${isSelected 
          ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-500/20' 
          : 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-amber-400'}`}
      onClick={onClick}
    >
      <div className="pr-8">
        <h4 className="font-bold truncate">{job.title}</h4>
        <p className={`text-xs ${isSelected ? 'text-amber-100' : 'text-slate-500'}`}>
          {new Date(job.createdAt).toLocaleDateString()}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(job.jobId);
        }}
        className={`absolute top-1/2 -translate-y-1/2 right-3 p-2 rounded-xl transition-all
          ${isSelected 
            ? 'text-amber-200 hover:text-white hover:bg-white/10' 
            : 'text-slate-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20'}
          opacity-0 group-hover:opacity-100`}
      >
        <Trash2 size={16} />
      </button>
    </motion.div>
  )
}

export default JobSidebarItem
