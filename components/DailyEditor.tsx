'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, List, ListOrdered, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isToday, addDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { createOrUpdateDaily, addDailyTask } from '@/actions/dailies';
import { Daily, Task } from '@/lib/types';
import TaskItem from './TaskItem';
import TagSelector from './TagSelector';
import { useHashtagAutocomplete } from './useHashtagAutocomplete';
import HashtagDropdown from './HashtagDropdown';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DailyEditor({ daily, date, allTags }: { daily?: Daily; date: Date; allTags?: any[] }) {
    const [content, setContent] = useState(daily?.content || '');
    const [tasks, setTasks] = useState<Task[]>(daily?.tasks || []);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const router = useRouter();

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

    // Update local state when prop changes - ONLY if date changes
    // This fixes the "auto-delete" bug caused by revalidation race conditions
    useEffect(() => {
        setContent(daily?.content || '');
        setTasks(daily?.tasks || []);
    }, [daily?.entry_date]); // Only update content if we switch days

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        handleContentChangeWrapper(e);
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

    const insertFormatting = (type: 'bullet' | 'number') => {
        if (!textareaRef.current) return;

        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const text = textareaRef.current.value;
        const before = text.substring(0, start);
        const after = text.substring(end);

        let visualPrefix = '';
        if (type === 'bullet') visualPrefix = '- ';
        if (type === 'number') visualPrefix = '1. ';

        // If not at start of line, add newline
        const isStartOfLine = start === 0 || text[start - 1] === '\n';
        const prefix = isStartOfLine ? visualPrefix : `\n${visualPrefix}`;

        const newText = before + prefix + after;

        setContent(newText);

        // Focus back and set cursor
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(start + prefix.length, start + prefix.length);
            }
        }, 0);

        // Trigger save
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
            await createOrUpdateDaily(format(date, 'yyyy-MM-dd'), newText, daily?.id);
        }, 1000);
    };

    const formattedDate = format(date, 'EEEE, MMMM do, yyyy');
    const prevDay = format(subDays(date, 1), 'yyyy-MM-dd');
    const nextDay = format(addDays(date, 1), 'yyyy-MM-dd');

    // 6th Word Color Logic
    const techColors = [
        'text-cyan-400',
        'text-green-400',
        'text-purple-400',
        'text-yellow-400',
        'text-pink-400',
        'text-blue-400',
        'text-red-400',
        'text-orange-400',
        'text-indigo-400',
        'text-teal-400'
    ];

    let wordCount = 0;
    const overlayContent = content.split(/(\s+)/).map((part, index) => {
        // Simple logic: if it's not purely whitespace, count it as a word
        if (part.trim().length > 0) {
            wordCount++;
            if (wordCount % 6 === 0) {
                // Determine color based on word hash to keep it stable but random-looking
                let hash = 0;
                for (let i = 0; i < part.length; i++) {
                    hash = part.charCodeAt(i) + ((hash << 5) - hash);
                }
                const colorIndex = Math.abs(hash) % techColors.length;
                const colorClass = techColors[colorIndex];
                return <span key={index} className={colorClass}>{part}</span>;
            }
        }
        return <span key={index}>{part}</span>;
    });

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        const overlay = document.getElementById('editor-overlay');
        if (overlay) {
            overlay.scrollTop = e.currentTarget.scrollTop;
            overlay.scrollLeft = e.currentTarget.scrollLeft;
        }
    };

    return (
        <div className="flex flex-col h-full bg-black rounded-xl shadow-sm border border-neutral-800 overflow-hidden">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white dark:bg-neutral-800 rounded-lg p-0.5 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <Link href={`/?date=${prevDay}`} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md text-neutral-500 transition-colors">
                            <ChevronLeft size={16} />
                        </Link>
                        <Link href={`/?date=${format(new Date(), 'yyyy-MM-dd')}`} className="px-3 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors border-x border-transparent hover:border-neutral-200 dark:hover:border-neutral-700">
                            Today
                        </Link>
                        <Link href={`/?date=${nextDay}`} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md text-neutral-500 transition-colors">
                            <ChevronRight size={16} />
                        </Link>
                    </div>
                    <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                        <CalendarIcon size={14} className="text-neutral-400" />
                        {formattedDate}
                    </h2>
                </div>

                <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
                    <button onClick={() => insertFormatting('bullet')} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-neutral-500" title="Bullet List">
                        <List size={14} />
                    </button>
                    <button onClick={() => insertFormatting('number')} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-neutral-500" title="Numbered List">
                        <ListOrdered size={14} />
                    </button>
                    <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1"></div>
                    {daily?.id && <TagSelector dailyId={daily.id} assignedTags={daily.tags || []} />}
                </div>
            </div>

            <div className="flex-1 flex flex-col relative overflow-hidden bg-neutral-50/20">
                <div className="flex-1 relative overflow-hidden">
                    {/* Overlay for coloring */}
                    <div
                        id="editor-overlay"
                        className="absolute inset-0 p-6 whitespace-pre-wrap font-mono text-base leading-relaxed text-white pointer-events-none overflow-hidden"
                        aria-hidden="true"
                    >
                        {overlayContent}
                    </div>

                    {/* Actual Editor */}
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        onKeyDown={onContentKeyDown}
                        onSelect={handleContentSelect}
                        onScroll={handleScroll}
                        placeholder="Start typing..."
                        className="w-full h-full p-6 bg-transparent text-base leading-relaxed font-mono text-white placeholder:text-neutral-700 resize-none focus:outline-none relative z-10"
                        style={{ color: 'transparent', caretColor: 'white' }}
                    />
                    <HashtagDropdown
                        isOpen={showContentDropdown}
                        tags={contentFilteredTags}
                        selectedIndex={contentSelectedIndex}
                        onSelect={(tag) => {
                            selectContentTag(tag);
                            setTimeout(async () => {
                                // Implicit save trigger via state update effectively
                            }, 100);
                        }}
                    />
                </div>

                {/* Inline Tasks Section */}
                <div className="border-t border-neutral-100 dark:border-neutral-800 p-4 bg-neutral-50/30 dark:bg-neutral-900/30">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-500 uppercase tracking-widest">Linked Tasks</span>
                        {!isAddingTask && (
                            <button
                                onClick={() => setIsAddingTask(true)}
                                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                            >
                                <Plus size={14} /> Add task
                            </button>
                        )}
                    </div>

                    <div className="space-y-1">
                        {tasks.map(task => (
                            <TaskItem key={task.id} task={task} />
                        ))}
                        {tasks.length === 0 && !isAddingTask && (
                            <div className="text-xs text-neutral-400 italic">No tasks linked to this entry.</div>
                        )}
                    </div>

                    {isAddingTask && (
                        <form onSubmit={handleAddTask} className="mt-2 flex gap-2 relative">
                            <div className="relative flex-1">
                                <input
                                    ref={taskInputRef}
                                    type="text"
                                    placeholder="New task..."
                                    className="input text-xs py-1.5 h-auto font-mono w-full"
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
                            <button type="submit" className="btn btn-primary text-xs py-1 px-3">Add</button>
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
            </div>
        </div>
    );
}
