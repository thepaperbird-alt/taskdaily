import { startOfWeek, subWeeks, addWeeks, format, eachDayOfInterval, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getDailiesForWeek } from '@/actions/dailies';
import { getTags } from '@/actions/tags';
import DailyEntry from './DailyEntry';

export default async function DailyColumn({ dateStr, filterTags }: { dateStr?: string; filterTags?: string[] }) {
    const currentDate = dateStr ? new Date(dateStr) : new Date();

    // Calculate week range
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    // Navigation links
    const prevWeek = format(subWeeks(currentDate, 1), 'yyyy-MM-dd');
    const nextWeek = format(addWeeks(currentDate, 1), 'yyyy-MM-dd');

    // Fetch data
    const dailies = await getDailiesForWeek(currentDate, filterTags);
    const allTags = await getTags(); // Fetch for autocomplete

    // Map dailies to dates
    const dailiesMap = new Map();
    dailies?.forEach((d: any) => dailiesMap.set(d.entry_date, d));

    return (
        <div className="h-full flex flex-col">
            <div className="mb-4 flex justify-between items-center px-1">
                <h2 className="text-xl font-bold bg-gradient-to-r from-neutral-800 to-neutral-600 dark:from-neutral-100 dark:to-neutral-400 bg-clip-text text-transparent">Dailies</h2>
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <Link href={`/?week=${prevWeek}`} className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">
                        <ChevronLeft size={16} />
                    </Link>
                    <span className="text-xs font-medium">Week of {format(start, 'MMM d')}</span>
                    <Link href={`/?week=${nextWeek}`} className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">
                        <ChevronRight size={16} />
                    </Link>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col gap-3 pb-4">
                {days.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const daily = dailiesMap.get(dateKey);
                    return (
                        <DailyEntry key={dateKey} date={day} daily={daily} allTags={allTags} />
                    );
                })}
            </div>
        </div>
    );
}
