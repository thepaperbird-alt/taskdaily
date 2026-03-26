'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ThoughtItem, addThought, updateThought, deleteThought } from '@/actions/thoughts';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import Masonry from 'react-masonry-css';
import { format } from 'date-fns';

function adjustHeight(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

const bgColors = [
    'border-l-pink-400 bg-pink-50',
    'border-l-green-400 bg-green-50',
    'border-l-yellow-400 bg-yellow-50/70',
    'border-l-purple-400 bg-purple-50',
    'border-l-blue-400 bg-blue-50',
    'border-l-orange-400 bg-orange-50',
    'border-l-cyan-400 bg-cyan-50',
    'border-l-rose-400 bg-rose-50',
    'border-l-amber-400 bg-amber-50',
    'border-l-indigo-400 bg-indigo-50',
    'border-l-teal-400 bg-teal-50',
    'border-l-lime-400 bg-lime-50'
];

const selectableColors = bgColors.slice(0, 6);

function getColorClass(thought: ThoughtItem) {
    if (thought.color) return thought.color;
    
    const id = thought.id;
    if (id.startsWith('temp-')) {
        // For new items without color, pick a truly random color from the list
        const randomIndex = Math.floor(Math.random() * bgColors.length);
        return bgColors[randomIndex];
    }
    // For existing items, use a better hash to distribute colors
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
    }
    return bgColors[Math.abs(hash) % bgColors.length];
}

export default function ThoughtsClient({ initialThoughts }: { initialThoughts: ThoughtItem[] }) {
    const [thoughts, setThoughts] = useState<ThoughtItem[]>(initialThoughts);
    const [isAdding, setIsAdding] = useState(false);
    const [newThoughtStr, setNewThoughtStr] = useState('');
    const [selectedColor, setSelectedColor] = useState<string>(selectableColors[0]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editStr, setEditStr] = useState('');
    const [editColor, setEditColor] = useState<string | null>(null);
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
            color: selectedColor,
            order_index: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        setThoughts(prev => [newThought, ...prev]);
        setIsAdding(false);
        setNewThoughtStr('');
        setSelectedColor(selectableColors[0]);

        try {
            await addThought(newThought.content, selectedColor);
        } catch (error) {
            console.error(error);
            // Revert on error could be implemented here
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editStr.trim()) return;

        setThoughts(prev => prev.map(t => t.id === id ? { ...t, content: editStr.trim(), color: editColor || t.color } : t));
        setEditingId(null);
        setEditColor(null);

        try {
            await updateThought(id, { content: editStr.trim(), color: editColor || undefined });
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
            <div className="flex items-center justify-end mb-4 md:mb-6 shrink-0">
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
                        <div className="relative rounded-xl border-2 border-dashed border-neutral-300 bg-white dark:bg-neutral-900 p-2.5 flex flex-col gap-2 mb-4 font-mono shadow-sm">
                            <div className={`flex-1 flex flex-col justify-center rounded-lg border-l-4 p-3 gap-1 relative ${selectedColor} dark:!bg-neutral-800 dark:border-l-neutral-600`}>
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
                                            setSelectedColor(selectableColors[0]);
                                        }
                                    }}
                                    placeholder="What's on your mind?"
                                    className="w-full bg-transparent border-none focus:ring-0 resize-none text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 !outline-none font-bold text-xs leading-tight tracking-tight p-0"
                                    rows={2}
                                />
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex gap-1.5">
                                        {selectableColors.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setSelectedColor(color)}
                                                className={`w-4 h-4 rounded-full border border-neutral-300 transition-transform hover:scale-110 ${color.split(' ')[0].replace('border-l', 'bg')} ${selectedColor === color ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors bg-white/50 rounded-md" onClick={() => {
                                            setIsAdding(false);
                                            setNewThoughtStr('');
                                            setSelectedColor(selectableColors[0]);
                                        }}>
                                            <X size={14} />
                                        </button>
                                        <button className="p-1.5 text-blue-600 hover:text-blue-700 transition-colors bg-white/50 rounded-md" onClick={handleAdd}>
                                            <Check size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {thoughts.map(thought => (
                        <div key={thought.id} className="relative rounded-xl border-2 border-dashed border-neutral-300 bg-white dark:bg-neutral-900 p-2.5 flex flex-col gap-2 group transition-all font-mono shadow-sm hover:shadow-md mb-4">
                            <div className={`flex-1 flex flex-col justify-center rounded-lg border-l-4 p-3 gap-1 relative ${getColorClass(thought)} dark:!bg-neutral-800 dark:border-l-neutral-600`}>
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
                                            className="w-full bg-transparent border-none focus:ring-0 resize-none text-neutral-800 dark:text-neutral-100 !outline-none font-bold text-xs leading-tight tracking-tight p-0"
                                            rows={2}
                                        />
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex gap-1.5">
                                                {selectableColors.map((color) => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setEditColor(color)}
                                                        className={`w-4 h-4 rounded-full border border-neutral-300 transition-transform hover:scale-110 ${color.split(' ')[0].replace('border-l', 'bg')} ${(editColor || thought.color) === color ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors bg-white/50 rounded-md" onClick={() => {
                                                    setEditingId(null);
                                                    setEditColor(null);
                                                }}>
                                                    <X size={14} />
                                                </button>
                                                <button className="p-1.5 text-blue-600 hover:text-blue-700 transition-colors bg-white/50 rounded-md" onClick={() => handleUpdate(thought.id)}>
                                                    <Check size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div 
                                            className="text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap cursor-pointer font-bold text-xs leading-tight tracking-tight mb-2"
                                            onClick={() => {
                                                setEditingId(thought.id);
                                                setEditStr(thought.content);
                                                setEditColor(thought.color || null);
                                            }}
                                        >
                                            {thought.content}
                                        </div>
                                        <div className="text-[10px] text-neutral-400 font-medium">
                                            {format(new Date(thought.created_at), 'MMM d, h:mm a')}
                                        </div>
                                        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm p-1 rounded-lg">
                                            <button 
                                                onClick={() => {
                                                    setEditingId(thought.id);
                                                    setEditStr(thought.content);
                                                    setEditColor(thought.color || null);
                                                }}
                                                className="p-1 text-neutral-400 hover:text-blue-600 transition-colors rounded hover:bg-white/50"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(thought.id)}
                                                className="p-1 text-red-400 hover:text-white hover:bg-red-500 rounded transition-colors"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </Masonry>
            </div>
        </div>
    );
}
