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

function formatDateSafe(dateStr: string | null | undefined) {
    if (!dateStr) return 'Unknown date';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Invalid date';
        return format(date, 'MMM d, h:mm a');
    } catch (err) {
        return 'Date error';
    }
}

const subjects = ["quotes", "to do", "plans", "braindump"] as const;
type Subject = typeof subjects[number];

const subjectColors: Record<Subject, string> = {
    'quotes': 'border-l-pink-400 bg-pink-50',
    'to do': 'border-l-green-400 bg-green-50',
    'plans': 'border-l-yellow-400 bg-yellow-50/70',
    'braindump': 'border-l-purple-400 bg-purple-50',
};

function getColorClass(thought: ThoughtItem) {
    // Priority: 1. check if thought.color is a known subject
    const colorKey = (thought.color || 'braindump') as Subject;
    if (subjectColors[colorKey]) return subjectColors[colorKey];
    
    // 2. check if thought.subject is set (from new getThoughts mapping)
    if (thought.subject && subjectColors[thought.subject]) return subjectColors[thought.subject];

    // 3. Fallback for legacy hex colors or unknown strings
    // If it looks like a hex or doesn't look like a Tailwind class, return default
    if (thought.color?.startsWith('#') || !thought.color?.includes(' ')) {
        return subjectColors['braindump'];
    }

    return thought.color || subjectColors['braindump'];
}

export default function ThoughtsClient({ initialThoughts }: { initialThoughts: ThoughtItem[] }) {
    const [thoughts, setThoughts] = useState<ThoughtItem[]>(initialThoughts);
    const [isAdding, setIsAdding] = useState(false);
    const [newThoughtStr, setNewThoughtStr] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<Subject>('braindump');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editStr, setEditStr] = useState('');
    const [editSubject, setEditSubject] = useState<Subject | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
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
            color: selectedSubject,
            order_index: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        setThoughts(prev => [newThought, ...prev]);
        setIsAdding(false);
        setNewThoughtStr('');
        setSelectedSubject('braindump');

        try {
            const result = await addThought(newThought.content, selectedSubject);
            if (result) {
                setThoughts(prev => prev.map(t => t.id === tempId ? result as ThoughtItem : t));
            }
            setSaveError(null);
        } catch (error: any) {
            console.error('[ThoughtsClient] addThought failed:', error);
            // Revert optimistic update on error
            setThoughts(prev => prev.filter(t => t.id !== tempId));
            setSaveError(error?.message || 'Failed to save thought. Please try again.');
            // Auto-clear error after 6 seconds
            setTimeout(() => setSaveError(null), 6000);
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editStr.trim()) return;

        setThoughts(prev => prev.map(t => t.id === id ? { ...t, content: editStr.trim(), color: editSubject || t.color } : t));
        setEditingId(null);
        setEditSubject(null);

        try {
            await updateThought(id, { content: editStr.trim(), subject: editSubject || undefined });
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
            {saveError && (
                <div className="mb-3 shrink-0 bg-red-50 border border-red-200 text-red-700 text-xs font-mono rounded-lg px-4 py-2 flex items-center justify-between">
                    <span>⚠️ {saveError}</span>
                    <button onClick={() => setSaveError(null)} className="ml-3 text-red-400 hover:text-red-600">✕</button>
                </div>
            )}
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
                            <div className={`flex-1 flex flex-col justify-center rounded-lg border-l-4 p-3 gap-1 relative ${subjectColors[selectedSubject]} dark:!bg-neutral-800 dark:border-l-neutral-600`}>
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
                                            setSelectedSubject('braindump');
                                        }
                                    }}
                                    placeholder="What's on your mind?"
                                    className="w-full bg-transparent border-none focus:ring-0 resize-none text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 !outline-none font-bold text-xs leading-tight tracking-tight p-0"
                                    rows={2}
                                />
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-2">
                                        <select 
                                            value={selectedSubject}
                                            onChange={(e) => setSelectedSubject(e.target.value as Subject)}
                                            className="bg-white/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-0.5 text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 focus:outline-none"
                                        >
                                            {subjects.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors bg-white/50 rounded-md" onClick={() => {
                                            setIsAdding(false);
                                            setNewThoughtStr('');
                                            setSelectedSubject('braindump');
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
                                            <div className="flex items-center gap-2">
                                                <select 
                                                    value={editSubject || (thought.color as Subject) || 'braindump'}
                                                    onChange={(e) => setEditSubject(e.target.value as Subject)}
                                                    className="bg-white/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-0.5 text-[10px] uppercase font-bold text-neutral-600 dark:text-neutral-400 focus:outline-none"
                                                >
                                                    {subjects.map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors bg-white/50 rounded-md" onClick={() => {
                                                    setEditingId(null);
                                                    setEditSubject(null);
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
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] uppercase font-black text-neutral-400/70 tracking-tighter">
                                                {(thought.subject || (thought.color && subjects.includes(thought.color as Subject))) ? (thought.subject || thought.color) : 'thought'}
                                            </span>
                                        </div>
                                        <div 
                                            className="text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap cursor-pointer font-bold text-xs leading-tight tracking-tight mb-2"
                                            onClick={() => {
                                                setEditingId(thought.id);
                                                setEditStr(thought.content);
                                                setEditSubject((thought.color as Subject) || 'braindump');
                                            }}
                                        >
                                            {thought.content}
                                        </div>
                                        <div className="text-[10px] text-neutral-400 font-medium">
                                            {formatDateSafe(thought.created_at)}
                                        </div>
                                        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm p-1 rounded-lg">
                                            <button 
                                                onClick={() => {
                                                    setEditingId(thought.id);
                                                    setEditStr(thought.content);
                                                    setEditSubject((thought.color as Subject) || 'braindump');
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
