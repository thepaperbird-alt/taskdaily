'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Hash, Search, Plus } from 'lucide-react';
import { deleteTag, getParagraphsByTag, searchAllParagraphs } from '@/actions/tag-manager';
import { createTag } from '@/actions/tags';
import { format } from 'date-fns';
import { stringToColor, stringToBgColor } from '@/lib/utils'; // Import utils

export default function HashtagManager({ tags }: { tags: any[] }) {
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    
    // Create topic state
    const [isCreating, setIsCreating] = useState(false);
    const [newTopicName, setNewTopicName] = useState('');
    const [isCreatingLoading, setIsCreatingLoading] = useState(false);
    
    // Search timeout ref
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleTagClick = async (tagName: string) => {
        if (selectedTag === tagName) {
            setSelectedTag(null);
            setSearchResults([]);
            return;
        }

        setSelectedTag(tagName);
        setSearchQuery(''); // clear query
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
    
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        setSelectedTag(null);
        
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        
        setLoading(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const results = await searchAllParagraphs(query);
                setSearchResults(results);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }, 500);
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
    
    const handleCreateTopic = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTopicName.trim()) return;
        
        // Remove spaces and special chars, keep it hashtag friendly
        const cleanedName = newTopicName.trim().replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
        if (!cleanedName) return;
        
        setIsCreatingLoading(true);
        try {
            await createTag(cleanedName);
            setNewTopicName('');
            setIsCreating(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsCreatingLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex justify-between items-center sm:flex-row flex-col gap-2 shrink-0">
                <div className="flex justify-between items-center w-full sm:w-auto">
                    <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 pr-4">
                        <Hash size={14} className="text-neutral-400" />
                        Topics
                    </h2>
                    <span className="text-xs text-neutral-400 sm:hidden">{tags.length} topics</span>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-48">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input 
                            type="text" 
                            placeholder="Search anywhere..." 
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full text-xs pl-8 pr-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    {!isCreating ? (
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 p-1.5 rounded-md transition-colors flex items-center gap-1"
                            title="Create Topic"
                        >
                            <Plus size={14} />
                            <span className="text-xs hidden sm:inline font-medium pr-1">Create</span>
                        </button>
                    ) : (
                        <form onSubmit={handleCreateTopic} className="flex items-center gap-1">
                            <input 
                                type="text"
                                autoFocus
                                placeholder="Topic name..."
                                value={newTopicName}
                                onChange={(e) => setNewTopicName(e.target.value)}
                                className="w-24 text-xs px-2 py-1.5 bg-white dark:bg-neutral-800 border border-blue-300 dark:border-blue-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"    
                            />
                            <button 
                                type="submit" 
                                disabled={isCreatingLoading || !newTopicName.trim()}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-2 py-1.5 rounded-md disabled:opacity-50"
                            >
                                {isCreatingLoading ? '...' : 'Add'}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setIsCreating(false)}
                                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1"
                            >
                                <X size={14} />
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                {!selectedTag && !searchQuery ? (
                    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
                        <div className="flex flex-wrap gap-2">
                            {tags.length === 0 && (
                                <p className="text-xs text-neutral-400 italic w-full text-center py-4">No topics yet. Create one to get started.</p>
                            )}
                            {tags.map((tag: any) => (
                                <div
                                    key={tag.id}
                                    onClick={() => handleTagClick(tag.name)}
                                    className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs transition-all cursor-pointer border border-transparent hover:brightness-110"
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
                                        title={confirmDelete === tag.id ? "Click again to delete" : "Delete topic"}
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
                                {selectedTag ? (
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                                        #{selectedTag}
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                                        Search: "{searchQuery}"
                                    </span>
                                )}
                                <span className="text-xs text-neutral-400">
                                    {loading ? 'Searching...' : `${searchResults.length} results`}
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedTag(null);
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                                className="text-xs text-neutral-400 hover:text-neutral-600"
                            >
                                <X size={14} /> Clear
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
                            {loading ? (
                                <div className="p-8 text-center text-xs text-neutral-400">Loading occurrences...</div>
                            ) : searchResults.length === 0 ? (
                                <div className="p-8 text-center text-xs text-neutral-400">No content found.</div>
                            ) : (
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {searchResults.map((item, idx) => (
                                        <div key={`${item.id}-${idx}`} className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">
                                                    {format(new Date(item.date), 'MMM d')} • {item.type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-mono whitespace-pre-wrap break-words">
                                                {selectedTag ? (
                                                    item.text.split(new RegExp(`(#${selectedTag})`, 'gi')).map((part: string, i: number) => (
                                                        part.toLowerCase() === `#${selectedTag.toLowerCase()}` ? (
                                                            <span key={i} className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 rounded px-0.5">{part}</span>
                                                        ) : (
                                                            part
                                                        )
                                                    ))
                                                ) : (
                                                    // Highlight search query
                                                    item.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part: string, i: number) => (
                                                        part.toLowerCase() === searchQuery.toLowerCase() ? (
                                                            <span key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-100 font-medium rounded px-0.5">{part}</span>
                                                        ) : (
                                                            part
                                                        )
                                                    ))
                                                )}
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
