'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export type MediaItem = {
    id: string;
    user_id: string;
    title: string;
    summary: string | null;
    type: 'movie' | 'tv' | 'game' | 'gadget';
    status: 'to_watch' | 'current' | 'completed';
    platform: string | null;
    season: string | null;
    order_index: number;
    created_at: string;
    updated_at: string;
}

export async function getWatchlist() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('td_media')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Failed to get watchlist:', error);
        return [];
    }
    return data as MediaItem[];
}

export async function addMediaItem(data: {
    title: string;
    summary?: string;
    type: 'movie' | 'tv' | 'game' | 'gadget';
    status: 'to_watch' | 'current' | 'completed';
    platform?: string;
    season?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let finalSummary = data.summary;

    // Use AI to generate summary if it's missing
    if (!finalSummary || finalSummary.trim() === '') {
        try {
            const prompt = `Write a concise, one-sentence logline (max 15 words) for the ${data.type} "${data.title}". If you don't know it, just write a generic pleasant description.`;
            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-4o-mini",
            });
            finalSummary = completion.choices[0]?.message?.content?.trim() || '';
        } catch (err) {
            console.error('Failed to generate AI summary:', err);
            finalSummary = '';
        }
    }

    // Get max order index for the status column
    const { data: existing } = await supabase
        .from('td_media')
        .select('order_index')
        .eq('status', data.status)
        .order('order_index', { ascending: false })
        .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].order_index + 1024 : 1024;

    const { error } = await supabase
        .from('td_media')
        .insert({
            user_id: user.id,
            title: data.title,
            summary: finalSummary,
            type: data.type,
            status: data.status,
            platform: data.platform,
            season: data.season,
            order_index: nextOrder
        });

    if (error) throw new Error('Failed to add media item');
    revalidatePath('/watchlist');
}

export async function updateMediaItem(id: string, updates: Partial<MediaItem>) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('td_media')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw new Error('Failed to update media item');
    revalidatePath('/watchlist');
}

export async function deleteMediaItem(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('td_media')
        .delete()
        .eq('id', id);

    if (error) throw new Error('Failed to delete media item');
    revalidatePath('/watchlist');
}

export async function updateMediaOrder(updates: { id: string, status: string, order_index: number }[]) {
     const supabase = await createClient();
     
     // Due to RLS and batch update complexity in supabase JS, 
     // we'll update them one by one. For small lists, this is usually fast enough.
     // Alternatively, could use a stored procedure.
     for (const update of updates) {
         await supabase
            .from('td_media')
            .update({ 
                status: update.status, 
                order_index: update.order_index,
                updated_at: new Date().toISOString()
            })
            .eq('id', update.id);
     }
     
     revalidatePath('/watchlist');
}
