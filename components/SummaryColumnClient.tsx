'use client';

import { ChevronRight, PanelRightClose, PanelRightOpen, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import TagFilterBar from './TagFilterBar';
import SummaryAI from './SummaryAI';
import { useDashboard } from './DashboardContext';

export default function SummaryColumnClient({ metrics, tags, summaryData, currentDate }: any) {
    const { isSummaryCollapsed, toggleSummary } = useDashboard();

    if (isSummaryCollapsed) {
        return (
            <div className="h-full py-4 flex flex-col items-center border-l dark:border-neutral-800 w-full transition-all duration-300">
                <button
                    onClick={toggleSummary}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md text-neutral-400 hover:text-neutral-600 transition-colors"
                    title="Expand Summary"
                >
                    <PanelRightOpen size={20} />
                </button>
                <div className="mt-8 flex-1 w-full flex flex-col items-center gap-4">
                    <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest whitespace-nowrap" style={{ transform: 'rotate(-90deg)' }}>Summary</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col transition-all duration-300 relative group w-full">
            <button
                onClick={toggleSummary}
                className="absolute -left-3 top-4 p-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full text-neutral-400 hover:text-neutral-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Collapse Summary"
            >
                <ChevronsRight size={14} />
            </button>

            <div className="mb-4 flex justify-between items-center px-1 pl-4">
                <h2 className="text-xl font-bold bg-gradient-to-r from-neutral-800 to-neutral-600 dark:from-neutral-100 dark:to-neutral-400 bg-clip-text text-transparent">Summary</h2>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-500">Weekly</span>
                    <button
                        onClick={toggleSummary}
                        className="md:hidden text-neutral-400"
                    >
                        <PanelRightClose size={16} />
                    </button>
                </div>
            </div>

            <TagFilterBar tags={tags} />

            <div className="space-y-4 pr-2 overflow-y-auto pb-20 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
                <div className="card">
                    <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">Tasks Created & Progress</h3>
                    <div className="flex justify-between items-end mb-2">
                        <div className="text-3xl font-bold tracking-tighter">{metrics.productivity}%</div>
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Productivity Score</div>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mb-4">
                        <div className="bg-neutral-900 dark:bg-white h-full transition-all duration-500" style={{ width: `${metrics.productivity}%` }}></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{metrics.tasksCompleted}</div>
                            <div className="text-[10px] text-neutral-400">Completed</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{metrics.tasksRemaining}</div>
                            <div className="text-[10px] text-neutral-400">Remaining</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{metrics.tasksCreated}</div>
                            <div className="text-[10px] text-neutral-400">Created</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{metrics.dailyEntries}</div>
                            <div className="text-[10px] text-neutral-400">Daily Entries</div>
                        </div>
                    </div>
                </div>

                <SummaryAI date={currentDate} initialSummary={summaryData?.summary_text} />
            </div>
        </div>
    );
}
