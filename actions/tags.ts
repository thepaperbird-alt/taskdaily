'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getTags() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('td_tags')
        .select('*')
        .order('name');

    if (error) {
        console.error({ error });
        return [];
    }
    return data;
}

export async function createTag(name: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('td_tags')
        .insert({ name, user_id: user.id })
        .select()
        .single();

    if (error) {
        // Handle duplicate error gracefully if possible, or let it throw
        if (error.code === '23505') { // Unique violation
            const { data: existing } = await supabase.from('td_tags').select().eq('name', name).single();
            return existing;
        }
        console.error(error);
        throw new Error('Failed to create tag');
    }
    revalidatePath('/');
    return data;
}

export async function ensureTagsExist(tagNames: string[]) {
    if (!tagNames.length) return [];

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // 1. Find existing tags
    const { data: existingTags } = await supabase
        .from('td_tags')
        .select('id, name')
        .in('name', tagNames);

    const existingNames = new Set(existingTags?.map(t => t.name) || []);
    const newTags = tagNames.filter(name => !existingNames.has(name));

    // 2. Create missing tags
    let createdTags: any[] = [];
    if (newTags.length > 0) {
        const { data, error } = await supabase
            .from('td_tags')
            .insert(newTags.map(name => ({ name, user_id: user.id })))
            .select('id, name');

        if (data) createdTags = data;
        if (error) console.error("Error creating auto-tags:", error);
    }

    return [...(existingTags || []), ...createdTags];
}

export async function assignTagToTask(taskId: string, tagId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('td_task_tags')
        .insert({ task_id: taskId, tag_id: tagId });

    if (error) throw new Error('Failed to assign tag');
    revalidatePath('/');
}

export async function removeTagFromTask(taskId: string, tagId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('td_task_tags')
        .delete()
        .match({ task_id: taskId, tag_id: tagId });

    if (error) throw new Error('Failed to remove tag');
    revalidatePath('/');
}

export async function assignTagToDaily(dailyId: string, tagId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('td_daily_tags')
        .insert({ daily_id: dailyId, tag_id: tagId });

    if (error) throw new Error('Failed to assign tag');
    revalidatePath('/');
}

export async function removeTagFromDaily(dailyId: string, tagId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('td_daily_tags')
        .delete()
        .match({ daily_id: dailyId, tag_id: tagId });

    if (error) throw new Error('Failed to remove tag');
    revalidatePath('/');
}
