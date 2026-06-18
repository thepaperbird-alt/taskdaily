'use client';

import { useDashboard, DashboardProvider } from './DashboardContext';
import { cn } from '@/lib/utils';
import React from 'react';
import { SidebarClose, List, Repeat } from 'lucide-react';

function CollapsedBar({
    label,
    onClick,
    side
}: {
    label: string;
    onClick: () => void;
    side: 'left' | 'right';
}) {
    return (
        <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <button
                onClick={onClick}
                className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors flex flex-col items-center gap-4 h-full w-full"
                title={`Expand ${label}`}
            >
                <SidebarClose 
                    size={18} 
                    className={cn(
                        "text-neutral-500 transition-transform duration-300",
                        side === 'left' ? "rotate-180" : ""
                    )} 
                />
                <div className="flex-1 flex items-center justify-center -mt-8">
                    <span 
                        className="text-xs font-semibold text-neutral-400 uppercase tracking-widest whitespace-nowrap" 
                        style={{ transform: 'rotate(-90deg)' }}
                    >
                        {label}
                    </span>
                </div>
            </button>
        </div>
    );
}

function DashboardGrid({
    tasks,
    dailies,
    routines
}: {
    tasks: React.ReactNode;
    dailies: React.ReactNode;
    routines: React.ReactNode;
}) {
    const { isJournalCollapsed, isRoutineCollapsed, toggleJournal, toggleRoutine } = useDashboard();

    return (
        <div className="hidden md:flex h-full w-full max-w-[1600px] mx-auto p-6 gap-6 transition-all duration-300 min-h-0">
            {/* Left Column: Journal / Tasks */}
            <div className={cn(
                "h-full overflow-hidden bg-transparent transition-all duration-300 shrink-0",
                isJournalCollapsed ? "w-12" : "w-[25%]"
            )}>
                {isJournalCollapsed ? (
                    <CollapsedBar label="Tasks" onClick={toggleJournal} side="left" />
                ) : (
                    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50 shrink-0">
                            <h2 className="text-sm font-bold bg-gradient-to-r from-neutral-800 to-neutral-600 dark:from-neutral-100 dark:to-neutral-400 bg-clip-text text-transparent flex items-center gap-2">
                                <List size={16} className="text-neutral-500" />
                                Tasks
                            </h2>
                            <button
                                onClick={toggleJournal}
                                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 transition-colors"
                                title="Collapse Tasks"
                            >
                                <SidebarClose size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden p-4">
                            {tasks}
                        </div>
                    </div>
                )}
            </div>

            {/* Middle Column: Daily Notes */}
            <div className="h-full overflow-hidden bg-transparent transition-all duration-300 flex-1 min-w-0">
                {dailies}
            </div>

            {/* Right Column: Routines */}
            <div className={cn(
                "h-full overflow-hidden bg-transparent transition-all duration-300 shrink-0",
                isRoutineCollapsed ? "w-12" : "w-[30%]"
            )}>
                {isRoutineCollapsed ? (
                    <CollapsedBar label="Routine" onClick={toggleRoutine} side="right" />
                ) : (
                    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50 shrink-0">
                            <button
                                onClick={toggleRoutine}
                                className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 transition-colors"
                                title="Collapse Routine"
                            >
                                <SidebarClose size={16} className="transform rotate-180" />
                            </button>
                            <h2 className="text-sm font-bold bg-gradient-to-r from-neutral-800 to-neutral-600 dark:from-neutral-100 dark:to-neutral-400 bg-clip-text text-transparent flex items-center gap-2">
                                <Repeat size={16} className="text-neutral-500" />
                                Routine
                            </h2>
                            <div className="w-8" />
                        </div>
                        <div className="flex-1 overflow-hidden p-4">
                            {routines}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function DashboardLayout({
    tasks,
    dailies,
    routines
}: {
    tasks: React.ReactNode;
    dailies: React.ReactNode;
    routines: React.ReactNode;
}) {
    return (
        <DashboardProvider>
            <DashboardGrid tasks={tasks} dailies={dailies} routines={routines} />
        </DashboardProvider>
    );
}
