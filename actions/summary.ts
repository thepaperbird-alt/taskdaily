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

export async function generateWeeklySummary(date: Date) {
    const supabase = await createClient();
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    const weekStartStr = format(start, 'yyyy-MM-dd');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Fetch Data
    const { data: dailies } = await supabase
        .from('td_dailies')
        .select('entry_date, content, tasks:td_tasks(title, completed)')
        .gte('entry_date', weekStartStr)
        .lte('entry_date', format(end, 'yyyy-MM-dd'));

    const { data: tasks } = await supabase
        .from('td_tasks')
        .select('title, completed, source, created_at, td_task_tags(tag:td_tags(name))')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

    // Construct Prompt
    const prompt = `
    Analyze the following weekly data for a user and provide a reflective summary.
    
    Week: ${weekStartStr} to ${format(end, 'yyyy-MM-dd')}
    
    Daily Entries:
    ${dailies?.map((d: any) => `- ${d.entry_date}: ${d.content.substring(0, 100)}... (${d.tasks.length} tasks)`).join('\n')}
    
    Tasks Created:
    ${tasks?.map((t: any) => `- [${t.completed ? 'x' : ' '}] ${t.title} (${t.source}) Tags: ${t.td_task_tags.map((tt: any) => tt.tag?.name).join(', ')}`).join('\n')}
    
    Please provide:
    1. A 150-200 word reflectve weekly summary.
    2. 5 bullet highlights.
    3. Productivity score (0-100) based on completion rate and effort.
    4. Observed dominant themes.
    
    Format as Markdown.
    `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });

        const summaryText = response.choices[0].message.content || "Failed to generate summary.";

        // Store in DB
        const { data: existing } = await supabase
            .from('td_weekly_summaries')
            .select('id')
            .eq('week_start', weekStartStr)
            .single();

        if (existing) {
            await supabase.from('td_weekly_summaries').update({
                summary_text: summaryText,
                generated_at: new Date().toISOString()
            }).eq('id', existing.id);
        } else {
            await supabase.from('td_weekly_summaries').insert({
                week_start: weekStartStr,
                summary_text: summaryText,
                user_id: user.id
            });
        }

        revalidatePath('/');
        return summaryText;
    } catch (error: any) {
        console.error("OpenAI Error Full Object:", JSON.stringify(error, null, 2));
        console.log("Debug Info:", {
            hasKey: !!process.env.OPENAI_API_KEY,
            keyLength: process.env.OPENAI_API_KEY?.length,
            model: "gpt-4o"
        });

        // Return the actual error message to the client
        throw new Error(error.message || "Failed to generate AI summary.");
    }
}
