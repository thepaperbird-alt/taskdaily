'use server';

import { createClient } from '@/lib/supabase/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CalendarEvent {
    title: string;
    start: string;
    end: string;
    calendar?: string;
}

export async function getAppleCalendarEvents(): Promise<CalendarEvent[]> {
    const appleScript = `
        set currentDate to (current date)
        set hours of currentDate to 0
        set minutes of currentDate to 0
        set seconds of currentDate to 0
        set endOfDay to currentDate + (24 * 60 * 60)

        tell application "Calendar"
            set output to ""
            repeat with aCal in calendars
                try
                    set theEvents to (every event of aCal whose start date is greater than or equal to currentDate and start date is less than endOfDay)
                    repeat with anEvent in theEvents
                        set sd to start date of anEvent
                        set ed to end date of anEvent
                        set output to output & (summary of anEvent) & "|" & (hours of sd) & ":" & (minutes of sd) & "|" & (hours of ed) & ":" & (minutes of ed) & "|" & (name of aCal) & "\n"
                    end repeat
                end try
            end repeat
            return output
        end tell
    `;

    try {
        const { stdout } = await execAsync(`osascript -e '${appleScript.replace(/'/g, "'\\''")}'`);
        const lines = stdout.trim().split('\n');
        return lines
            .filter(line => line.trim() !== '')
            .map(line => {
                const [title, start, end, calendar] = line.split('|');
                // The date string will be like "Tuesday, May 5, 2026 at 9:00:00 AM"
                // We'll let new Date() try to parse it, or just pass it as is.
                return { title, start, end, calendar };
            });
    } catch (error) {
        console.error('Error fetching Apple Calendar events:', error);
        return [];
    }
}

export async function getDaysWithTasks(): Promise<string[]> {
    const supabase = await createClient();

    // We want entry_dates from dailies that have at least one associated task
    const { data, error } = await supabase
        .from('td_dailies')
        .select(`
            entry_date,
            td_tasks (
                id
            )
        `);

    if (error) {
        console.error('Error fetching days with tasks:', error);
        return [];
    }

    // Filter dailies that actually have tasks and map to entry_date
    const dates = data
        .filter((daily: any) => daily.td_tasks && daily.td_tasks.length > 0)
        .map((daily: any) => daily.entry_date);

    return Array.from(new Set(dates));
}
