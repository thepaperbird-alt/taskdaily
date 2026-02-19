'use client';

import { useState } from 'react';
import { X, Hash, Search, Filter } from 'lucide-react';
import { deleteTag, getParagraphsByTag } from '@/actions/tag-manager';
import { format } from 'date-fns';
import { stringToColor, stringToBgColor } from '@/lib/utils'; // Import utils

export default function HashtagManager({ tags }: { tags: any[] }) {
    // ... (state remains)
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const handleTagClick = async (tagName: string) => {
        if (selectedTag === tagName) {
            setSelectedTag(null);
            setSearchResults([]);
            return;
        }

        setSelectedTag(tagName);
        setLoading(true);
        try {
            const results = await getParagraphsByTag(tagName);
            setSearchResults(results);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (tagId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirmDelete === tagId) {
            await deleteTag(tagId);
            setConfirmDelete(null);
            if (selectedTag) setSelectedTag(null); // Reset if deleted active
        } else {
            setConfirmDelete(tagId);
            setTimeout(() => setConfirmDelete(null), 3000); // Reset confirm after 3s
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                    <Hash size={14} className="text-neutral-400" />
                    Hashtags
                </h2>
                <span className="text-xs text-neutral-400">{tags.length} tags</span>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                {!selectedTag ? (
                    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
                        <div className="flex flex-wrap gap-2">
                            {tags.length === 0 && (
                                <p className="text-xs text-neutral-400 italic w-full text-center py-4">No hashtags yet. Add them in tasks or daily notes using #</p>
                            )}
                            {tags.map((tag: any) => (
                                <div
                                    key={tag.id}
                                    onClick={() => handleTagClick(tag.name)}
                                    className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs transition-all cursor-pointer border border-transparent hover:brightness-95"
                                    style={{
                                        backgroundColor: stringToBgColor(tag.name),
                                        color: stringToColor(tag.name)
                                    }}
                                >
                                    <span className="font-medium">#{tag.name}</span>
                                    <button
                                        onClick={(e) => handleDelete(tag.id, e)}
                                        className={`ml-1 p-0.5 rounded-full hover:bg-black/10 transition-colors ${confirmDelete === tag.id ? 'text-red-600 bg-red-100' : 'opacity-0 group-hover:opacity-100'}`}
                                        style={{ color: confirmDelete === tag.id ? undefined : stringToColor(tag.name) }}
                                        title={confirmDelete === tag.id ? "Click again to delete" : "Delete tag"}
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                                    #{selectedTag}
                                </span>
                                <span className="text-xs text-neutral-400">
                                    {loading ? 'Searching...' : `${searchResults.length} results`}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedTag(null)}
                                className="text-xs text-neutral-400 hover:text-neutral-600"
                            >
                                <X size={14} /> Clear
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
                            {loading ? (
                                <div className="p-8 text-center text-xs text-neutral-400">Loading occurrences...</div>
                            ) : searchResults.length === 0 ? (
                                <div className="p-8 text-center text-xs text-neutral-400">No content found with this tag.</div>
                            ) : (
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {searchResults.map((item, idx) => (
                                        <div key={`${item.id}-${idx}`} className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">
                                                    {format(new Date(item.date), 'MMM d')} • {item.type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-mono">
                                                {item.text.split(new RegExp(`(#${selectedTag})`, 'gi')).map((part: string, i: number) => (
                                                    part.toLowerCase() === `#${selectedTag.toLowerCase()}` ? (
                                                        <span key={i} className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 rounded px-0.5">{part}</span>
                                                    ) : (
                                                        part
                                                    )
                                                ))}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
