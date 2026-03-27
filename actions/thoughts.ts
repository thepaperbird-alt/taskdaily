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

export async function getThoughts() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('td_thoughts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Failed to get thoughts:', error);
        return [];
    }

    // Map color column to subject if it's a valid subject
    const subjects = ["quotes", "to do", "plans", "braindump"];
    const mappedData = (data || []).map(item => ({
        ...item,
        subject: item.color && subjects.includes(item.color) ? item.color : undefined
    }));

    return mappedData as ThoughtItem[];
}

export async function addThought(content: string, subject?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get max order index
    const { data: existing } = await supabase
        .from('td_thoughts')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].order_index + 1024 : 1024;

    const { error, data } = await supabase
        .from('td_thoughts')
        .insert({
            user_id: user.id,
            content,
            color: subject, // Storing subject in color column for now to avoid schema change
            order_index: nextOrder
        })
        .select()
        .single();

    if (error) throw new Error('Failed to add thought');
    
    // Map color to subject for the return value
    const subjects = ["quotes", "to do", "plans", "braindump"];
    const mappedData = {
        ...data,
        subject: data.color && subjects.includes(data.color) ? data.color : undefined
    };

    revalidatePath('/thoughts');
    return mappedData as ThoughtItem;
}

export async function updateThought(id: string, updates: Partial<ThoughtItem>) {
    const supabase = await createClient();
    
    // Map subject to color column if updated
    const dbUpdates: any = { ...updates, updated_at: new Date().toISOString() };
    if (updates.subject) {
        dbUpdates.color = updates.subject;
        delete dbUpdates.subject;
    }

    const { error } = await supabase
        .from('td_thoughts')
        .update(dbUpdates)
        .eq('id', id);

    if (error) throw new Error('Failed to update thought');
    revalidatePath('/thoughts');
}

export async function deleteThought(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('td_thoughts')
        .delete()
        .eq('id', id);

    if (error) throw new Error('Failed to delete thought');
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
