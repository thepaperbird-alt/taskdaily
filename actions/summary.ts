'use server';

import { createClient } from '@/lib/supabase/server';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { openai } from '@/lib/openai';
import { revalidatePath } from 'next/cache';

export async function getSummaryMetrics(date: Date, filterTags: string[] = []) {
    const supabase = await createClient();
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { tasksCreated: 0, tasksCompleted: 0, tasksRemaining: 0, dailyEntries: 0, productivity: 0 };

    // 1. Fetch Tasks
    let tasksQuery = supabase
        .from('td_tasks')
        .select('id, completed, td_task_tags!inner(tag_id)')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

    if (filterTags.length > 0) {
        tasksQuery = tasksQuery.in('td_task_tags.tag_id', filterTags);
    } else {
        tasksQuery = supabase
            .from('td_tasks')
            .select('id, completed, td_task_tags(tag_id)')
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString());
    }

    const { data: tasksData } = await tasksQuery;

    const tasksCreated = tasksData?.length || 0;
    const tasksCompleted = tasksData?.filter((t: any) => t.completed).length || 0;
    const tasksRemaining = tasksCreated - tasksCompleted;

    // 2. Counts for Dailies
    let dailiesQuery = supabase
        .from('td_dailies')
        .select('id, td_daily_tags!inner(tag_id)')
        .gte('entry_date', format(start, 'yyyy-MM-dd'))
        .lte('entry_date', format(end, 'yyyy-MM-dd'));

    if (filterTags.length > 0) {
        dailiesQuery = dailiesQuery.in('td_daily_tags.tag_id', filterTags);
    } else {
        dailiesQuery = supabase
            .from('td_dailies')
            .select('id, td_daily_tags(tag_id)')
            .gte('entry_date', format(start, 'yyyy-MM-dd'))
            .lte('entry_date', format(end, 'yyyy-MM-dd'));
    }

    const { data: dailiesData } = await dailiesQuery;
    const dailyEntries = dailiesData?.length || 0;

    // 3. Productivity Score
    const productivity = tasksCreated > 0 ? Math.round((tasksCompleted / tasksCreated) * 100) : 0;

    return {
        tasksCreated,
        tasksCompleted,
        tasksRemaining,
        dailyEntries,
        productivity
    };
}
