'use server';

import { createClient } from '@/lib/supabase/server';

export async function getDaysWithTasks(): Promise<string[]> {
    const supabase = await createClient();

    // We want entry_dates from dailies that have at least one associated task
    const { data, error } = await supabase
        .from('td_dailies')
        .select(`
            entry_date,
            td_tasks (
                id
            )
        `);

    if (error) {
        console.error('Error fetching days with tasks:', error);
        return [];
    }

    // Filter dailies that actually have tasks and map to entry_date
    const dates = data
        .filter((daily: any) => daily.td_tasks && daily.td_tasks.length > 0)
        .map((daily: any) => daily.entry_date);

    return Array.from(new Set(dates));
}
