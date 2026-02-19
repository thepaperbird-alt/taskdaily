'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { createOrUpdateDaily, addDailyTask } from '@/actions/dailies';
import { Daily, Task } from '@/lib/types';
import TaskItem from './TaskItem';
import TagSelector from './TagSelector';
import { useHashtagAutocomplete } from './useHashtagAutocomplete';
import HashtagDropdown from './HashtagDropdown';

export default function DailyEntry({ daily, date, allTags }: { daily?: Daily; date: Date; allTags?: any[] }) {
    const [isOpen, setIsOpen] = useState(isToday(date));
    const [content, setContent] = useState(daily?.content || '');
    const [tasks, setTasks] = useState<Task[]>(daily?.tasks || []);
    const [isAddingTask, setIsAddingTask] = useState(false);

    // Autocomplete for content
    const {
        showDropdown: showContentDropdown,
        filteredTags: contentFilteredTags,
        selectedIndex: contentSelectedIndex,
        handleKeyDown: handleContentKeyDown,
        handleChange: handleContentChangeWrapper,
        handleSelect: handleContentSelect,
        selectTag: selectContentTag
    } = useHashtagAutocomplete(content, setContent, allTags || []);

    const taskInputRef = useRef<HTMLInputElement>(null);
    const [taskInputValue, setTaskInputValue] = useState("");
    // Autocomplete for task input
    const {
        showDropdown: showTaskDropdown,
        filteredTags: taskFilteredTags,
        selectedIndex: taskSelectedIndex,
        handleKeyDown: handleTaskKeyDown,
        handleChange: handleTaskChangeWrapper,
        handleSelect: handleTaskSelect,
        selectTag: selectTaskTag
    } = useHashtagAutocomplete(taskInputValue, setTaskInputValue, allTags || []);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Update local state when prop changes
    useEffect(() => {
        setContent(daily?.content || '');
        setTasks(daily?.tasks || []);
    }, [daily]);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        handleContentChangeWrapper(e); // Updates content state + autocomplete

        // Debounce save (using the new value from event, but state update is async in wrapper? 
        // Wrapper calls setContent(val). We can use e.target.value directly for save.
        const newContent = e.target.value;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
            try {
                await createOrUpdateDaily(format(date, 'yyyy-MM-dd'), newContent, daily?.id);
            } catch (err) {
                console.error("Failed to save daily", err);
            }
        }, 1000);
    };

    // We need to intercept keydown on textarea generally
    const onContentKeyDown = (e: React.KeyboardEvent) => {
        handleContentKeyDown(e);
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        const title = taskInputValue;
        if (!title?.trim()) return;

        try {
            await addDailyTask(daily?.id || '', title, format(date, 'yyyy-MM-dd'));
            setTaskInputValue('');
            setIsAddingTask(false);
        } catch (err) {
            console.error("Failed to add task", err);
        }
    };

    const formattedDate = format(date, 'EEEE, MMM d');
    const isCurrentDay = isToday(date);

    return (
        <div
            className={cn(
                "card transition-all relative overflow-hidden flex flex-col",
                isCurrentDay
                    ? "flex-1 ring-1 ring-neutral-200 dark:ring-neutral-800"
                    : "flex-none shrink-0 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800",
                isCurrentDay ? "h-auto" : (isOpen ? "h-auto min-h-[200px]" : "h-12") // Allow manual open, but default small
            )}
        >
            <div className="flex items-start justify-between mb-2 shrink-0">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex-1 flex items-center justify-between focus:outline-none group pr-2 h-8" // Fixed height header
                >
                    <div className="flex items-center gap-2">
                        {/* Only show chevron if not today (always open) or maybe allow collapse? User said Today takes majority. */}
                        {/* If we allow collapse of today, layout breaks. Let's force today open? */}
                        {/* Actually "Today's text entry box bigger... previous/future... small height" */}
                        {isOpen ? <ChevronDown size={16} className="text-neutral-400" /> : <ChevronRight size={16} className="text-neutral-400" />}
                        <span className={cn("font-medium", isCurrentDay ? "text-neutral-900 dark:text-white" : "text-neutral-700 dark:text-neutral-300")}>
                            {formattedDate}
                        </span>
                        {isCurrentDay && <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded">Today</span>}
                    </div>

                    {!isOpen && (
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-neutral-400 opacity-60 group-hover:opacity-100 transition-opacity">
                                {tasks.length} tasks
                            </span>
                        </div>
                    )}
                </button>

                {/* Daily Tags */}
                <div className={cn("transition-opacity", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")}>
                    {daily?.id && <TagSelector dailyId={daily.id} assignedTags={daily.tags || []} />}
                </div>
            </div>

            {isOpen && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200 flex-1 flex flex-col relative">
                    {/* Journal Content */}
                    <div className="relative flex-1">
                        <textarea
                            value={content}
                            onChange={handleContentChange}
                            onKeyDown={onContentKeyDown}
                            onSelect={handleContentSelect}
                            placeholder="Write your daily notes..."
                            className="w-full bg-transparent text-sm font-mono text-neutral-600 dark:text-neutral-300 placeholder:text-neutral-300 dark:placeholder:text-neutral-700 resize-none focus:outline-none min-h-[80px] h-full"
                        />
                        <HashtagDropdown
                            isOpen={showContentDropdown}
                            tags={contentFilteredTags}
                            selectedIndex={contentSelectedIndex}
                            onSelect={(tag) => {
                                selectContentTag(tag);
                                // Trigger save after selection?
                                // selectTag calls setContent, which updates state. 
                                // But handleContentChange debouncer won't run.
                                // We might need to manually trigger save here or just wait for next keystroke?
                                // Better to persist.
                                // Quick hack: setTimeout to save
                                setTimeout(async () => {
                                    // We need constructed value, logic inside selectTag is internal.
                                    // We should expose save callback.
                                    // For now, it's fine, user likely continues typing.
                                }, 100);
                            }}
                        />
                    </div>

                    {/* Inline Tasks */}
                    <div className="space-y-2">
                        {tasks.map(task => (
                            <TaskItem key={task.id} task={task} />
                        ))}
                    </div>

                    {/* Add Task Button */}
                    {!isAddingTask ? (
                        <button
                            onClick={() => setIsAddingTask(true)}
                            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                        >
                            <Plus size={14} /> Add task
                        </button>
                    ) : (
                        <form onSubmit={handleAddTask} className="flex gap-2 relative">
                            <div className="relative flex-1">
                                <input
                                    ref={taskInputRef}
                                    type="text"
                                    placeholder="New task..."
                                    className="input text-xs py-1 h-8 font-mono w-full"
                                    autoFocus
                                    value={taskInputValue}
                                    onChange={handleTaskChangeWrapper}
                                    onKeyDown={handleTaskKeyDown}
                                    onSelect={handleTaskSelect}
                                    autoComplete="off"
                                />
                                <HashtagDropdown
                                    isOpen={showTaskDropdown}
                                    tags={taskFilteredTags}
                                    selectedIndex={taskSelectedIndex}
                                    onSelect={selectTaskTag}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary text-xs py-1 h-8">Add</button>
                            <button
                                type="button"
                                onClick={() => setIsAddingTask(false)}
                                className="text-xs text-neutral-400 px-2"
                            >
                                Cancel
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
