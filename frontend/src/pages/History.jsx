import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { API_BASE_URL } from '../config';
import { Clock, Download, X, CheckCircle2, FileText, Loader2, Globe, ArrowRight } from 'lucide-react';
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
    const [selectedRecord, setSelectedRecord] = useState(null);
    const { user } = useSelector((state) => state.auth);
    const { t } = useTranslation();

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
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 bg-white dark:bg-slate-900 rounded-[2rem] shadow-premium border border-slate-100 dark:border-slate-800"
                        >
                            <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </motion.div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <Loader2 className="w-12 h-12 animate-spin mb-6 text-blue-600" />
                            <p className="font-black uppercase tracking-[0.2em] text-xs text-slate-400">{t('history.loading')}</p>
                        </div>
                    ) : history.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6">
                            <AnimatePresence>
                                {history.map((record, index) => (
                                    <motion.div
                                        key={record._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => setSelectedRecord(record)}
                                        className="group bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-premium hover:shadow-glow transition-all flex items-center gap-6 cursor-pointer active:scale-[0.98]"
                                    >
                                        <div className="relative shrink-0">
                                            <img src={record.metadata.avatar} className="w-16 h-16 rounded-xl object-cover ring-4 ring-yellow-50 dark:ring-yellow-900/20" alt="" />
                                            <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-lg shadow-lg ${record.type === 'repo' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                                                <Globe className="w-3 h-3 text-white" />
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 group-hover:text-yellow-500 transition-colors truncate tracking-tight">{record.metadata.name}</h3>
                                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full ${record.type === 'repo' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>
                                                    {record.type}
                                                </span>
                                            </div>
                                            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium truncate max-w-md">{record.url}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                    {new Date(record.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="hidden sm:flex flex-col items-center px-6 border-x border-slate-100 dark:border-slate-800">
                                            <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">{record.analysis.score}</span>
                                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] mt-1">{t('dashboard.score')}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); generatePDF(record); }}
                                                className="p-4 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-yellow-600 rounded-2xl transition-all active:scale-90 border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                                            >
                                                <Download className="w-5 h-5" />
                                            </button>
                                            <div className="p-3 rounded-full group-hover:bg-yellow-600 transition-all group-hover:text-white text-slate-200">
                                                <ArrowRight className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
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
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 md:p-12">
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
                            className="relative w-full max-w-[1240px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-3xl flex flex-col overflow-hidden border border-white/10"
                        >
                            <div className="absolute top-6 right-6 z-[250]">
                                <button 
                                    onClick={() => setSelectedRecord(null)}
                                    className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-red-500 rounded-2xl shadow-premium transition-all active:scale-95"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="overflow-y-auto p-8 md:p-14">
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
                                    {/* Sidebar - Score & Meta */}
                                    <div className="xl:col-span-4 space-y-6 sticky top-0">
                                        <ScoreCard score={selectedRecord.analysis.score} summary={selectedRecord.analysis.summary} />
                                        <MetadataCard metadata={selectedRecord.metadata} type={selectedRecord.type} />
                                        
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{t('history.generated_at')}</p>
                                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{new Date(selectedRecord.createdAt).toLocaleString()}</p>
                                        </div>
                                        
                                        <button 
                                            onClick={() => generatePDF(selectedRecord)}
                                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-black uppercase tracking-[0.2em] py-5 rounded-2xl shadow-glow transition-all flex items-center justify-center gap-3 active:scale-95 group text-sm"
                                        >
                                            <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" /> 
                                            {t('dashboard.export_pdf')}
                                        </button>
                                    </div>
                                    
                                    {/* Content - Insights */}
                                    <div className="xl:col-span-8">
                                        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-4 tracking-tight">
                                            <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
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
