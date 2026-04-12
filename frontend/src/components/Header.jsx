import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout, toggleTheme } from '../store'
import Logo from './Logo'
import { useTranslation } from 'react-i18next'
import { User, LogOut, Clock, Globe, Sun, Moon, ChevronDown } from 'lucide-react'

const Header = () => {
  const { user } = useSelector((state) => state.auth)
  const { isDarkMode } = useSelector((state) => state.theme)
  const dispatch = useDispatch()
  
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const langRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang)
    setIsLangOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setIsLangOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b ${scrolled ? 'py-2 md:py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 shadow-sm' : 'py-3 md:py-6 bg-transparent border-transparent'}`}>
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-between">
        <Link to="/" className="hover:opacity-80 transition-all active:scale-95 shrink-0 origin-left scale-85 md:scale-100">
          <Logo />
        </Link>
        
        <div className="flex items-center gap-2 md:gap-4">
          {/* Controls Capsule - Mobile only */}
          <div className="flex sm:hidden items-center bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl p-1 gap-1 border border-slate-200/30 dark:border-slate-700/30">
            <button 
              onClick={() => dispatch(toggleTheme())}
              className="p-2 text-slate-500 dark:text-slate-400"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />
            {user ? (
               <Link to="/history" className="p-2 text-slate-500 dark:text-slate-400">
                  <Clock className="w-4 h-4" />
               </Link>
            ) : (
                <Link to="/auth" className="p-2 text-yellow-600 font-black text-[10px] uppercase">Login</Link>
            )}
          </div>

          {/* Desktop Controls */}
          <div className="hidden sm:flex items-center gap-3">
             <button 
                onClick={() => dispatch(toggleTheme())}
                className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-yellow-500 transition-all"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>

              <div className="relative" ref={langRef}>
                <button 
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-yellow-500 transition-all text-xs font-black uppercase tracking-widest"
                >
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span>{i18n.language}</span>
                  <motion.div animate={{ rotate: isLangOpen ? 180 : 0 }}>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isLangOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-40 bg-white dark:bg-slate-900 rounded-2xl shadow-premium border border-slate-100 dark:border-slate-800 py-3 overflow-hidden"
                    >
                      {[
                        { code: 'en', label: 'English' },
                        { code: 'hi', label: 'हिंदी' }
                      ].map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => changeLanguage(lang.code)}
                          className={`w-full px-5 py-3 text-left text-xs font-black uppercase tracking-widest transition-all
                            ${i18n.language === lang.code 
                              ? 'text-yellow-600 bg-yellow-50/50 dark:bg-yellow-900/20' 
                              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
          </div>

          {user && (
            <div className="flex items-center gap-1.5 md:gap-3 pl-2 md:pl-4 border-l border-slate-200 dark:border-slate-800">
              {/* Profile Context - Clickable */}
              <div className="relative group/profile" ref={profileRef}>
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 md:gap-3 focus:outline-none group active:scale-95 transition-all"
                >
                  <div className="hidden xs:flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-tight text-slate-800 dark:text-white group-hover:text-yellow-600 transition-colors">{user.name}</span>
                  </div>
                  <img 
                      src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=EAB308&color=000&bold=true`} 
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 shadow-glow object-cover transition-all ${isProfileOpen ? 'border-yellow-500 scale-110' : 'border-transparent hover:border-yellow-500/50'}`}
                      alt=""
                  />
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-3xl shadow-3xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[200]"
                    >
                      <div className="p-6 bg-gradient-to-br from-yellow-500/10 to-transparent dark:from-yellow-500/5">
                        <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-1">Account details</p>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{user.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{user.email}</p>
                      </div>
                      <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                        <button 
                          onClick={() => { dispatch(logout()); navigate('/auth'); }}
                          className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all text-xs font-black uppercase tracking-widest"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button 
                onClick={() => { dispatch(logout()); navigate('/auth'); }}
                className="hidden sm:flex w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Header
