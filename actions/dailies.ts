'use server';

import { createClient } from '@/lib/supabase/server';
import { Daily } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { extractHashtags } from '@/lib/hashtags';
import { ensureTagsExist } from './tags';

export async function getDailiesForWeek(date: Date, filterTags: string[] = []) {
    const supabase = await createClient();
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });

    let query = supabase
        .from('td_dailies')
        .select(`
      *,
      tasks:td_tasks (*),
      td_daily_tags!inner (
        tag:td_tags (*)
      )
    `)
        .gte('entry_date', format(start, 'yyyy-MM-dd'))
        .lte('entry_date', format(end, 'yyyy-MM-dd'))
        .order('entry_date', { ascending: true });

    if (filterTags.length > 0) {
        query = query.in('td_daily_tags.tag_id', filterTags);
    } else {
        query = supabase
            .from('td_dailies')
            .select(`
          *,
          tasks:td_tasks (*),
          td_daily_tags (
            tag:td_tags (*)
          )
        `)
            .gte('entry_date', format(start, 'yyyy-MM-dd'))
            .lte('entry_date', format(end, 'yyyy-MM-dd'))
            .order('entry_date', { ascending: true });
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching dailies:', error);
        return [];
    }

    // Map result
    let dailies = data.map((daily: any) => ({
        ...daily,
        tags: daily.td_daily_tags.map((dt: any) => dt.tag)
    }));

    if (filterTags.length > 1) {
        dailies = dailies.filter((d: any) =>
            filterTags.every(ft => d.tags.some((tag: any) => tag.id === ft))
        );
    }

    return dailies as Daily[];
}

export async function createOrUpdateDaily(date: string, content: string, id?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let targetId = id;

    if (id) {
        const { error } = await supabase
            .from('td_dailies')
            .update({ content })
            .eq('id', id);
        if (error) throw new Error('Failed to update daily');
    } else {
        const { data, error } = await supabase
            .from('td_dailies')
            .insert({ entry_date: date, content, user_id: user.id })
            .select('id')
            .single();
        if (error) throw new Error('Failed to create daily');
        targetId = data.id;
    }

    // Handle Hashtags in Content
    const hashtags = extractHashtags(content);
    if (hashtags.length > 0 && targetId) {
        const tags = await ensureTagsExist(hashtags);
        if (tags.length > 0) {
            // We need to avoid duplicates, but supabase insert usually fails on match if we don't handle it.
            // Or we specifically only insert new ones. 
            // For now, let's just try to insert and ignore error? 
            // Or correct way: fetch existing links first.

            // Simple approach: Delete all existing tags for this daily and re-add? No, manual tags might exist.
            // Construct logic to add only new ones?
            // Complex for now. Let's simplfy: We ADD extracted, we don't remove if removed from text (user might manually add).

            const tagLinks = tags.map(t => ({
                daily_id: targetId,
                tag_id: t.id
            }));

            // upsert/insert with ignore?
            const { error } = await supabase.from('td_daily_tags').upsert(tagLinks, { onConflict: 'daily_id, tag_id', ignoreDuplicates: true });
            if (error) console.error("Error linking tags to daily:", error);
        }
    }

    revalidatePath('/');
}

export async function addDailyTask(dailyId: string, title: string, date: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let targetDailyId = dailyId;

    if (!targetDailyId) {
        const { data } = await supabase.from('td_dailies').select('id').eq('entry_date', date).single();
        if (data) {
            targetDailyId = data.id;
        } else {
            const { data: newDaily, error } = await supabase
                .from('td_dailies')
                .insert({ entry_date: date, content: '', user_id: user.id })
                .select()
                .single();

            if (error) throw error;
            targetDailyId = newDaily.id;
        }
    }

    // Create Task
    const { data: task, error } = await supabase.from('td_tasks').insert({
        title,
        source: 'daily',
        daily_id: targetDailyId,
        user_id: user.id
    }).select().single();

    if (error) throw new Error('Failed to add daily task');

    // Handle Hashtags for Daily Task
    const hashtags = extractHashtags(title);
    if (hashtags.length > 0 && task) {
        const tags = await ensureTagsExist(hashtags);
        if (tags.length > 0) {
            const tagLinks = tags.map(t => ({
                task_id: task.id,
                tag_id: t.id
            }));
            await supabase.from('td_task_tags').insert(tagLinks);
        }
    }

    revalidatePath('/');
}
