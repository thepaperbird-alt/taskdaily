'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getRoutines() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('td_routines')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching routines:', error);
            return { data: [], error: error.message, isDbMissing: error.code === '42P01' };
        }

        return { data: data || [], error: null, isDbMissing: false };
    } catch (e: any) {
        console.error('Exception fetching routines:', e);
        return { data: [], error: e.message || 'Unknown error', isDbMissing: true };
    }
}

export async function addRoutine(title: string, time: string, days: string[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('td_routines')
        .insert({
            user_id: user.id,
            title,
            time,
            days
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding routine:', error);
        throw new Error(error.message);
    }

    revalidatePath('/');
    return { data, error: null };
}

export async function updateRoutine(id: string, updates: { title?: string; time?: string; days?: string[] }) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('td_routines')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating routine:', error);
        throw new Error(error.message);
    }

    revalidatePath('/');
    return { error: null };
}

export async function deleteRoutine(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('td_routines')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting routine:', error);
        throw new Error(error.message);
    }

    revalidatePath('/');
    return { error: null };
}
