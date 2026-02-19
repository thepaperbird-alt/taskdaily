'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteTag(tagId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Delete tag (cascade should handle relations if set up, otherwise manually delete relations)
    // Assuming cascade or we just delete the tag.
    const { error } = await supabase.from('td_tags').delete().eq('id', tagId);

    if (error) {
        console.error("Failed to delete tag", error);
        throw new Error("Failed to delete tag");
    }

    revalidatePath('/');
}

export async function getParagraphsByTag(tagName: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // 1. Search Dailies
    // We want dailies that contain the hashtag.
    // We can use ILIKE on content.
    const { data: dailies } = await supabase
        .from('td_dailies')
        .select('entry_date, content')
        .ilike('content', `%#${tagName}%`)
        .order('entry_date', { ascending: false });

    // 2. Search Tasks
    const { data: tasks } = await supabase
        .from('td_tasks')
        .select('title, created_at, source, daily_id')
        .ilike('title', `%#${tagName}%`)
        .order('created_at', { ascending: false });

    // Process Dailies to extract specific paragraphs
    const paragraphs: { date: string, text: string, type: 'daily' | 'task', id: string }[] = [];

    dailies?.forEach((daily: any) => {
        const lines = daily.content.split('\n');
        lines.forEach((line: string) => {
            if (line.toLowerCase().includes(`#${tagName.toLowerCase()}`)) {
                paragraphs.push({
                    date: daily.entry_date,
                    text: line.trim(),
                    type: 'daily',
                    id: `${daily.entry_date}-${line.substring(0, 10)}`
                });
            }
        });
    });

    tasks?.forEach((task: any) => {
        paragraphs.push({
            date: task.created_at,
            text: task.title,
            type: 'task',
            id: task.id || `task-${task.created_at}`
        });
    });

    // Sort by date desc
    return paragraphs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
