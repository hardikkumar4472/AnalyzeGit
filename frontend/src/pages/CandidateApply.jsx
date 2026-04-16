import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, FileText, CheckCircle2, AlertCircle, Globe, Check } from 'lucide-react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { API_BASE_URL } from '../config'
import MainLayout from '../components/templates/MainLayout'
import Card from '../components/atoms/Card'
import Button from '../components/atoms/Button'
import MarkdownContent from '../components/atoms/MarkdownContent'
import Badge from '../components/atoms/Badge'
import FormField from '../components/molecules/FormField'

const CandidateApply = () => {
  const { t } = useTranslation()
  const { jobId } = useParams()
  const [job, setJob] = useState(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('idle') 
  const [result, setResult] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    githubUrl: ''
  })

  useEffect(() => {
    const appliedJobs = JSON.parse(localStorage.getItem('applied_jobs') || '[]')
    if (appliedJobs.includes(jobId)) {
      setStatus('already_applied')
    }

    const fetchJob = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/jobs/${jobId}`)
        setJob(response.data)
      } catch (error) {
        toast.error('Job not found or invalid link')
      }
    }
    fetchJob()
  }, [jobId])

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected && selected.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }
    setFile(selected)
  }

  const handleUpload = async () => {
    if (!file || !formData.name.trim() || !formData.email.trim() || !formData.githubUrl.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }
    setLoading(true)
    setStatus('uploading')
    
    const data = new FormData()
    data.append('resume', file)
    data.append('jobId', jobId)
    data.append('name', formData.name)
    data.append('email', formData.email)
    data.append('githubUrl', formData.githubUrl)

    try {
      setStatus('analyzing')
      const response = await axios.post(`${API_BASE_URL}/candidates/apply`, data)
      setResult(response.data.candidate)
      
      const appliedJobs = JSON.parse(localStorage.getItem('applied_jobs') || '[]')
      if (!appliedJobs.includes(jobId)) {
        appliedJobs.push(jobId)
        localStorage.setItem('applied_jobs', JSON.stringify(appliedJobs))
      }
      
      setStatus('completed')
      toast.success('Your resume has been analyzed!')
    } catch (error) {
      setStatus('idle')
      toast.error(error.response?.data?.error || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  if (!job) return (
    <MainLayout className="flex items-center justify-center">
      <div className="relative font-['Outfit'] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">
        {t('candidate_apply.fetching')}
      </div>
    </MainLayout>
  )

  if (status === 'already_applied') {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-12 px-6 text-center">
          <Card className="p-12 border-none">
            <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-glow">
              <AlertCircle className="w-12 h-12 text-amber-500" />
            </div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">Already Applied</h1>
            <p className="text-slate-500 mb-10 font-medium">You have already submitted an application for this specific job position from this device.</p>
          </Card>
        </div>
      </MainLayout>
    )
  }

  if (status === 'completed') {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-12 px-6 text-center">
          <Card className="p-12 border-none">
            <div className="w-24 h-24 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-glow">
              <Check className="w-12 h-12 text-amber-500" />
            </div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">{t('candidate_apply.applied_title')}</h1>
            <p className="text-slate-500 mb-10 font-medium">{t('candidate_apply.applied_desc')}</p>
          </Card>
        </div>
      </MainLayout>
    )
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-20 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-6" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 animate-pulse">{t('candidate_apply.processing')}</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto py-4 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-6 md:p-8">
            <div className="mb-6 text-center">
              <Badge variant="amber" className="mx-auto mb-2 text-[8px]">{t('candidate_apply.hiring_badge')}</Badge>
              <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white mb-1 leading-tight">{job.title}</h1>
              <MarkdownContent content={job.description} className="text-left px-4 md:px-10 opacity-70" />
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">{t('candidate_apply.full_name')} <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder=""
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-4 ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-sm text-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">{t('candidate_apply.email_address')} <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    placeholder="abc@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-4 ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-sm text-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">{t('candidate_apply.github_url')} <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="github.com/username"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({...formData, githubUrl: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-4 ring-amber-500/10 focus:border-amber-500 transition-all font-bold text-sm text-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div 
                className={`relative border-2 border-dashed rounded-2xl p-6 transition-all text-center cursor-pointer group
                  ${file ? 'border-amber-500 bg-amber-50/10' : 'border-slate-200 dark:border-slate-800 hover:border-amber-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'}`}
              >
                <input 
                  type="file" 
                  accept=".pdf,image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-20"
                  onChange={handleFileChange}
                />
                
                <div className="flex flex-col items-center">
                  <div className={`p-5 rounded-2xl mb-4 transition-all group-hover:scale-110 ${file ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    <Upload className="w-8 h-8" />
                  </div>
                  {file ? (
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{file.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-bold text-slate-900 dark:text-white">{t('candidate_apply.upload_resume')}</h4>
                      <p className="text-xs text-slate-500 font-medium">{t('candidate_apply.upload_desc')}</p>
                    </>
                  )}
                </div>
              </div>

              <Button 
                onClick={handleUpload}
                disabled={!file || !formData.name.trim() || !formData.email.trim() || !formData.githubUrl.trim() || loading}
                className="w-full py-5 text-lg"
                icon={FileText}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {status === 'uploading' ? t('candidate_apply.syncing') : t('candidate_apply.analyzing')}
                  </div>
                ) : t('candidate_apply.submit')}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  )
}

export default CandidateApply
