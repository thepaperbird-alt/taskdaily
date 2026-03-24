'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ThoughtItem, addThought, updateThought, deleteThought } from '@/actions/thoughts';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import Masonry from 'react-masonry-css';

function adjustHeight(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

export default function ThoughtsClient({ initialThoughts }: { initialThoughts: ThoughtItem[] }) {
    const [thoughts, setThoughts] = useState<ThoughtItem[]>(initialThoughts);
    const [isAdding, setIsAdding] = useState(false);
    const [newThoughtStr, setNewThoughtStr] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editStr, setEditStr] = useState('');
    const newTextareaRef = useRef<HTMLTextAreaElement>(null);
    const editTextareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setThoughts(initialThoughts);
    }, [initialThoughts]);

    useEffect(() => {
        if (isAdding && newTextareaRef.current) {
            newTextareaRef.current.focus();
            adjustHeight(newTextareaRef.current);
        }
    }, [isAdding]);

    useEffect(() => {
        if (editingId && editTextareaRef.current) {
            editTextareaRef.current.focus();
            adjustHeight(editTextareaRef.current);
        }
    }, [editingId]);

    const handleAdd = async () => {
        if (!newThoughtStr.trim()) {
            setIsAdding(false);
            return;
        }

        const tempId = `temp-${Date.now()}`;
        const newThought: ThoughtItem = {
            id: tempId,
            user_id: 'temp',
            content: newThoughtStr.trim(),
            order_index: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        setThoughts(prev => [newThought, ...prev]);
        setIsAdding(false);
        setNewThoughtStr('');

        try {
            await addThought(newThought.content);
        } catch (error) {
            console.error(error);
            // Revert on error could be implemented here
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editStr.trim()) return;

        setThoughts(prev => prev.map(t => t.id === id ? { ...t, content: editStr.trim() } : t));
        setEditingId(null);

        try {
            await updateThought(id, { content: editStr.trim() });
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        setThoughts(prev => prev.filter(t => t.id !== id));
        try {
            await deleteThought(id);
        } catch (error) {
            console.error(error);
        }
    };

    const breakpointColumnsObj = {
        default: 4,
        1536: 4,
        1280: 3,
        1024: 3,
        768: 2,
        640: 1
    };

    return (
        <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
                <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white">Thoughts</h1>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus size={16} /> <span className="hidden sm:inline">Add Thought</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto w-full pb-24">
                <Masonry
                    breakpointCols={breakpointColumnsObj}
                    className="flex w-auto -ml-4"
                    columnClassName="pl-4 bg-clip-padding"
                >
                    {isAdding && (
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-4 mb-4 relative flex flex-col group transition-all">
                            <textarea
                                ref={newTextareaRef}
                                value={newThoughtStr}
                                onChange={(e) => {
                                    setNewThoughtStr(e.target.value);
                                    adjustHeight(e.target);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAdd();
                                    }
                                    if (e.key === 'Escape') {
                                        setIsAdding(false);
                                        setNewThoughtStr('');
                                    }
                                }}
                                placeholder="What's on your mind?"
                                className="w-full bg-transparent border-none focus:ring-0 resize-none text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400"
                                rows={2}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors" onClick={() => setIsAdding(false)}>
                                    <X size={16} />
                                </button>
                                <button className="p-1.5 text-blue-600 hover:text-blue-700 transition-colors" onClick={handleAdd}>
                                    <Check size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {thoughts.map(thought => (
                        <div key={thought.id} className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-4 mb-4 relative flex flex-col group transition-all hover:shadow-md">
                            {editingId === thought.id ? (
                                <>
                                    <textarea
                                        ref={editTextareaRef}
                                        value={editStr}
                                        onChange={(e) => {
                                            setEditStr(e.target.value);
                                            adjustHeight(e.target);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleUpdate(thought.id);
                                            }
                                            if (e.key === 'Escape') {
                                                setEditingId(null);
                                            }
                                        }}
                                        className="w-full bg-transparent border-none focus:ring-0 resize-none text-neutral-800 dark:text-neutral-100"
                                        rows={2}
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors" onClick={() => setEditingId(null)}>
                                            <X size={16} />
                                        </button>
                                        <button className="p-1.5 text-blue-600 hover:text-blue-700 transition-colors" onClick={() => handleUpdate(thought.id)}>
                                            <Check size={16} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div 
                                        className="text-neutral-800 dark:text-neutral-100 whitespace-pre-wrap cursor-pointer"
                                        onClick={() => {
                                            setEditingId(thought.id);
                                            setEditStr(thought.content);
                                        }}
                                    >
                                        {thought.content}
                                    </div>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm p-1 rounded-lg">
                                        <button 
                                            onClick={() => {
                                                setEditingId(thought.id);
                                                setEditStr(thought.content);
                                            }}
                                            className="p-1.5 text-neutral-400 hover:text-blue-600 transition-colors rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(thought.id)}
                                            className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </Masonry>
            </div>
        </div>
    );
}
