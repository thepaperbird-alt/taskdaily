'use client';

import { useState, useRef, useEffect } from 'react';
import { List, ListOrdered, Strikethrough, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isToday, addDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { createOrUpdateDaily } from '@/actions/dailies';
import { Daily } from '@/lib/types';
import TagSelector from './TagSelector';
import { useHashtagAutocomplete } from './useHashtagAutocomplete';
import HashtagDropdown from './HashtagDropdown';
import HashtagManager from './HashtagManager';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MiniCalendar from './MiniCalendar';

export default function DailyEditor({ daily, date, allTags }: { daily?: Daily; date: Date; allTags?: any[] }) {
    const [activeTab, setActiveTab] = useState<'daily' | 'hashtags'>('daily');
    const [content, setContent] = useState(daily?.content || '');

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Calendar state
    const [showCalendar, setShowCalendar] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);

    // Quick Note state
    const [noteInputValue, setNoteInputValue] = useState("");

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



    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Update local state when prop changes - ONLY if date changes
    // This fixes the "auto-delete" bug caused by revalidation race conditions
    useEffect(() => {
        setContent(daily?.content || '');
    }, [daily?.entry_date]); // Only update content if we switch days

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setShowCalendar(false);
            }
        };
        if (showCalendar) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showCalendar]);

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


    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!noteInputValue.trim()) return;

        const prefix = content.length > 0 && !content.endsWith('\n') ? '\n- ' : '- ';
        const newText = content + prefix + noteInputValue.trim();
        setContent(newText);
        setNoteInputValue('');

        // Scroll to bottom
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
            }
            if (overlayRef.current) {
                overlayRef.current.scrollTop = overlayRef.current.scrollHeight;
            }
        }, 50);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
            try {
                await createOrUpdateDaily(format(date, 'yyyy-MM-dd'), newText, daily?.id);
            } catch (err) {
                console.error("Failed to save daily", err);
            }
        }, 1000);
    };

    const insertFormatting = (type: 'bullet' | 'number' | 'strikethrough') => {
        if (!textareaRef.current) return;

        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const text = textareaRef.current.value;
        const before = text.substring(0, start);
        const after = text.substring(end);
        const selected = text.substring(start, end);

        let newText;
        let newSelectionStart, newSelectionEnd;

        if (type === 'strikethrough') {
            const STRIKE_CHAR = '\u0336';
            const isStruck = selected.includes(STRIKE_CHAR);

            if (isStruck) {
                // Remove all strike characters from the selection
                const unstruck = selected.split(STRIKE_CHAR).join('');
                newText = before + unstruck + after;
                newSelectionStart = start;
                newSelectionEnd = start + unstruck.length;
            } else {
                // Apply strike character after every character
                const struck = selected.split('').map(char => char + STRIKE_CHAR).join('');
                const insertText = struck.length > 0 ? struck : STRIKE_CHAR + STRIKE_CHAR; // placeholder if empty
                newText = before + insertText + after;
                newSelectionStart = start;
                newSelectionEnd = start + insertText.length;
            }
        } else {
            let visualPrefix = '';
            if (type === 'bullet') visualPrefix = '- ';
            if (type === 'number') visualPrefix = '1. ';

            // If not at start of line, add newline
            const isStartOfLine = start === 0 || text[start - 1] === '\n';
            const prefix = isStartOfLine ? visualPrefix : `\n${visualPrefix}`;

            newText = before + prefix + selected + after;
            newSelectionStart = start + prefix.length;
            newSelectionEnd = end + prefix.length;
        }

        setContent(newText);

        // Focus back and set cursor/selection
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newSelectionStart, newSelectionEnd);
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
    // 6th Word Color Logic
    const techColors = [
        'text-cyan-600 dark:text-cyan-400',
        'text-green-600 dark:text-green-400',
        'text-purple-600 dark:text-purple-400',
        'text-yellow-600 dark:text-yellow-400',
        'text-pink-600 dark:text-pink-400',
        'text-blue-600 dark:text-blue-400',
        'text-red-600 dark:text-red-400',
        'text-orange-600 dark:text-orange-400',
        'text-indigo-600 dark:text-indigo-400',
        'text-teal-600 dark:text-teal-400'
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
        if (overlayRef.current) {
            overlayRef.current.scrollTop = e.currentTarget.scrollTop;
            overlayRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-neutral-900 md:rounded-xl md:shadow-sm border-t md:border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            {/* Tabs */}
            <div className="flex p-1 md:p-1.5 m-2 md:m-3 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg shrink-0 gap-1">
                <button
                    onClick={() => setActiveTab('daily')}
                    className={cn(
                        "flex-1 py-2 md:py-1.5 text-sm md:text-xs font-semibold text-center transition-all rounded-md touch-manipulation",
                        activeTab === 'daily' 
                            ? "text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-700 shadow-sm" 
                            : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
                    )}
                >
                    Daily
                </button>
                <button
                    onClick={() => setActiveTab('hashtags')}
                    className={cn(
                        "flex-1 py-2 md:py-1.5 text-sm md:text-xs font-semibold text-center transition-all rounded-md touch-manipulation",
                        activeTab === 'hashtags' 
                            ? "text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-700 shadow-sm" 
                            : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
                    )}
                >
                    Topics
                </button>
            </div>

            {activeTab === 'daily' ? (
                <>
                    {/* Header / Toolbar */}
                    <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 gap-2 shrink-0">
                <div className="flex items-center gap-2 md:gap-4 shrink min-w-0">
                    <div className="flex items-center shrink-0 bg-white dark:bg-neutral-800 rounded-lg p-0.5 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <Link href={`/?date=${prevDay}`} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md text-neutral-500 transition-colors">
                            <ChevronLeft size={16} />
                        </Link>
                        {isToday(date) && (
                            <Link href={`/?date=${format(new Date(), 'yyyy-MM-dd')}`} className="px-3 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors border-x border-transparent hover:border-neutral-200 dark:hover:border-neutral-700">
                                Today
                            </Link>
                        )}
                        <Link href={`/?date=${nextDay}`} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md text-neutral-500 transition-colors">
                            <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="relative flex items-center shrink min-w-0" ref={calendarRef}>
                        <button
                            onClick={() => setShowCalendar(!showCalendar)}
                            className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1 md:gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 p-1.5 -ml-1.5 rounded-md transition-colors min-w-0"
                        >
                            <CalendarIcon size={14} className="text-neutral-400 shrink-0" />
                            <span className="truncate">{formattedDate}</span>
                        </button>

                        {showCalendar && (
                            <div className="absolute top-full left-0 mt-1 z-50">
                                <MiniCalendar selectedDate={date} onClose={() => setShowCalendar(false)} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
                    <button onClick={() => insertFormatting('bullet')} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-neutral-500" title="Bullet List">
                        <List size={14} />
                    </button>
                    <button onClick={() => insertFormatting('number')} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-neutral-500" title="Numbered List">
                        <ListOrdered size={14} />
                    </button>
                    <button onClick={() => insertFormatting('strikethrough')} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded text-neutral-500" title="Strikethrough">
                        <Strikethrough size={14} />
                    </button>
                    <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1"></div>
                    {daily?.id && <TagSelector dailyId={daily.id} assignedTags={daily.tags || []} />}
                </div>
            </div>

            <div className="flex-1 flex flex-col relative overflow-hidden bg-neutral-50/20 min-h-0">
                <div className="flex-1 relative overflow-hidden min-h-0">
                    {/* Overlay for coloring */}
                    <div
                        id="editor-overlay"
                        ref={overlayRef}
                        className="absolute inset-0 w-full h-full p-4 md:p-6 pb-32 md:pb-12 whitespace-pre-wrap break-words font-mono text-base md:text-[12px] leading-relaxed text-neutral-700 dark:text-neutral-300 pointer-events-none overflow-y-auto"
                        aria-hidden="true"
                    >
                        {overlayContent}
                        {content.endsWith('\n') ? <br /> : null}
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
                        className="absolute inset-0 w-full h-full p-4 md:p-6 pb-32 md:pb-12 whitespace-pre-wrap break-words bg-transparent text-base md:text-[12px] leading-relaxed font-mono text-neutral-700 dark:text-neutral-300 placeholder:text-neutral-300 dark:placeholder:text-neutral-700 resize-none focus:outline-none z-10 overflow-y-auto"
                        style={{ color: 'transparent', caretColor: 'var(--foreground)' }}
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

                {/* Quick Add Note Section */}
                <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 p-2 md:p-3 bg-white dark:bg-neutral-900 shrink-0 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] dark:shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.2)] relative z-20">
                    <form onSubmit={handleAddNote} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Type a quick note and hit Enter..."
                            value={noteInputValue}
                            onChange={(e) => setNoteInputValue(e.target.value)}
                            className="flex-1 input text-sm py-2 px-3 border-neutral-200 dark:border-neutral-800 bg-neutral-50 focus:bg-white dark:bg-neutral-800/50 dark:focus:bg-neutral-800"
                        />
                        <button
                            type="submit"
                            disabled={!noteInputValue.trim()}
                            className="btn btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Add
                        </button>
                    </form>
                </div>

                {/* Mobile Preview of Notes (only visible on mobile, pulls text from editor) */}
                <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-4 shrink-0 overflow-y-auto max-h-[40vh]">
                    <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">Today's Notes</h3>
                    {content.trim() ? (
                        <div className="space-y-2">
                            {content.split('\n').filter(line => line.trim().length > 0).reverse().map((line, i) => (
                                <div key={i} className="text-sm text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 p-3 rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-800">
                                    {line.replace(/^-\s*/, '')}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-neutral-400 italic text-center py-4">No notes yet today.</div>
                    )}
                </div>
            </div>
            </>
            ) : (
                <div className="flex-1 overflow-hidden p-0 border-0 h-full">
                    <HashtagManager tags={allTags || []} />
                </div>
            )}
        </div>
    );
}
