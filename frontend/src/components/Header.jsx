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
  const [scrolled, setScrolled] = useState(false)
  const langRef = useRef(null)

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
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b ${scrolled ? 'py-2 md:py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50' : 'py-3 md:py-6 bg-transparent border-transparent'}`}>
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-center md:justify-between">
        <Link to="/" className="hidden md:block hover:opacity-80 transition-all active:scale-95 shrink-0 scale-90 md:scale-100 origin-left">
          <Logo />
        </Link>
        
        <div className="flex items-center gap-1.5 md:gap-4">
          <button 
            onClick={() => dispatch(toggleTheme())}
            className="p-2.5 md:p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-xl md:rounded-2xl hover:border-yellow-500 transition-all active:scale-95"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Language Dropdown */}
          <div className="relative" ref={langRef}>
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-xl md:rounded-2xl hover:border-yellow-500 transition-all text-[10px] md:text-xs font-black uppercase tracking-widest active:scale-95"
            >
              <Globe className="w-4 h-4 text-slate-400" />
              <span className="hidden xs:inline">{i18n.language}</span>
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
                  className="absolute right-0 mt-3 w-40 bg-white dark:bg-slate-900 rounded-[2rem] shadow-premium border border-slate-100 dark:border-slate-800 py-3 overflow-hidden"
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

          {user ? (
            <div className="flex items-center gap-1.5 md:gap-3 pl-1.5 md:pl-4 border-l border-slate-200/50 dark:border-slate-800/50">
              <Link to="/history" className="p-2.5 md:p-3 bg-slate-100 dark:bg-slate-800 rounded-xl md:rounded-2xl hover:text-yellow-600 transition-all active:scale-95">
                <Clock className="w-4 h-4" />
              </Link>
              <div className="px-3 md:px-5 py-2.5 md:py-3 bg-yellow-500 rounded-xl md:rounded-2xl shadow-glow overflow-hidden max-w-[70px] md:max-w-none">
                <p className="text-[10px] md:text-xs font-black text-black uppercase tracking-widest truncate">{user.name}</p>
              </div>
              <button 
                onClick={() => { dispatch(logout()); navigate('/auth'); }}
                className="p-2.5 md:p-3 hover:text-red-500 transition-all active:scale-95"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link 
              to="/auth"
              className="bg-yellow-500 hover:bg-yellow-600 text-black text-[10px] md:text-xs font-black uppercase tracking-[0.1em] md:tracking-[0.2em] px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl shadow-glow transition-all active:scale-95"
            >
              {t('nav.login')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Header
