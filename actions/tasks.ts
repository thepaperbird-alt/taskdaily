'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';
import { extractHashtags } from '@/lib/hashtags';
import { ensureTagsExist } from './tags';

export async function getTasks(filterTags: string[] = []) {
    const supabase = await createClient();

    let query = supabase
        .from('td_tasks')
        .select(`
      *,
      td_task_tags!inner (
        tag:td_tags (*)
      )
    `)
        .order('created_at', { ascending: false });

    if (filterTags.length > 0) {
        query = query.in('td_task_tags.tag_id', filterTags);
    } else {
        query = supabase
            .from('td_tasks')
            .select(`
          *,
          td_task_tags (
            tag:td_tags (*)
          )
        `)
            .order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }

    let tasks = data.map((task: any) => ({
        ...task,
        tags: task.td_task_tags.map((tt: any) => tt.tag),
    }));

    if (filterTags.length > 1) {
        tasks = tasks.filter((t: any) =>
            filterTags.every(ft => t.tags.some((tag: any) => tag.id === ft))
        );
    }

    return tasks;
}

export async function addTask(formData: FormData) {
    const supabase = await createClient();
    const title = formData.get('title') as string;
    if (!title) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // 1. Find or create today's daily
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let dailyId = null;

    const { data: existingDaily } = await supabase
        .from('td_dailies')
        .select('id')
        .eq('entry_date', todayStr)
        .eq('user_id', user.id)
        .single();

    if (existingDaily) {
        dailyId = existingDaily.id;
    } else {
        const { data: newDaily } = await supabase
            .from('td_dailies')
            .insert({ user_id: user.id, entry_date: todayStr })
            .select('id')
            .single();
        if (newDaily) dailyId = newDaily.id;
    }

    // 2. Create Task linked to daily
    const { data: task, error } = await supabase.from('td_tasks').insert({
        title,
        source: 'manual',
        user_id: user.id,
        daily_id: dailyId // Link to daily!
    }).select().single();

    if (error) {
        console.error('Error adding task:', error);
        throw new Error('Failed to add task');
    }

    // 3. Handle Hashtags
    const hashtags = extractHashtags(title);
    if (hashtags.length > 0) {
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

export async function toggleTask(id: string, completed: boolean) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('td_tasks')
        .update({ completed })
        .eq('id', id);

    if (error) {
        console.error('Error toggling task:', error);
        throw new Error('Failed to toggle task');
    }

    revalidatePath('/');
}

export async function deleteTask(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('td_tasks').delete().eq('id', id);

    if (error) {
        console.error('Error deleting task:', error);
        throw new Error('Failed to delete task');
    }

    revalidatePath('/');
}
