'use client';

import { useDashboard } from './DashboardContext';
import { SidebarClose, Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isToday,
    getDay,
} from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarColumnClient({ daysWithTasks }: { daysWithTasks: string[] }) {
    const { isCalendarCollapsed, toggleCalendar } = useDashboard();

    const [currentMonth, setCurrentMonth] = useState(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = getDay(monthStart);

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    if (isCalendarCollapsed) {
        return (
            <div className="h-full flex flex-col border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-all">
                <button
                    onClick={toggleCalendar}
                    className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex flex-col items-center gap-4 h-full"
                    title="Expand Calendar"
                >
                    <SidebarClose size={20} className="text-neutral-500 transform rotate-180" />
                    <div className="flex-1 flex items-center justify-center -mt-8">
                        <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest whitespace-nowrap" style={{ transform: 'rotate(-90deg)' }}>Calendar</span>
                    </div>
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50 shrink-0">
                <button
                    onClick={toggleCalendar}
                    className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 transition-colors hidden md:block"
                    title="Collapse Calendar"
                >
                    <SidebarClose size={20} />
                </button>
                <h2 className="text-xl font-bold bg-gradient-to-r from-neutral-800 to-neutral-600 dark:from-neutral-100 dark:to-neutral-400 bg-clip-text text-transparent flex items-center gap-2">
                    <CalendarIcon size={20} className="text-neutral-500" />
                    Calendar
                </h2>
                <div className="w-9 hidden md:block" />
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm p-4 w-full">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={prevMonth} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md text-neutral-500 transition-colors">
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                            {format(currentMonth, 'MMMM yyyy')}
                        </span>
                        <button onClick={nextMonth} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md text-neutral-500 transition-colors">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 md:gap-2 text-center mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <div key={day} className="text-xs font-semibold text-neutral-400 uppercase tracking-widest py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 md:gap-2">
                        {Array.from({ length: startDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square" />
                        ))}
                        {days.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const hasTasks = daysWithTasks.includes(dateStr);
                            const isCurrentToday = isToday(day);

                            return (
                                <Link
                                    key={day.toISOString()}
                                    href={`/?date=${dateStr}&tab=dailies`}
                                    className={cn(
                                        "aspect-square flex flex-col items-center justify-center text-sm rounded-lg transition-all relative border border-transparent",
                                        isCurrentToday
                                            ? "border-neutral-300 dark:border-neutral-600 font-bold bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                                            : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700 font-medium"
                                    )}
                                >
                                    <span>{format(day, 'd')}</span>
                                    {hasTasks && (
                                        <div className="absolute bottom-1 md:bottom-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
