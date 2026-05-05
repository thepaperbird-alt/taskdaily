'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { getAppleCalendarEvents, CalendarEvent } from '@/actions/calendar';
import { format } from 'date-fns';

export default function AppleCalendarEvents() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

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
        
        // Refresh every 10 minutes
        const interval = setInterval(fetchEvents, 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="mb-8 animate-pulse">
                <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-md mb-4"></div>
                <div className="space-y-3">
                    <div className="h-16 bg-neutral-100 dark:bg-neutral-900 rounded-xl"></div>
                    <div className="h-16 bg-neutral-100 dark:bg-neutral-900 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (events.length === 0) return null;

    return (
        <div className="mb-8">
            <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2 px-1">
                <Calendar size={14} />
                Apple Calendar Events
            </h3>
            <div className="grid gap-3">
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
                            className="group relative overflow-hidden bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-800/50 rounded-2xl p-4 transition-all hover:shadow-lg hover:shadow-cyan-500/5 hover:border-cyan-500/30 dark:hover:border-cyan-500/30"
                        >
                            <div className="flex items-start justify-between gap-4 relative z-10">
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                        {event.title}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-1">
                                            <Clock size={10} />
                                            {formatTime(sh, sm)} - {formatTime(eh, em)}
                                        </div>
                                        {event.calendar && (
                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[9px]">
                                                {event.calendar}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight size={14} className="text-neutral-300 dark:text-neutral-700 mt-1 group-hover:text-cyan-500 transition-colors" />
                            </div>
                            
                            {/* Decorative accent */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
