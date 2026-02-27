import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    isToday,
    getDay
} from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface MiniCalendarProps {
    selectedDate: Date;
    onClose?: () => void;
}

export default function MiniCalendar({ selectedDate, onClose }: MiniCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(selectedDate);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const startDayOfWeek = getDay(monthStart);

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    return (
        <div className="w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg p-3 z-50">
            <div className="flex justify-between items-center mb-3">
                <button onClick={prevMonth} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-500">
                    <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {format(currentMonth, 'MMMM yyyy')}
                </span>
                <button onClick={nextMonth} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-500">
                    <ChevronRight size={16} />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-xs font-medium text-neutral-400">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-8" />
                ))}
                {days.map(day => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentToday = isToday(day);

                    return (
                        <Link
                            key={day.toISOString()}
                            href={`/?date=${format(day, 'yyyy-MM-dd')}`}
                            onClick={() => {
                                if (onClose) onClose();
                            }}
                            className={cn(
                                "h-8 flex items-center justify-center text-sm rounded-md transition-colors",
                                isSelected
                                    ? "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900 font-medium"
                                    : isCurrentToday
                                        ? "text-neutral-900 dark:text-white font-bold bg-neutral-100 dark:bg-neutral-800"
                                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            )}
                        >
                            {format(day, 'd')}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
