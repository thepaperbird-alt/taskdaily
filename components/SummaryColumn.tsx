import { getSummaryMetrics } from '@/actions/summary';
import { getTags } from '@/actions/tags';
import { createClient } from '@/lib/supabase/server';
import { startOfWeek, format } from 'date-fns';
import SummaryColumnClient from './SummaryColumnClient';

export default async function SummaryColumn({ dateStr, filterTags }: { dateStr?: string; filterTags?: string[] }) {
    const supabase = await createClient(); // Use helper
    const currentDate = dateStr ? new Date(dateStr) : new Date();
    const metrics = await getSummaryMetrics(currentDate, filterTags);
    const tags = await getTags();

    // Fetch existing summary
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekStartStr = format(start, 'yyyy-MM-dd');

    const { data: summaryData } = await supabase
        .from('td_weekly_summaries')
        .select('summary_text')
        .eq('week_start', weekStartStr)
        .single();

    return (
        <SummaryColumnClient
            metrics={metrics}
            tags={tags}
            summaryData={summaryData}
            currentDate={currentDate}
        />
    );
}
