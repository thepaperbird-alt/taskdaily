
import { createClient } from '@supabase/supabase-js';

// Hardcoded for reliability in this one-off script
const supabaseUrl = 'https://psfdrqksjmnhhebtfnwh.supabase.co';
const supabaseKey = 'sb_publishable_cS9laoIH3I3hhaaOTGWLqw_u4SUuM9S'; // Anon key from .env.local

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearTags() {
    console.log('Clearing tags...');

    // Auth as user to allow RLS deletion
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'thepaperbird@gmail.com',
        password: 'sherlocked712'
    });

    if (loginError || !session) {
        console.error('Login failed:', loginError);
        return;
    }

    console.log('Logged in as:', session.user.email);

    // Delete tasks' tags
    const { error: e1 } = await supabase.from('td_task_tags').delete().neq('task_id', '00000000-0000-0000-0000-000000000000');
    if (e1) console.error('Error clearing task_tags:', e1);
    else console.log('Cleared task_tags');

    // Delete dailies' tags
    const { error: e2 } = await supabase.from('td_daily_tags').delete().neq('daily_id', '00000000-0000-0000-0000-000000000000');
    if (e2) console.error('Error clearing daily_tags:', e2);
    else console.log('Cleared daily_tags');

    // Delete tags
    const { error: e3 } = await supabase.from('td_tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (e3) console.error('Error clearing tags:', e3);
    else console.log('Cleared tags');

    console.log('Done.');
}

clearTags();
