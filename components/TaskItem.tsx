'use client';

import { useState, useEffect } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { toggleTask, deleteTask } from '@/actions/tasks';
import { Task } from '@/lib/types';
import { cn, stringToBgColor } from '@/lib/utils';
import TagSelector from './TagSelector';
import HashtagText from './HashtagText';

export default function TaskItem({ task }: { task: Task }) {
    const [completed, setCompleted] = useState(task.completed);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setCompleted(task.completed);
    }, [task.completed]);

    async function handleToggle() {
        const newState = !completed;
        setCompleted(newState);
        try {
            await toggleTask(task.id, newState);
        } catch (error) {
            setCompleted(!newState); // Revert on error
            console.error(error);
        }
    }

    async function handleDelete() {
        setIsDeleting(true);
        try {
            await deleteTask(task.id);
        } catch (error) {
            setIsDeleting(false);
            console.error(error);
        }
    }

    if (isDeleting) return null;

    const bgColor = stringToBgColor(task.id);

    return (
        <div
            className="flex items-center gap-2 px-2 py-1.5 border border-black/5 rounded group shadow-sm transition-all hover:shadow-md"
            style={{ backgroundColor: bgColor }}
        >
            <button
                onClick={handleToggle}
                className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0",
                    completed
                        ? "bg-black border-black text-white"
                        : "border-black/20 hover:border-black/40 bg-white/50"
                )}
            >
                {completed && <Check size={10} strokeWidth={3} />}
            </button>

            <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                <div className={cn(
                    "text-xs transition-all truncate font-medium text-neutral-900",
                    completed && "text-neutral-500 line-through opacity-60"
                )}>
                    <HashtagText text={task.title} />
                </div>
                <div className="shrink-0 opacity-70 hover:opacity-100 transition-opacity">
                    <TagSelector
                        taskId={task.id}
                        assignedTags={task.tags || []}
                    />
                </div>
            </div>

            <button
                onClick={handleDelete}
                className="opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 p-1 text-neutral-500 hover:text-red-600 transition-all shrink-0 hover:bg-white/50 rounded"
                aria-label="Delete task"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}
