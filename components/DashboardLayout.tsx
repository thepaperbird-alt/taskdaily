'use client';

import { useDashboard, DashboardProvider } from './DashboardContext';
import { cn } from '@/lib/utils';
import React from 'react';

function DashboardGrid({
    tasks,
    dailies,
    summary
}: {
    tasks: React.ReactNode;
    dailies: React.ReactNode;
    summary: React.ReactNode;
}) {
    const { isSummaryCollapsed } = useDashboard();

    return (
        <div className="hidden md:flex h-full max-w-[1600px] mx-auto p-6 gap-6 transition-all duration-300">
            {/* Task Column - Fixed width % roughly similiar to col-span-3 (3/12 = 25%) */}
            <div className="w-[25%] h-full overflow-hidden bg-transparent shrink-0">
                {tasks}
            </div>

            {/* Daily Column - Expands if summary collapsed */}
            {/* Original: 4/12 = 33.3% */}
            {/* If collapsed: Needs to take available space. Summary is small. Tasks is 25%. Summary ~3rem. */}
            <div className={cn(
                "h-full overflow-hidden bg-transparent transition-all duration-300",
                isSummaryCollapsed ? "flex-1" : "w-[33.33%]"
            )}>
                {dailies}
            </div>

            {/* Summary Column - Collapsible */}
            {/* Original: 5/12 = 41.66% */}
            <div className={cn(
                "h-full overflow-hidden bg-transparent transition-all duration-300 shrink-0",
                isSummaryCollapsed ? "w-12" : "w-[41.66%]"
            )}>
                {summary}
            </div>
        </div>
    );
}

export default function DashboardLayout({
    children,
    tasks,
    dailies,
    summary
}: {
    children?: React.ReactNode; // For mobile or other wrappers if needed
    tasks: React.ReactNode;
    dailies: React.ReactNode;
    summary: React.ReactNode;
}) {
    return (
        <DashboardProvider>
            <DashboardGrid tasks={tasks} dailies={dailies} summary={summary} />
        </DashboardProvider>
    );
}
