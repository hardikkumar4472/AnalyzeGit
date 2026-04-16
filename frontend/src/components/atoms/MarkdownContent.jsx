import React from 'react'
import ReactMarkdown from 'react-markdown'

const MarkdownContent = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-black mb-4 mt-8 first:mt-0 text-slate-800 dark:text-white" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-black mb-3 mt-6 text-slate-800 dark:text-white" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-black mb-2 mt-4 text-slate-800 dark:text-white" {...props} />,
          p: ({ node, ...props }) => <p className="mb-4 last:mb-0 text-slate-600 dark:text-slate-400 leading-relaxed font-medium" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-600 dark:text-slate-400 font-medium" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-slate-600 dark:text-slate-400 font-medium" {...props} />,
          li: ({ node, ...props }) => <li className="pl-1" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
          code: ({ node, ...props }) => (
            <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400 font-mono text-sm" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-amber-500 pl-4 py-1 my-4 italic text-slate-500 dark:text-slate-400 bg-amber-50/30 dark:bg-amber-900/10 rounded-r-lg" {...props} />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownContent
