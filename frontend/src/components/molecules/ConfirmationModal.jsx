import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import Button from '../atoms/Button'
import Card from '../atoms/Card'

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md z-[610]"
        >
          <Card className="p-8 border-slate-200/50 dark:border-slate-800/50 shadow-2xl overflow-hidden relative">
            {/* Visual Flare */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${variant === 'danger' ? 'bg-red-500' : 'bg-amber-500'}`} />
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={18} />
            </button>

            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${variant === 'danger' ? 'bg-red-50 dark:bg-red-900/20 text-red-500 shadow-red-500/10' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-500 shadow-amber-500/10'}`}>
              <AlertTriangle size={32} />
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
              {title}
            </h2>
            
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">
              {message}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="secondary" 
                className="flex-1 py-4 font-black uppercase tracking-widest text-[10px]" 
                onClick={onClose}
              >
                {cancelText}
              </Button>
              <Button 
                variant="primary" 
                className={`flex-1 py-4 font-black uppercase tracking-widest text-[10px] ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : ''}`}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
              >
                {confirmText}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default ConfirmationModal
