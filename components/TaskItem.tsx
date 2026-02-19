'use client';

import { useState, useEffect } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { toggleTask, deleteTask } from '@/actions/tasks';
import { Task } from '@/lib/types';
import { cn } from '@/lib/utils';
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

    return (
        <div className="flex items-center gap-3 p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg group shadow-sm transition-all hover:border-neutral-700">
            <button
                onClick={handleToggle}
                className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0",
                    completed
                        ? "bg-neutral-900 border-neutral-900 dark:bg-white dark:border-white text-white dark:text-black"
                        : "border-neutral-300 dark:border-neutral-600 hover:border-neutral-400"
                )}
            >
                {completed && <Check size={12} strokeWidth={3} />}
            </button>

            <div className="flex-1 min-w-0">
                <div className={cn(
                    "text-sm transition-all truncate",
                    completed ? "text-neutral-400 line-through" : "text-neutral-700 dark:text-neutral-200"
                )}>
                    <HashtagText text={task.title} />
                </div>
                <div className="mt-1">
                    <TagSelector
                        taskId={task.id}
                        assignedTags={task.tags || []}
                    />
                </div>
            </div>

            <button
                onClick={handleDelete}
                className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 transition-all shrink-0"
                aria-label="Delete task"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
}
