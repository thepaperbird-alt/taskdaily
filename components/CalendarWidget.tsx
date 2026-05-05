'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, ChevronDown, CalendarDays } from 'lucide-react';
import { getAppleCalendarEvents, CalendarEvent } from '@/actions/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function CalendarWidget() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const data = await getAppleCalendarEvents();
                setEvents(data);
            } catch (error) {
                console.error('Failed to fetch calendar events:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchEvents();
        const interval = setInterval(fetchEvents, 5 * 60 * 1000); // 5 mins
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (loading && events.length === 0) {
        return <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />;
    }

    if (events.length === 0) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border transition-all duration-300",
                    isOpen 
                        ? "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800 shadow-sm" 
                        : "bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border-neutral-200/50 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                )}
            >
                <div className="relative">
                    <Calendar size={18} className={cn(
                        "transition-colors duration-300",
                        isOpen ? "text-cyan-600 dark:text-cyan-400" : "text-neutral-500 dark:text-neutral-400"
                    )} />
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[9px] font-bold text-white shadow-sm">
                        {events.length}
                    </span>
                </div>
                <div className="hidden lg:flex flex-col items-start leading-none">
                    <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider mb-0.5",
                        isOpen ? "text-cyan-700 dark:text-cyan-300" : "text-neutral-400 dark:text-neutral-500"
                    )}>
                        Events
                    </span>
                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[100px]">
                        {events[0].title}
                    </span>
                </div>
                <ChevronDown size={14} className={cn(
                    "text-neutral-400 transition-transform duration-300",
                    isOpen && "rotate-180 text-cyan-500"
                )} />
            </button>

            {/* Dropdown Popover */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl shadow-neutral-200/50 dark:shadow-black/50 z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/30">
                        <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                            <CalendarDays size={16} className="text-cyan-500" />
                            Today&apos;s Schedule
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 uppercase">
                            {events.length} Events
                        </span>
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-none">
                        {events.map((event, index) => {
                            const [sh, sm] = event.start.split(':').map(Number);
                            const [eh, em] = event.end.split(':').map(Number);
                            
                            const formatTime = (h: number, m: number) => {
                                const ampm = h >= 12 ? 'PM' : 'AM';
                                const h12 = h % 12 || 12;
                                const mStr = m.toString().padStart(2, '0');
                                return `${h12}:${mStr} ${ampm}`;
                            };
                            
                            return (
                                <div 
                                    key={index}
                                    className="group p-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-default"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 flex flex-col items-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                                            {index !== events.length - 1 && (
                                                <div className="w-px h-10 bg-neutral-200 dark:bg-neutral-700 mt-1" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                                {event.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                                                <Clock size={10} />
                                                {formatTime(sh, sm)} - {formatTime(eh, em)}
                                                {event.calendar && (
                                                    <span className="opacity-50 text-[9px] px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 ml-1">
                                                        {event.calendar}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="p-3 bg-neutral-50/50 dark:bg-neutral-800/30 border-t border-neutral-100 dark:border-neutral-800">
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="w-full py-2 text-[11px] font-bold text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 uppercase tracking-widest transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
