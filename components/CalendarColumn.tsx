import { getDaysWithTasks } from '@/actions/calendar';
import CalendarColumnClient from './CalendarColumnClient';

export default async function CalendarColumn({ dateStr }: { dateStr?: string; }) {
    const daysWithTasks = await getDaysWithTasks();
    return <CalendarColumnClient daysWithTasks={daysWithTasks} />;
}
