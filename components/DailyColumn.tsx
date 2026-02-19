import { format } from 'date-fns';
import { getDaily } from '@/actions/dailies';
import { getTags } from '@/actions/tags';
import DailyEditor from './DailyEditor';

export default async function DailyColumn({ dateStr }: { dateStr?: string; filterTags?: string[] }) {
    // Default to today if no date provided
    const currentDate = dateStr ? new Date(dateStr) : new Date();

    // Fetch data for SINGLE day
    const daily = await getDaily(currentDate);
    const allTags = await getTags();

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden pb-4">
                <DailyEditor daily={daily || undefined} date={currentDate} allTags={allTags} />
            </div>
        </div>
    );
}
