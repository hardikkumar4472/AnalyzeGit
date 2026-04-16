import React from 'react'
import { Input, TextArea } from '../atoms/Input'

const FormField = ({ label, value, onChange, placeholder, type = 'text', required = false, isTextArea = false, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest px-1">
        {label}
      </label>
      {isTextArea ? (
        <TextArea 
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
        />
      ) : (
        <Input 
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
        />
      )}
    </div>
  )
}

export default FormField
