import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { API_BASE_URL } from '../config';
import { Download, X, FileText, Globe, ArrowRight, Filter, ChevronDown, CheckCircle2, Briefcase, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import MainLayout from '../components/templates/MainLayout'
import Card from '../components/atoms/Card'
import Button from '../components/atoms/Button'
import Badge from '../components/atoms/Badge'
import Skeleton from '../components/atoms/Skeleton'
import ScoreCard from '../components/organisms/ScoreCard'
import InsightsCard from '../components/organisms/InsightsCard'
import MetadataCard from '../components/organisms/MetadataCard'

const History = () => {
    const [activeTab, setActiveTab] = useState('git'); // 'git' or 'jobs'
    const [history, setHistory] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortBy, setSortBy] = useState('latest');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const sortRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const itemsPerPage = 6;

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

    useEffect(() => {
        setCurrentPage(1);
    }, [sortBy]);

    const dataToDisplay = activeTab === 'git' ? history : jobs;

    const filteredData = dataToDisplay
        .filter(item => {
            if (activeTab === 'git') {
                return item.metadata.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                       item.url.toLowerCase().includes(debouncedSearch.toLowerCase());
            } else {
                return item.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                       item.description.toLowerCase().includes(debouncedSearch.toLowerCase());
            }
        })
        .sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            if (sortBy === 'latest') return dateB - dateA;
            if (sortBy === 'oldest') return dateA - dateB;
            if (activeTab === 'git') {
                if (sortBy === 'az') return a.metadata.name.localeCompare(b.metadata.name);
                if (sortBy === 'za') return b.metadata.name.localeCompare(a.metadata.name);
                if (sortBy === 'score-high') return b.analysis.score - a.analysis.score;
                if (sortBy === 'score-low') return a.analysis.score - b.analysis.score;
            } else {
                if (sortBy === 'az') return a.title.localeCompare(b.title);
                if (sortBy === 'za') return b.title.localeCompare(a.title);
            }
            return 0;
        });

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [historyRes, jobsRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/history`, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    }),
                    axios.get(`${API_BASE_URL}/jobs`, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    })
                ]);
                setHistory(historyRes.data);
                setJobs(jobsRes.data);
            } catch (err) {
                console.error('Failed to fetch history data', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [user]);

    const generatePDF = (record) => {
        try {
            const doc = new jsPDF();
            const primaryColor = [217, 119, 6]; // amber-600

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
            
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
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

    const handleDeleteJob = async (jobId) => {
        if (!window.confirm('Are you sure you want to delete this job? This will permanently remove all candidates and analysis data.')) return;

        try {
            await axios.delete(`${API_BASE_URL}/jobs/${jobId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            toast.success('Job deleted successfully');
            setJobs(jobs.filter(j => j.jobId !== jobId));
        } catch (error) {
            toast.error('Failed to delete job');
        }
    };

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                    <div>
                        <motion.h1 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-4xl md:text-5xl font-black tracking-tight"
                        >
                            <span className="text-gradient font-black">{t('history.title')}</span>
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

                <div className="flex bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-1.5 rounded-2xl gap-2 mb-10 border border-slate-200/50 dark:border-slate-800/50 w-fit">
                    <button
                        onClick={() => { setActiveTab('git'); setCurrentPage(1); }}
                        className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                            ${activeTab === 'git' 
                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' 
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'}`}
                    >
                        Git Analyzes
                    </button>
                    <button
                        onClick={() => { setActiveTab('jobs'); setCurrentPage(1); }}
                        className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                            ${activeTab === 'jobs' 
                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' 
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'}`}
                    >
                        Job Descriptions
                    </button>
                </div>



                {dataToDisplay.length > 0 && (
                    <div className="flex flex-col md:flex-row gap-4 mb-10">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                <Globe className={`w-5 h-5 transition-colors ${searchTerm ? 'text-amber-500' : 'text-slate-400'}`} />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={activeTab === 'git' ? "Search audits..." : "Search job posts..."}
                                className="w-full pl-14 pr-6 py-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all font-medium text-slate-800 dark:text-white"
                            />
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm('')}
                                    className="absolute inset-y-0 right-5 flex items-center px-1 text-slate-400 hover:text-amber-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="relative min-w-[220px]" ref={sortRef}>
                            <Button 
                                variant="secondary"
                                className="w-full py-4 justify-between"
                                onClick={() => setIsSortOpen(!isSortOpen)}
                            >
                                <span>{
                                    sortBy === 'latest' ? 'Latest First' :
                                    sortBy === 'oldest' ? 'Oldest First' :
                                    sortBy === 'az' ? 'Alphabetic (A-Z)' :
                                    sortBy === 'za' ? 'Alphabetic (Z-A)' :
                                    sortBy === 'score-high' ? 'Score (High-Low)' : 'Score (Low-High)'
                                }</span>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                            </Button>
                            
                            <AnimatePresence>
                                {isSortOpen && (
                                    <Card className="absolute right-0 left-0 mt-3 p-2 z-[100] border-slate-100 dark:border-slate-800">
                                        {[
                                            { value: 'latest', label: 'Latest First' },
                                            { value: 'oldest', label: 'Oldest First' },
                                            { value: 'az', label: 'Alphabetic (A-Z)' },
                                            { value: 'za', label: 'Alphabetic (Z-A)' },
                                            ...(activeTab === 'git' ? [
                                                { value: 'score-high', label: 'Score (High-Low)' },
                                                { value: 'score-low', label: 'Score (Low-High)' }
                                            ] : [])
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => { setSortBy(opt.value); setIsSortOpen(false); }}
                                                className={`w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest transition-all rounded-xl
                                                    ${sortBy === opt.value 
                                                      ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' 
                                                      : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </Card>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10">
                        {[1, 2, 3, 4].map(n => (
                            <Card key={n} className="p-6 h-48 flex flex-col justify-between">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="w-8 h-8 rounded-full" />
                                        <Skeleton className="w-24 h-4 rounded-md" />
                                    </div>
                                    <Skeleton className="w-12 h-16 rounded-2xl" />
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="w-16 h-6 rounded-md" />
                                    <Skeleton className="w-16 h-6 rounded-md" />
                                    <Skeleton className="w-16 h-6 rounded-md" />
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : paginatedData.length > 0 ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <AnimatePresence mode="popLayout">
                                {paginatedData.map((item, index) => (
                                    activeTab === 'git' ? (
                                        <Card
                                            key={item._id}
                                            interactive
                                            onClick={() => setSelectedRecord(item)}
                                            className="p-6 h-full flex flex-col"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={item.metadata.avatar} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" alt="" />
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black text-slate-800 dark:text-white capitalize tracking-tight">{item.metadata.name}</span>
                                                            <span className="text-slate-300 dark:text-slate-600 text-[10px]">•</span>
                                                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{new Date(item.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-center px-4 py-2 bg-amber-600 rounded-2xl shadow-lg relative z-20 scale-90 md:scale-100 shrink-0">
                                                    <span className="text-xl md:text-2xl font-black text-white leading-none">{item.analysis.score}</span>
                                                    <span className="text-[8px] font-bold text-white/70 uppercase tracking-widest mt-0.5">SCORE</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-4 flex-1">
                                                <h3 className="text-lg md:text-xl font-black text-amber-600 dark:text-amber-400 tracking-tight leading-tight">
                                                    {item.metadata.name}
                                                </h3>
                                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 font-medium">
                                                    {item.analysis.summary}
                                                </p>
                                            </div>

                                            <div className="pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                                <Badge variant="amber" icon={Globe}>{item.type}</Badge>
                                                
                                                <div className="flex items-center gap-1.5">
                                                    <Button 
                                                        variant="secondary"
                                                        className="p-2.5 min-w-0"
                                                        icon={Download}
                                                        onClick={(e) => { e.stopPropagation(); generatePDF(item); }}
                                                    />
                                                    <Button 
                                                        variant="primary"
                                                        className="p-2.5 min-w-0"
                                                        icon={ArrowRight}
                                                        onClick={(e) => { e.stopPropagation(); setSelectedRecord(item); }}
                                                    />
                                                </div>
                                            </div>
                                        </Card>
                                    ) : (
                                        <Card key={item._id} className="p-6 h-full flex flex-col group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-500">
                                                <Briefcase size={80} />
                                            </div>
                                            
                                            <div className="flex items-start justify-between mb-6">
                                                <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl">
                                                    <Briefcase className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="amber">{new Date(item.createdAt).toLocaleDateString()}</Badge>
                                                    <button 
                                                        onClick={() => handleDeleteJob(item.jobId)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex-1 space-y-3 mb-8">
                                                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight group-hover:text-amber-600 transition-colors">
                                                    {item.title}
                                                </h3>
                                                <p className="text-slate-500 dark:text-slate-300 text-sm font-medium line-clamp-3 leading-relaxed">
                                                    {item.description}
                                                </p>
                                            </div>

                                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                                                <Link to={`/apply/${item.jobId}`} className="flex-1">
                                                    <Button variant="secondary" className="w-full text-[10px] py-3 tracking-widest uppercase font-black" icon={ExternalLink}>
                                                        View Form
                                                    </Button>
                                                </Link>
                                                <Link to="/dashboard/recruiter" className="flex-1">
                                                    <Button variant="primary" className="w-full text-[10px] py-3 tracking-widest uppercase font-black" icon={ArrowRight}>
                                                        Manage
                                                    </Button>
                                                </Link>
                                            </div>
                                        </Card>
                                    )
                                ))}
                            </AnimatePresence>
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-12 flex items-center justify-center gap-2">
                                <Button 
                                    variant="secondary"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    className="p-3 min-w-0"
                                    icon={() => <ChevronDown className="w-4 h-4 rotate-90" />}
                                />

                                <div className="flex flex-wrap items-center justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-1.5 rounded-2xl gap-1 border border-slate-200/50 dark:border-slate-800/50 max-w-[280px] sm:max-w-none">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-9 h-9 min-w-[36px] rounded-xl flex items-center justify-center text-xs font-black transition-all
                                                ${currentPage === i + 1 
                                                    ? 'bg-amber-600 text-white shadow-lg' 
                                                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

                                <Button 
                                    variant="secondary"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    className="p-3 min-w-0"
                                    icon={() => <ChevronDown className="w-4 h-4 -rotate-90" />}
                                />
                            </div>
                        )}
                    </div>
                ) : dataToDisplay.length > 0 ? (
                    <Card className="text-center py-20 border-dashed">
                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-premium flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-slate-800">
                            <X className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">No matches found</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto text-sm font-medium">Try searching for a different {activeTab === 'git' ? 'repository name or URL' : 'job title or description'}.</p>
                        <button onClick={() => setSearchTerm('')} className="mt-6 text-amber-600 font-bold uppercase tracking-wider text-[10px] hover:underline">
                            Clear Search
                        </button>
                    </Card>
                ) : (
                    <Card className="text-center py-32 border-2 border-dashed">
                        <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[2rem] shadow-premium flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-slate-800">
                            {activeTab === 'git' ? <FileText className="w-10 h-10 text-slate-300" /> : <Briefcase className="w-10 h-10 text-slate-300" />}
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3">
                            {activeTab === 'git' ? t('history.no_audits') : 'No Job Posts Created'}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-10 text-lg font-medium">
                            {activeTab === 'git' ? t('history.no_audits_desc') : 'Start hiring by creating your first job post today.'}
                        </p>
                        <Link to={activeTab === 'git' ? '/' : '/jobs/create'}>
                            <Button className="px-10 py-5 text-base">
                                {activeTab === 'git' ? t('history.analyze_repo') : 'Create Job Post'}
                            </Button>
                        </Link>
                    </Card>
                )}
            </div>

            <AnimatePresence>
                {selectedRecord && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedRecord(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
                        />
                        <Card className="relative w-full h-full bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden z-[210] rounded-none border-none shadow-none">
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 md:p-8 border-b border-slate-100 dark:border-slate-800">
                                <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Audit Details</h2>
                                <button 
                                    onClick={() => setSelectedRecord(null)}
                                    className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-red-500 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-10">
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                                    <div className="xl:col-span-5 space-y-6">
                                        <ScoreCard score={selectedRecord.analysis.score} summary={selectedRecord.analysis.summary} />
                                        <MetadataCard metadata={selectedRecord.metadata} type={selectedRecord.type} />
                                        
                                        <Card className="p-6 flex justify-between items-center bg-white dark:bg-slate-800 border-none shadow-premium">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{t('history.generated_at')}</p>
                                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{new Date(selectedRecord.createdAt).toLocaleString()}</p>
                                            </div>
                                            <Button 
                                                variant="primary"
                                                className="p-3 min-w-0"
                                                icon={Download}
                                                onClick={() => generatePDF(selectedRecord)}
                                            />
                                        </Card>
                                        
                                        <Button 
                                            className="w-full py-5 text-sm"
                                            icon={Download}
                                            onClick={() => generatePDF(selectedRecord)}
                                        >
                                            {t('dashboard.export_pdf')}
                                        </Button>
                                    </div>
                                    
                                    <div className="xl:col-span-7 space-y-8">
                                        <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white flex items-center gap-4 tracking-tight">
                                            <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
                                            {t('dashboard.audit_details')}
                                        </h2>
                                        <InsightsCard goodPoints={selectedRecord.analysis.goodPoints} badPoints={selectedRecord.analysis.badPoints} />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </AnimatePresence>
        </MainLayout>
    );
};

export default History;
