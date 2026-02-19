// Server wrapper
import { getTasks } from '@/actions/tasks';
import { getTags } from '@/actions/tags';
import TaskListClient from './TaskListClient';

export default async function TaskList({ filterTags }: { filterTags?: string[] }) {
    const tasks = await getTasks(filterTags);
    const allTags = await getTags();
    return <TaskListClient tasks={tasks} allTags={allTags} />;
}
