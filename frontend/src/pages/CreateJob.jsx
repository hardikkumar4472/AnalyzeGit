import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector } from 'react-redux'
import { Briefcase, Save, Link as LinkIcon, Eye, Edit3, CheckCircle2, ExternalLink, Copy, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { API_BASE_URL } from '../config'
import MainLayout from '../components/templates/MainLayout'
import Header from '../components/organisms/Header'
import Card from '../components/atoms/Card'
import Button from '../components/atoms/Button'
import FormField from '../components/molecules/FormField'
import MarkdownContent from '../components/atoms/MarkdownContent'

const CreateJob = () => {
  const { t } = useTranslation()
  const { user } = useSelector((state) => state.auth)
  const [isPreview, setIsPreview] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    targetCount: 5
  })
  const [loading, setLoading] = useState(false)
  const [jobLink, setJobLink] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/jobs`, {
        ...formData,
        requirements: formData.requirements.split(',').map(s => s.trim())
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      })
      setJobLink(response.data.applyLink)
      toast.success('Job Created Successfully!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create job')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      requirements: '',
      targetCount: 5
    })
    setJobLink('')
    setIsPreview(false)
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {!jobLink ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-amber-500 rounded-2xl">
                    <Briefcase className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">{t('create_job.title')}</h1>
                    <p className="text-slate-500 text-sm font-medium">{t('create_job.subtitle')}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* ... form content ... */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField 
                      label={t('create_job.job_title_label')}
                      placeholder={t('create_job.job_title_placeholder')}
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                    <FormField 
                      label={t('create_job.target_matches_label')}
                      type="number"
                      min="1"
                      placeholder="5"
                      value={formData.targetCount}
                      onChange={(e) => setFormData({...formData, targetCount: parseInt(e.target.value)})}
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                        {t('create_job.description_label')}
                      </label>
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                        <button
                          type="button"
                          onClick={() => setIsPreview(false)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isPreview ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          <Edit3 size={12} /> {t('create_job.write')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPreview(true)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isPreview ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          <Eye size={12} /> {t('create_job.preview')}
                        </button>
                      </div>
                    </div>

                    {isPreview ? (
                      <div className="min-h-[200px] p-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-2 border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-y-auto max-h-[400px]">
                        <MarkdownContent content={formData.description || '*No description provided yet.*'} />
                      </div>
                    ) : (
                      <FormField 
                        label=""
                        isTextArea
                        placeholder="What will they be working on? (Supports Markdown)"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        required
                      />
                    )}
                  </div>

                  <FormField 
                    label="Specific Requirements (comma separated)"
                    placeholder="React, Node.js, AWS, TypeScript"
                    value={formData.requirements}
                    onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                    required
                  />

                  <Button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 text-lg"
                    icon={Save}
                  >
                    {loading ? t('create_job.publishing') : t('create_job.publish')}
                  </Button>
                </form>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <Card className="p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                  <CheckCircle2 size={200} />
                </div>

                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>

                <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">Job Live!</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg font-medium max-w-sm mx-auto">
                  Your job post is created and ready for candidates. Share this link to start receiving applications.
                </p>

                <div className="bg-slate-100/50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm mb-10">
                  <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-2"><LinkIcon size={12} /> Shareable Link</span>
                    <span className="text-emerald-500 flex items-center gap-1"><ExternalLink size={10} /> Public Link</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 bg-white/50 dark:bg-slate-900/50 px-5 py-4 rounded-xl text-sm font-mono text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800/50 break-all text-left">
                      {jobLink}
                    </div>
                    <Button 
                      variant="primary" 
                      className="px-6 min-w-0 h-auto" 
                      icon={Copy}
                      onClick={() => {
                        navigator.clipboard.writeText(jobLink)
                        toast.success('Link Copied to Clipboard!')
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/dashboard/recruiter" className="flex-1">
                    <Button variant="primary" className="w-full py-5 font-black uppercase tracking-widest text-[10px]" icon={ExternalLink}>
                      Manage Candidates
                    </Button>
                  </Link>
                  <Button variant="secondary" className="flex-1 py-5 font-black uppercase tracking-widest text-[10px]" icon={ArrowLeft} onClick={resetForm}>
                    Create Another
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  )
}

export default CreateJob
