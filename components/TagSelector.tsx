'use client';

import { useState, useRef, useEffect } from 'react';
import { Tag as TagIcon, X, Plus, Check } from 'lucide-react';
import { Tag } from '@/lib/types';
import { createTag, assignTagToTask, removeTagFromTask } from '@/actions/tags';
import { cn } from '@/lib/utils';
import { getTags } from '@/actions/tags'; // Wait, client component can't call server action directly for fetching in useEffect easily without wrapping.
// We'll pass `availableTags` as prop or use a server action wrapper that returns data.

// For MVP, simplistic approach: fetch tags on open.

export default function TagSelector({
    taskId,
    dailyId,
    assignedTags = [],
    onTagChange
}: {
    taskId?: string;
    dailyId?: string;
    assignedTags: Tag[];
    onTagChange?: (tags: Tag[]) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchTags = async () => {
        setLoading(true);
        try {
            // This is a server action, we can call it.
            const tags = await getTags();
            setAvailableTags(tags);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        if (!isOpen) fetchTags();
        setIsOpen(!isOpen);
        setQuery('');
    };

    const handleCreateTag = async () => {
        if (!query.trim()) return;
        try {
            const newTag = await createTag(query.trim());
            setAvailableTags([...availableTags, newTag]);
            await handleSelectTag(newTag);
            setQuery('');
        } catch (e) {
            console.error(e);
        }
    };

    const handleSelectTag = async (tag: Tag) => {
        const isAssigned = assignedTags.some(t => t.id === tag.id);

        // Optimistic update
        const newTags = isAssigned
            ? assignedTags.filter(t => t.id !== tag.id)
            : [...assignedTags, tag];

        if (onTagChange) onTagChange(newTags);

        try {
            if (taskId) {
                if (isAssigned) await removeTagFromTask(taskId, tag.id);
                else await assignTagToTask(taskId, tag.id);
            }
            // Similar logic for dailyId if needed
        } catch (e) {
            console.error(e);
        }
    };

    const filteredTags = availableTags.filter(tag =>
        tag.name.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Render Assigned Tags */}
            <div className="flex flex-wrap gap-1 items-center">
                {assignedTags.map(tag => (
                    <div key={tag.id} className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-neutral-200 dark:border-neutral-700">
                        {tag.name}
                        <button onClick={() => handleSelectTag(tag)} className="hover:text-red-500">
                            <X size={10} />
                        </button>
                    </div>
                ))}
                <button
                    onClick={handleOpen}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-0.5"
                >
                    <TagIcon size={14} />
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg rounded-lg z-50 p-2 text-sm">
                    <input
                        type="text"
                        placeholder="Search or create..."
                        className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded px-2 py-1 mb-2 focus:outline-none text-xs"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />

                    <div className="max-h-32 overflow-y-auto space-y-1">
                        {loading && <div className="text-xs text-neutral-400 p-1">Loading...</div>}

                        {!loading && filteredTags.map(tag => {
                            const isAssigned = assignedTags.some(t => t.id === tag.id);
                            return (
                                <button
                                    key={tag.id}
                                    onClick={() => handleSelectTag(tag)}
                                    className="w-full text-left px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded flex justify-between items-center text-xs"
                                >
                                    <span className="truncate">{tag.name}</span>
                                    {isAssigned && <Check size={12} className="text-neutral-900 dark:text-white" />}
                                </button>
                            );
                        })}

                        {!loading && query && !filteredTags.find(t => t.name.toLowerCase() === query.toLowerCase()) && (
                            <button
                                onClick={handleCreateTag}
                                className="w-full text-left px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-500 flex items-center gap-1 text-xs"
                            >
                                <Plus size={12} /> Create "{query}"
                            </button>
                        )}

                        {!loading && filteredTags.length === 0 && !query && (
                            <div className="text-xs text-neutral-400 p-1">No tags found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
