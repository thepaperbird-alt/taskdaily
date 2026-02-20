'use client';

import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { addTask } from '@/actions/tasks';
import TaskItem from './TaskItem';
import { Task } from '@/lib/types';
import { useHashtagAutocomplete } from './useHashtagAutocomplete';
import HashtagDropdown from './HashtagDropdown';

export default function TaskListClient({ tasks, allTags }: { tasks: Task[], allTags?: any[] }) {
    const formRef = useRef<HTMLFormElement>(null);
    const [inputValue, setInputValue] = useState("");

    // Autocomplete Hook
    const {
        showDropdown,
        filteredTags,
        selectedIndex,
        handleKeyDown,
        handleChange,
        handleSelect,
        selectTag
    } = useHashtagAutocomplete(inputValue, setInputValue, allTags || []);

    const handleSubmit = async (formData: FormData) => {
        // We need to use the current inputValue controlled state
        // formData.get('title') might be empty if we don't sync properly or rely on native input value.
        // But input has name="title" and value={inputValue}, so it should be fine.

        // Wait, if we use controlled input, we must ensure formData gets it.
        // It does because input has name="title".

        // Optimistic? For now, standard server action revalidation.
        await addTask(formData);
        setInputValue("");
        formRef.current?.reset();
    };

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-neutral-800 to-neutral-600 dark:from-neutral-100 dark:to-neutral-400 bg-clip-text text-transparent px-1">Tasks</h2>

            <div className="relative mb-6">
                <form action={handleSubmit} ref={formRef} className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            name="title"
                            type="text"
                            placeholder="Add a new task..."
                            className="input w-full font-mono"
                            required
                            value={inputValue}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            onSelect={handleSelect}
                            autoComplete="off"
                        />
                        <HashtagDropdown
                            isOpen={showDropdown}
                            tags={filteredTags}
                            selectedIndex={selectedIndex}
                            onSelect={selectTag}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary whitespace-nowrap">
                        <Plus size={18} />
                    </button>
                </form>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800 pb-20">
                {tasks.length === 0 ? (
                    <div className="text-center text-neutral-400 mt-10 text-sm">
                        No tasks yet. Add one above!
                    </div>
                ) : (
                    tasks.map((task) => (
                        <TaskItem key={task.id} task={task} />
                    ))
                )}
            </div>
        </div>
    );
}
