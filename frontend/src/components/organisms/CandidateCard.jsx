import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, FileText, Globe, AlertTriangle } from 'lucide-react'
import Card from '../atoms/Card'
import Badge from '../atoms/Badge'
import Button from '../atoms/Button'

const CandidateCard = ({ 
  candidate, 
  index, 
  onViewResume, 
  onViewGitAnalysis 
}) => {
  return (
    <Card 
      interactive 
      delay={index * 0.05}
      className="p-6"
    >
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {index < 3 && (
              <Badge variant="amber" icon={Trophy}>
                Top {index + 1}
              </Badge>
            )}
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{candidate.name}</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4 font-medium">{candidate.email}</p>
          
          {candidate.analysis.mismatchingSkills && candidate.analysis.mismatchingSkills.length > 0 && (
            <div className="mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Missing JD Skills</span>
              <div className="flex flex-wrap gap-2">
                {candidate.analysis.mismatchingSkills.map(skill => (
                  <Badge key={skill} variant="red" icon={AlertTriangle}>
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl">
            <p className="text-xs text-slate-600 dark:text-slate-400 italic font-medium">"{candidate.analysis.summary}"</p>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-4 min-w-[140px] w-full md:w-auto">
          <div className="text-center w-full p-4 md:p-6 rounded-2xl bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm shadow-sm hover:shadow-glow transition-all">
            <span className="block text-[10px] font-black uppercase text-amber-500 mb-1 tracking-widest">Match Score</span>
            <span className="text-3xl md:text-4xl font-black text-amber-600">{(candidate.analysis.score * 10).toFixed(0)}%</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button 
              variant="secondary"
              className="py-4"
              icon={FileText}
              onClick={() => window.open(candidate.resumeUrl, '_blank')}
            />
            {candidate.githubUrl && (
              <Button 
                variant="primary"
                icon={Globe}
                className="bg-slate-900 hover:bg-slate-800 py-4"
                onClick={() => onViewGitAnalysis(candidate.gitAnalysisId)}
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default CandidateCard
