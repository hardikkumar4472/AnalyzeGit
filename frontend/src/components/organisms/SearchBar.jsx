import React from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, Globe, AlertCircle } from 'lucide-react';

const SearchBar = ({ url, setUrl, loading, onAnalyze, error }) => {
    return (
        <div className="w-full">
            <form onSubmit={onAnalyze} className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <Globe className={`w-6 h-6 transition-colors duration-500 ${url ? 'text-amber-500' : 'text-slate-400'}`} />
                </div>
                
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="GitHub URL..."
                    className="w-full pl-14 md:pl-16 pr-16 md:pr-44 py-4 md:py-5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/50 rounded-full focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all font-bold text-sm md:text-lg text-slate-800 dark:text-white shadow-premium hover:border-amber-400/30"
                />

                <div className="absolute right-2 md:right-2 top-2 md:top-2 bottom-2 md:bottom-2">
                    <button
                        type="submit"
                        disabled={loading || !url}
                        className="h-full px-4 md:px-10 bg-yellow-500 hover:bg-yellow-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-black rounded-full font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Search className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="hidden md:inline">Analyze</span>
                            </>
                        )}
                    </button>
                </div>
            </form>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold text-sm"
                >
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </motion.div>
            )}
        </div>
    );
};

export default SearchBar;
