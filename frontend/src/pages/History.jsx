import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { API_BASE_URL } from '../config';
import { Clock, Download, X, CheckCircle2, FileText, Loader2, Globe, ArrowRight, Filter, ChevronDown } from 'lucide-react';
import Header from '../components/Header';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTranslation } from 'react-i18next';
import ScoreCard from '../components/ScoreCard';
import InsightsCard from '../components/InsightsCard';
import MetadataCard from '../components/MetadataCard';

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortBy, setSortBy] = useState('latest');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const sortRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const itemsPerPage = 5;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortRef.current && !sortRef.current.contains(event.target)) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const { user } = useSelector((state) => state.auth);
    const { t } = useTranslation();

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reset to page 1 when sort changes
    useEffect(() => {
        setCurrentPage(1);
    }, [sortBy]);

    const filteredHistory = history
        .filter(record => 
            record.metadata.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            record.url.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'latest') return new Date(b.createdAt) - new Date(a.createdAt);
            if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
            if (sortBy === 'az') return a.metadata.name.localeCompare(b.metadata.name);
            if (sortBy === 'za') return b.metadata.name.localeCompare(a.metadata.name);
            if (sortBy === 'score-high') return b.analysis.score - a.analysis.score;
            if (sortBy === 'score-low') return a.analysis.score - b.analysis.score;
            return 0;
        });

    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
    const paginatedHistory = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data } = await axios.get(`${API_BASE_URL}/history`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setHistory(data);
            } catch (err) {
                console.error('Failed to fetch history', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchHistory();
    }, [user]);

    const generatePDF = (record) => {
        try {
            const doc = new jsPDF();
            const primaryColor = [234, 179, 8]; // yellow-600 (approx)

            doc.setFillColor(243, 244, 246);
            doc.rect(0, 0, 210, 40, 'F');
            
            doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setLineWidth(1.5);
            doc.line(10, 10, 10, 30);

            doc.setFontSize(24);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text("AnalyzeGit", 18, 22);
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 116, 139);
            doc.text("Architectural Audit Report", 18, 28);

            doc.setFontSize(8);
            doc.text(`Generated on: ${new Date(record.createdAt).toLocaleString()}`, 140, 28);

            doc.setFontSize(14);
            doc.setTextColor(30, 41, 59);
            doc.text("Overall Audit Score", 10, 55);
            
            doc.setFillColor(37, 99, 235);
            doc.roundedRect(10, 60, 50, 20, 3, 3, 'F'); 
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(28); 
            doc.text(`${record.analysis.score}/10`, 15, 75);

            doc.setTextColor(30, 41, 59);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Audit Summary", 70, 65); 
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            const splitSummary = doc.splitTextToSize(record.analysis.summary || "No summary provided.", 120);
            doc.text(splitSummary, 70, 72);

            const rows = [];
            (record.analysis.goodPoints || []).forEach(p => rows.push(['[STRENGTH]', p]));
            (record.analysis.badPoints || []).forEach(p => rows.push(['[IMPROVEMENT]', p]));

            autoTable(doc, {
                startY: 95,
                head: [['Category', 'Audit Findings']],
                body: rows,
                theme: 'striped',
                headStyles: { fillColor: primaryColor, textColor: 255 },
                styles: { fontSize: 8 },
                columnStyles: { 0: { cellWidth: 35, fontStyle: 'bold' } }
            });

            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Source: ${record.url}`, 10, 290);
                doc.text(`Page ${i} of ${pageCount}`, 180, 290);
            }

            doc.save(`${record.metadata.name}_audit_report.pdf`);
        } catch (error) {
            console.error("PDF Generation Error:", error);
        }
    };

    return (
        <div className="min-h-screen text-[var(--foreground)] relative transition-colors duration-500 overflow-x-hidden">
            {/* Mesh Background Synchronization */}
            <div className="bg-mesh" />
            <div className="bg-dot-grid absolute inset-0 z-0 opacity-40" />
            
            <Header />

            <main className="relative z-10 w-full max-w-[1440px] mx-auto pt-24 pb-16 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                        <div>
                            <motion.h1 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-4xl md:text-5xl font-black tracking-tight"
                            >
                                <span className="text-gradient">{t('history.title')}</span>
                            </motion.h1>
                            <motion.p 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-medium"
                            >
                                {t('history.desc')}
                            </motion.p>
                        </div>
                    </div>

                    {/* Search & Sort Section */}
                    {history.length > 0 && (
                        <div className="flex flex-col md:flex-row gap-4 mb-10">
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative flex-1 group"
                            >
                                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                    <Globe className={`w-5 h-5 transition-colors ${searchTerm ? 'text-yellow-500' : 'text-slate-400'}`} />
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search audits..."
                                    className="w-full pl-14 pr-6 py-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl focus:border-yellow-500/50 focus:ring-4 focus:ring-yellow-500/5 outline-none transition-all font-medium text-slate-800 dark:text-white"
                                />
                                {searchTerm && (
                                    <button 
                                        onClick={() => setSearchTerm('')}
                                        className="absolute inset-y-0 right-5 flex items-center px-1 text-slate-400 hover:text-yellow-600 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="relative min-w-[200px]"
                                ref={sortRef}
                            >
                                <button 
                                    onClick={() => setIsSortOpen(!isSortOpen)}
                                    className="w-full pl-12 pr-10 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl focus:border-yellow-500/50 outline-none transition-all font-black text-[10px] uppercase tracking-widest text-slate-800 dark:text-white flex items-center justify-between"
                                >
                                    <span>{
                                        sortBy === 'latest' ? 'Latest First' :
                                        sortBy === 'oldest' ? 'Oldest First' :
                                        sortBy === 'az' ? 'Alphabetic (A-Z)' :
                                        sortBy === 'za' ? 'Alphabetic (Z-A)' :
                                        sortBy === 'score-high' ? 'Score (High-Low)' : 'Score (Low-High)'
                                    }</span>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                    <Filter className="w-4 h-4 text-slate-400" />
                                </div>

                                <AnimatePresence>
                                    {isSortOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 left-0 mt-3 bg-white dark:bg-slate-900 rounded-2xl shadow-3xl border border-slate-100 dark:border-slate-800 py-3 z-[100] overflow-hidden"
                                        >
                                            {[
                                                { value: 'latest', label: 'Latest First' },
                                                { value: 'oldest', label: 'Oldest First' },
                                                { value: 'az', label: 'Alphabetic (A-Z)' },
                                                { value: 'za', label: 'Alphabetic (Z-A)' },
                                                { value: 'score-high', label: 'Score (High-Low)' },
                                                { value: 'score-low', label: 'Score (Low-High)' }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => { setSortBy(opt.value); setIsSortOpen(false); }}
                                                    className={`w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest transition-all
                                                        ${sortBy === opt.value 
                                                          ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' 
                                                          : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <Loader2 className="w-12 h-12 animate-spin mb-6 text-blue-600" />
                            <p className="font-black uppercase tracking-[0.2em] text-xs text-slate-400">{t('history.loading')}</p>
                        </div>
                    ) : paginatedHistory.length > 0 ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <AnimatePresence mode="popLayout">
                                    {paginatedHistory.map((record, index) => (
                                        <motion.div
                                            key={record._id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            transition={{ duration: 0.2 }}
                                            onClick={() => setSelectedRecord(record)}
                                            className="group bg-white dark:bg-slate-900 md:bg-white/40 md:dark:bg-slate-900/40 md:backdrop-blur-xl p-5 md:p-6 rounded-none md:rounded-3xl border-b border-slate-100 dark:border-slate-800 md:border-none md:shadow-premium hover:md:shadow-glow transition-all cursor-pointer active:scale-[0.99]"
                                        >
                                            {/* ... card content ... (keeping existing internal structure) */}
                                            {/* card content starts here */}
                                            {/* User Info Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={record.metadata.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black text-slate-800 dark:text-white capitalize tracking-tight">{record.metadata.name}</span>
                                                            <span className="text-slate-300 dark:text-slate-600 text-[10px]">•</span>
                                                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{new Date(record.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Prominent Score */}
                                                <div className="flex flex-col items-center px-4 py-2 bg-yellow-500 rounded-2xl shadow-glow -mt-2 -mr-2 scale-90 md:scale-100">
                                                    <span className="text-xl md:text-2xl font-black text-black leading-none">{record.analysis.score}</span>
                                                    <span className="text-[8px] font-bold text-black/60 uppercase tracking-widest mt-0.5">SCORE</span>
                                                </div>
                                            </div>

                                            {/* Content Section */}
                                            <div className="space-y-2 mb-4">
                                                <h3 className="text-lg md:text-xl font-black text-yellow-600 dark:text-yellow-500 leading-tight tracking-tight">
                                                    {record.metadata.name}
                                                </h3>
                                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-2 font-medium">
                                                    {record.analysis.summary}
                                                </p>
                                            </div>

                                            <div className="pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] font-black">
                                                        <Globe className="w-3.5 h-3.5" />
                                                        {record.type}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-1.5">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); generatePDF(record); }}
                                                        className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-yellow-500 hover:text-black text-slate-400 rounded-lg transition-all active:scale-90"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 group-hover:bg-yellow-600 transition-all group-hover:text-white text-slate-400 rounded-lg">
                                                        <ArrowRight className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Pagination Interface */}
                            {totalPages > 1 && (
                                <div className="mt-12 flex items-center justify-center gap-2">
                                    <button 
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:border-yellow-500 transition-all active:scale-90"
                                    >
                                        <ChevronDown className="w-4 h-4 rotate-90" />
                                    </button>

                                    <div className="flex items-center bg-slate-100 dark:bg-slate-900/50 backdrop-blur-md p-1.5 rounded-2xl gap-1 border border-slate-200/50 dark:border-slate-800/50">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black transition-all
                                                    ${currentPage === i + 1 
                                                        ? 'bg-yellow-500 text-black shadow-glow scale-110' 
                                                        : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>

                                    <button 
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:border-yellow-500 transition-all active:scale-90"
                                    >
                                        <ChevronDown className="w-4 h-4 -rotate-90" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : history.length > 0 ? (
                        <div className="text-center py-20 bg-white/20 dark:bg-slate-900/20 backdrop-blur-md rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                            <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl shadow-premium flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-slate-800">
                                <X className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">No matches found</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto text-sm font-medium">Try searching for a different repository name or URL.</p>
                            <button onClick={() => setSearchTerm('')} className="mt-6 text-yellow-600 font-bold uppercase tracking-wider text-[10px] hover:underline">
                                Clear Search
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-32 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[2rem] shadow-premium flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-slate-800">
                                <FileText className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3">{t('history.no_audits')}</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-10 text-lg font-medium">{t('history.no_audits_desc')}</p>
                            <button onClick={() => window.location.href = '/'} className="btn-primary-glow bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-[0.2em] px-10 py-5 rounded-[1.5rem] shadow-glow transition-all active:scale-95">
                                {t('history.analyze_repo')}
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Premium Modal Detail */}
            <AnimatePresence>
                {selectedRecord && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-6 md:p-10">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedRecord(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 40 }}
                            className="relative w-full h-full sm:h-auto sm:max-w-[1240px] sm:max-h-[90vh] bg-white dark:bg-slate-900 sm:rounded-3xl shadow-3xl flex flex-col overflow-hidden border-t sm:border border-white/10"
                        >
                            {/* Mobile Header - Sticky */}
                            <div className="sticky top-0 z-[250] flex items-center justify-between p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-100 dark:border-slate-800 sm:hidden">
                                <h2 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Audit Details</h2>
                                <button 
                                    onClick={() => setSelectedRecord(null)}
                                    className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Desktop Close Button */}
                            <div className="hidden sm:block absolute top-6 right-6 z-[250]">
                                <button 
                                    onClick={() => setSelectedRecord(null)}
                                    className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-red-500 rounded-2xl shadow-premium transition-all active:scale-95"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-10 xl:p-14">
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-12 items-start">
                                    {/* Sidebar - Score & Meta */}
                                    <div className="xl:col-span-5 2xl:col-span-4 space-y-6">
                                        <ScoreCard score={selectedRecord.analysis.score} summary={selectedRecord.analysis.summary} />
                                        <MetadataCard metadata={selectedRecord.metadata} type={selectedRecord.type} />
                                        
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">{t('history.generated_at')}</p>
                                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{new Date(selectedRecord.createdAt).toLocaleString()}</p>
                                            </div>
                                            <button 
                                                onClick={() => generatePDF(selectedRecord)}
                                                className="p-3 bg-yellow-500 text-black rounded-xl shadow-glow"
                                            >
                                                <Download className="w-5 h-5" />
                                            </button>
                                        </div>
                                        
                                        <button 
                                            onClick={() => generatePDF(selectedRecord)}
                                            className="hidden sm:flex w-full bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase tracking-[0.2em] py-5 rounded-2xl shadow-glow transition-all items-center justify-center gap-3 active:scale-95 group text-sm"
                                        >
                                            <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" /> 
                                            {t('dashboard.export_pdf')}
                                        </button>
                                    </div>
                                    
                                    {/* Content - Insights */}
                                    <div className="xl:col-span-7 2xl:col-span-8">
                                        <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-6 md:mb-8 flex items-center gap-4 tracking-tight">
                                            <div className="w-1.5 h-6 md:h-8 bg-yellow-500 rounded-full" />
                                            {t('dashboard.audit_details')}
                                        </h2>
                                        <InsightsCard goodPoints={selectedRecord.analysis.goodPoints} badPoints={selectedRecord.analysis.badPoints} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default History;
