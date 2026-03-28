'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type ThoughtItem = {
    id: string;
    user_id: string;
    content: string;
    color?: string;
    subject?: "quotes" | "to do" | "plans" | "braindump";
    order_index: number;
    created_at: string;
    updated_at: string;
};

const VALID_SUBJECTS = ["quotes", "to do", "plans", "braindump"] as const;

function mapDbRowToThought(item: any): ThoughtItem {
    return {
        id: item.id || '',
        user_id: item.user_id || '',
        content: item.content || '',
        color: item.color || undefined,
        subject: item.color && VALID_SUBJECTS.includes(item.color as any) ? (item.color as any) : undefined,
        order_index: typeof item.order_index === 'number' ? item.order_index : 0,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
    };
}

export async function getThoughts(): Promise<ThoughtItem[]> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('td_thoughts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[getThoughts] Supabase query error:', JSON.stringify(error, null, 2));
            return [];
        }

        return (data || []).map(mapDbRowToThought) as ThoughtItem[];
    } catch (err) {
        console.error('[getThoughts] Unexpected error:', err);
        return [];
    }
}

export async function addThought(content: string, subject?: string) {
    const supabase = await createClient();

    // Try getUser first, fall back to getSession for broader compatibility
    let userId: string | null = null;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        userId = user.id;
    } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            userId = session.user.id;
        }
    }

    if (!userId) {
        console.error('[addThought] No authenticated user found');
        throw new Error('User not authenticated');
    }

    // Get max order index
    const { data: existing } = await supabase
        .from('td_thoughts')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].order_index + 1024 : 1024;

    // Validate subject
    const colorToStore = subject && VALID_SUBJECTS.includes(subject as any) ? subject : null;

    const { error, data } = await supabase
        .from('td_thoughts')
        .insert({
            user_id: userId,
            content,
            color: colorToStore,
            order_index: nextOrder,
        })
        .select()
        .single();

    if (error) {
        console.error('[addThought] Supabase insert error:', JSON.stringify(error, null, 2));
        throw new Error('Failed to add thought: ' + error.message);
    }

    if (!data) {
        console.error('[addThought] Insert returned no data — possible RLS SELECT block');
        // Still succeed with a synthetic record so the optimistic UI stays
        throw new Error('Thought may have saved but could not be confirmed. Please refresh.');
    }

    revalidatePath('/thoughts');
    return mapDbRowToThought(data) as ThoughtItem;
}

export async function updateThought(id: string, updates: Partial<ThoughtItem>) {
    const supabase = await createClient();

    // Build DB-safe update object — drop TypeScript-only 'subject' field
    const { subject, ...restUpdates } = updates;
    const dbUpdates: any = {
        ...restUpdates,
        updated_at: new Date().toISOString(),
    };

    // Map subject -> color column if provided
    if (subject !== undefined) {
        dbUpdates.color = VALID_SUBJECTS.includes(subject as any) ? subject : null;
    }

    // Ensure 'subject' is never sent as a DB column
    delete dbUpdates.subject;

    const { error } = await supabase
        .from('td_thoughts')
        .update(dbUpdates)
        .eq('id', id);

    if (error) {
        console.error('[updateThought] Supabase update error:', JSON.stringify(error, null, 2));
        throw new Error('Failed to update thought: ' + error.message);
    }
    revalidatePath('/thoughts');
}

export async function deleteThought(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('td_thoughts')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('[deleteThought] Supabase delete error:', JSON.stringify(error, null, 2));
        throw new Error('Failed to delete thought: ' + error.message);
    }
    revalidatePath('/thoughts');
}

export async function updateThoughtsOrder(updates: { id: string, order_index: number }[]) {
    const supabase = await createClient();

    for (const update of updates) {
        await supabase
            .from('td_thoughts')
            .update({
                order_index: update.order_index,
                updated_at: new Date().toISOString()
            })
            .eq('id', update.id);
    }

    revalidatePath('/thoughts');
}
