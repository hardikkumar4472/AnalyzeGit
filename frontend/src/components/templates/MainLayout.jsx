import React from 'react'
import Header from '../organisms/Header' 

const MainLayout = ({ children, maxWidth = 'max-w-[1440px]', className = '', pt = 'pt-28' }) => {
  return (
    <div className="min-h-screen text-[var(--foreground)] relative transition-colors duration-500 overflow-x-hidden">
      <div className="bg-mesh" />
      <div className="bg-dot-grid absolute inset-0 z-[-1] opacity-40 pointer-events-none" />

      <Header />

      <main className={`relative w-full ${maxWidth} mx-auto ${pt} pb-16 px-6 ${className}`}>
        {children}
      </main>
    </div>
  )
}

export default MainLayout
