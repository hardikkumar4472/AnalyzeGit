import React, { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, UserCheck, X, Share2, Copy, Briefcase, ChevronDown, Check, AlertTriangle, Trash2 } from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { API_BASE_URL } from '../config'
import MainLayout from '../components/templates/MainLayout'
import Card from '../components/atoms/Card'
import Button from '../components/atoms/Button'
import JobSidebarItem from '../components/molecules/JobSidebarItem'
import CandidateCard from '../components/organisms/CandidateCard'
import ScoreCard from '../components/organisms/ScoreCard'
import InsightsCard from '../components/organisms/InsightsCard'
import MetadataCard from '../components/organisms/MetadataCard'
import ConfirmationModal from '../components/molecules/ConfirmationModal'
import Skeleton from '../components/atoms/Skeleton'

const RecruiterDashboard = () => {
  const { t } = useTranslation()
  const { user } = useSelector((state) => state.auth)
  const [jobs, setJobs] = useState([])
  const [selectedJobId, setSelectedJobId] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedGitAnalysis, setSelectedGitAnalysis] = useState(null)
  const [showTopOnly, setShowTopOnly] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [isJobsMenuOpen, setIsJobsMenuOpen] = useState(false)
  const [jobToDelete, setJobToDelete] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const selectedJobIdRef = useRef(selectedJobId);
  useEffect(() => {
    selectedJobIdRef.current = selectedJobId;
  }, [selectedJobId]);

  useEffect(() => {
    fetchJobs()

    if (user) {
      const socket = io(API_BASE_URL.replace('/api', ''));
      
      socket.on(`jobUpdate:${user._id}`, (data) => {
        if (data.action === 'created') {
          setJobs(prev => [data.job, ...prev]);
        } else if (data.action === 'deleted') {
          setJobs(prev => prev.filter(j => j.jobId !== data.jobId));
        }
      });

      socket.on(`candidateUpdate:${user._id}`, (data) => {
        if (data.action === 'applied') {
          toast.success(`Live Update: New application received from ${data.candidate.name}!`, { icon: '🚀' });
          if (selectedJobIdRef.current === data.jobId) {
            setCandidates(prev => {
              const exists = prev.find(c => c._id === data.candidate._id);
              if (exists) return prev;
              return [data.candidate, ...prev].sort((a, b) => (b.analysis?.score || 0) - (a.analysis?.score || 0));
            });
          }
        }
      });

      return () => socket.disconnect();
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/jobs`, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      setJobs(response.data)
      if (response.data.length > 0) {
        setSelectedJobId(response.data[0].jobId)
        fetchCandidates(response.data[0].jobId)
      }
    } catch (error) {
      toast.error('Failed to fetch jobs')
    }
  }

  const fetchCandidates = async (jobId) => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/candidates/${jobId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      setCandidates(response.data)
    } catch (error) {
      toast.error('Failed to fetch candidates')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteJob = async (jobId) => {
    try {
      await axios.delete(`${API_BASE_URL}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      toast.success('Job deleted successfully');
      
      const updatedJobs = jobs.filter(j => j.jobId !== jobId);
      setJobs(updatedJobs);
      setJobToDelete(null);
      
      if (selectedJobId === jobId) {
        if (updatedJobs.length > 0) {
          setSelectedJobId(updatedJobs[0].jobId);
          fetchCandidates(updatedJobs[0].jobId);
        } else {
          setSelectedJobId(null);
          setCandidates([]);
        }
      }
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const copyToClipboard = (text) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        toast.success(t('recruitment.link_copied') || 'Link copied to clipboard!');
      } else {
        throw new Error('Fallback copy failed');
      }
    } catch (err) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success(t('recruitment.link_copied') || 'Link copied to clipboard!');
      }).catch(e => {
        toast.error('Copy failed');
        console.error(e);
      });
    }
  };

  const selectedJob = jobs.find(j => j.jobId === selectedJobId)

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-80 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users size={20} className="text-amber-500" /> {t('recruitment.active_jobs')}
            </h2>
            <Link to="/jobs/create">
              <Button variant="primary" className="p-2 min-w-0" icon={Plus} />
            </Link>
          </div>
          
          <div className="md:hidden relative">
            <button 
              onClick={() => setIsJobsMenuOpen(!isJobsMenuOpen)}
              className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Briefcase className="text-amber-500 w-4 h-4" />
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {selectedJob ? selectedJob.title : 'Select Job'}
                </span>
              </div>
              <ChevronDown className={`text-slate-400 transition-transform ${isJobsMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isJobsMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 z-[100] bg-white dark:bg-slate-900 rounded-2xl shadow-premium border border-slate-100 dark:border-slate-800 py-3 overflow-hidden"
                >
                  {jobs.map(job => (
                    <button
                      key={job.jobId}
                      onClick={() => {
                        setSelectedJobId(job.jobId)
                        fetchCandidates(job.jobId)
                        setIsJobsMenuOpen(false)
                      }}
                      className={`w-full px-5 py-3 text-left transition-all flex items-center justify-between
                        ${selectedJobId === job.jobId 
                          ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                      <span className="font-bold text-sm tracking-tight">{job.title}</span>
                      {selectedJobId === job.jobId && <Check size={14} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Version */}
          <div className="hidden md:block space-y-3">
            {jobs.map(job => (
              <JobSidebarItem 
                key={job.jobId}
                job={job}
                isSelected={selectedJobId === job.jobId}
                onClick={() => {
                  setSelectedJobId(job.jobId)
                  fetchCandidates(job.jobId)
                }}
                onDelete={(id) => setJobToDelete(id)}
              />
            ))}
          </div>
        </div>

        {/* Main Content - Candidate List */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('recruitment.rankings')}
            </h2>
            <div className="flex flex-wrap items-center bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm self-start gap-1">
              <input 
                type="text" 
                placeholder={t('recruitment.search_candidates')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/50 dark:bg-slate-900/50 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border-none focus:ring-2 ring-amber-500/20 transition-all w-32 sm:w-48 text-slate-900 dark:text-white"
              />
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />
              <Button 
                variant={!showTopOnly ? 'primary' : 'ghost'}
                className="px-3 py-2 text-[10px] font-black uppercase tracking-widest"
                onClick={() => setShowTopOnly(false)}
              >
                {t('recruitment.all_candidates')} ({candidates.length})
              </Button>
              <Button 
                variant={showTopOnly ? 'primary' : 'ghost'}
                className="px-3 py-2 text-[10px] font-black uppercase tracking-widest"
                onClick={() => setShowTopOnly(true)}
              >
                {t('recruitment.top_matches')}
              </Button>
            </div>
          </div>

          {selectedJobId && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center flex-wrap gap-3 bg-amber-50 dark:bg-amber-900/10 px-4 py-3 rounded-2xl border border-amber-100/50 dark:border-amber-800/50 mb-8"
            >
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
                <Share2 size={16} className="text-amber-500" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-0.5 ml-1">{t('recruitment.share_link')}</p>
                <code 
                  onClick={() => copyToClipboard(`${window.location.origin}/apply/${selectedJobId}`)}
                  className="text-xs font-bold text-slate-600 dark:text-slate-300 break-all bg-white/50 dark:bg-slate-950/30 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 block cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-colors"
                  title="Click to copy"
                >
                  {`${window.location.origin}/apply/${selectedJobId}`}
                </code>
              </div>
              <Button 
                variant="primary" 
                className="py-3 px-6 text-[10px] min-w-0 cursor-pointer" 
                icon={Copy}
                onClick={() => copyToClipboard(`${window.location.origin}/apply/${selectedJobId}`)}
              >
                {t('recruitment.copy_link')}
              </Button>
            </motion.div>
          )}

          <div className="space-y-6">
            <AnimatePresence mode='wait'>
              {loading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  {[1, 2, 3].map((n) => (
                    <Card key={n} className="p-6">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <Skeleton className="h-6 w-1/3" />
                          <Skeleton className="h-4 w-1/4" />
                          <div className="flex gap-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-20" />
                          </div>
                          <Skeleton className="h-20 w-full rounded-2xl" />
                        </div>
                        <div className="flex flex-col items-center md:items-end gap-4 min-w-[140px] w-full md:w-auto">
                          <Skeleton className="w-full md:w-[140px] h-24 rounded-[2rem]" />
                          <div className="grid grid-cols-2 gap-3 w-full md:w-[140px]">
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </motion.div>
              ) : candidates.length === 0 ? (
                <Card className="text-center py-20 border-dashed">
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <UserCheck className="text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">{t('recruitment.no_candidates')}</h3>
                  <p className="text-sm text-slate-500 font-medium">{t('recruitment.no_candidates_desc')}</p>
                </Card>
              ) : (
                candidates
                  .sort((a, b) => (b.analysis?.score || 0) - (a.analysis?.score || 0))
                  .filter(c => 
                    c.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
                    c.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                    c.analysis.mismatchingSkills.some(s => s.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
                  )
                  .slice(0, showTopOnly ? (jobs.find(j => j.jobId === selectedJobId)?.targetCount || 5) : candidates.length)
                  .map((candidate, index) => (
                    <CandidateCard 
                      key={candidate._id}
                      candidate={candidate}
                      index={index}
                      onViewGitAnalysis={(id) => {
                        if (id) setSelectedGitAnalysis(id)
                        else toast.error('Analysis unavailable')
                      }}
                    />
                  ))
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      <AnimatePresence>
        {selectedGitAnalysis && (
          <div className="fixed inset-0 flex items-center justify-center p-0" style={{ zIndex: 9999 }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGitAnalysis(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            />
            
            <Card className="relative w-full h-full bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden z-[50] rounded-none border-none shadow-none">
              <div className="flex items-center justify-between p-5 md:p-8 border-b border-slate-100 dark:border-slate-800 shrink-0">
                  <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('recruitment.git_audit')}</h2>
                  <button 
                      onClick={() => setSelectedGitAnalysis(null)}
                      className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-red-500 transition-colors"
                  >
                      <X size={20} />
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-5 space-y-6">
                    <ScoreCard score={selectedGitAnalysis.analysis.score} summary={selectedGitAnalysis.analysis.summary} />
                    <MetadataCard metadata={selectedGitAnalysis.metadata} type={selectedGitAnalysis.type} />
                  </div>
                  <div className="lg:col-span-7">
                    <InsightsCard goodPoints={selectedGitAnalysis.analysis.goodPoints} badPoints={selectedGitAnalysis.analysis.badPoints} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
      )}
    </AnimatePresence>

      <ConfirmationModal 
        isOpen={!!jobToDelete}
        onClose={() => setJobToDelete(null)}
        onConfirm={() => handleDeleteJob(jobToDelete)}
        title="Delete Job Post?"
        message="Are you sure you want to delete this job? All associated candidates and analysis data will be lost forever. This action cannot be undone."
        confirmText="Delete Permanently"
        variant="danger"
      />
    </MainLayout>
  )
}

export default RecruiterDashboard
