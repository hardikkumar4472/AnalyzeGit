import React from 'react'
import { motion } from 'framer-motion'

const SkeletonDashboard = () => {
    return (
        <div className="px-6 pt-16 pointer-events-none">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-12 xl:col-span-8 space-y-8">
                    {/* Insights Skeleton */}
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-white/30 dark:bg-slate-900/40 p-10 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                                <div className="w-48 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {[1, 2, 3, 4, 5, 6].map((j) => (
                                    <div key={j} className="flex gap-3 items-start">
                                        <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800 mt-2 animate-pulse shrink-0" />
                                        <div className="space-y-2 w-full">
                                            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                                            <div className="w-2/3 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="lg:col-span-12 xl:col-span-4 space-y-8">
                    {/* ScoreCard Skeleton */}
                    <div className="bg-white dark:bg-slate-900/40 p-10 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl mb-8 animate-pulse" />
                        {/* New Glass Skeleton */}
                        <div className="relative w-36 h-52 border-4 border-slate-100 dark:border-slate-800 rounded-b-xl rounded-t-sm bg-slate-50 dark:bg-slate-900/40 mb-8 overflow-hidden">
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="w-16 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                                <div className="w-8 h-3 bg-slate-200 dark:bg-slate-800 rounded mt-2 animate-pulse" />
                            </div>
                            {/* Subtle pulse for the liquid area */}
                            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-slate-200/50 dark:bg-slate-800/30 animate-pulse" />
                        </div>
                        <div className="w-3/4 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg mb-4 animate-pulse" />
                        <div className="w-full space-y-2">
                            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                            <div className="w-1/2 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mx-auto" />
                        </div>
                    </div>

                    {/* Metadata Skeleton */}
                    <div className="bg-white/30 dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-[1.25rem] animate-pulse" />
                        <div className="flex-1 space-y-3">
                            <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                            <div className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                        </div>
                        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SkeletonDashboard
