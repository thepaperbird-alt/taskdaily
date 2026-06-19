'use client';

import { useState, useEffect } from 'react';
import { Clock, Trash2, Edit3, Check, X, Info, Plus } from 'lucide-react';
import { addRoutine, updateRoutine, deleteRoutine } from '@/actions/routines';
import { cn } from '@/lib/utils';

// DnD Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Routine {
    id: string;
    title: string;
    time: string;
    days: string[];
    created_at: string;
}

interface RoutineColumnClientProps {
    initialRoutines: Routine[];
    isDbMissing: boolean;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_SHORT: Record<string, string> = {
    'Monday': 'Mon',
    'Tuesday': 'Tue',
    'Wednesday': 'Wed',
    'Thursday': 'Thu',
    'Friday': 'Fri',
    'Saturday': 'Sat',
    'Sunday': 'Sun'
};

// Wrapper for Sortable item
interface SortableRoutineItemProps {
    routine: Routine;
    disabled: boolean;
    children: React.ReactNode;
}

function SortableRoutineItem({ routine, disabled, children }: SortableRoutineItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: routine.id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 10 : 1,
        position: 'relative' as const,
        touchAction: 'none' as const,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
}

const getEarliestDayIndex = (days: string[]) => {
    if (!days || days.length === 0) return 999;
    let minIndex = 999;
    days.forEach(day => {
        const idx = DAYS_OF_WEEK.indexOf(day);
        if (idx !== -1 && idx < minIndex) {
            minIndex = idx;
        }
    });
    return minIndex;
};

const sortRoutinesByDay = (list: Routine[]): Routine[] => {
    return [...list].sort((a, b) => {
        const dayA = getEarliestDayIndex(a.days);
        const dayB = getEarliestDayIndex(b.days);
        if (dayA !== dayB) return dayA - dayB;
        // Secondary sort by time
        return (a.time || '').localeCompare(b.time || '');
    });
};

export default function RoutineColumnClient({ initialRoutines, isDbMissing }: RoutineColumnClientProps) {
    const [routines, setRoutines] = useState<Routine[]>(initialRoutines);
    const [loading, setLoading] = useState(false);

    // Add form states
    const [newTitle, setNewTitle] = useState('');
    const [newTime, setNewTime] = useState('09:00');
    const [selectedDays, setSelectedDays] = useState<string[]>([]);

    // Edit form states
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editTime, setEditTime] = useState('');
    const [editDays, setEditDays] = useState<string[]>([]);

    const [isDesktop, setIsDesktop] = useState(false);

    // Sync order and window resizing
    useEffect(() => {
        setIsDesktop(window.innerWidth >= 768);
        const handleResize = () => setIsDesktop(window.innerWidth >= 768);
        window.addEventListener('resize', handleResize);

        // Determine the base routines list
        let baseRoutines = initialRoutines;
        if (isDbMissing) {
            const local = localStorage.getItem('td_routines_fallback');
            if (local) {
                try {
                    baseRoutines = JSON.parse(local);
                } catch (e) {
                    console.error('Failed to parse local routines', e);
                }
            }
        }

        const savedOrder = localStorage.getItem('routine_order');
        if (savedOrder) {
            try {
                const orderArray = JSON.parse(savedOrder) as string[];
                const orderMap = new Map();
                orderArray.forEach((id, index) => orderMap.set(id, index));

                const sorted = [...baseRoutines].sort((a, b) => {
                    const indexA = orderMap.has(a.id) ? orderMap.get(a.id) : -1;
                    const indexB = orderMap.has(b.id) ? orderMap.get(b.id) : -1;
                    if (indexA !== indexB) return indexA - indexB;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // fallback to newest first
                });
                setRoutines(sorted);
            } catch (e) {
                setRoutines(baseRoutines);
            }
        } else {
            // Sort by day of week by default if no saved order
            const sorted = sortRoutinesByDay(baseRoutines);
            setRoutines(sorted);
        }

        return () => window.removeEventListener('resize', handleResize);
    }, [initialRoutines, isDbMissing]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px drag to activate
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setRoutines((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);

                const newArray = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem('routine_order', JSON.stringify(newArray.map(r => r.id)));
                
                if (isDbMissing) {
                    localStorage.setItem('td_routines_fallback', JSON.stringify(newArray));
                }
                return newArray;
            });
        }
    };

    const saveLocal = (updatedRoutines: Routine[]) => {
        setRoutines(updatedRoutines);
        localStorage.setItem('td_routines_fallback', JSON.stringify(updatedRoutines));
    };

    const toggleDayInAddForm = (day: string) => {
        setSelectedDays(prev => 
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const toggleDayInEditForm = (day: string) => {
        setEditDays(prev => 
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newTime || selectedDays.length === 0) return;

        setLoading(true);
        if (isDbMissing) {
            const newRoutine: Routine = {
                id: crypto.randomUUID(),
                title: newTitle.trim(),
                time: newTime,
                days: selectedDays,
                created_at: new Date().toISOString()
            };
            const updated = [newRoutine, ...routines];
            saveLocal(updated);
            setNewTitle('');
            setNewTime('09:00');
            setSelectedDays([]);
            setLoading(false);
        } else {
            try {
                const result = await addRoutine(newTitle.trim(), newTime, selectedDays);
                if (result.data) {
                    setRoutines(prev => [result.data, ...prev]);
                    setNewTitle('');
                    setNewTime('09:00');
                    setSelectedDays([]);
                }
            } catch (err) {
                console.error('Failed to add routine via server action:', err);
            } finally {
                setLoading(false);
            }
        }
    };

    const startEdit = (routine: Routine) => {
        setEditingId(routine.id);
        setEditTitle(routine.title);
        setEditTime(routine.time);
        setEditDays(routine.days);
    };

    const handleSaveEdit = async (id: string) => {
        if (!editTitle.trim() || !editTime || editDays.length === 0) return;

        setLoading(true);
        if (isDbMissing) {
            const updated = routines.map(r => r.id === id ? {
                ...r,
                title: editTitle.trim(),
                time: editTime,
                days: editDays
            } : r);
            saveLocal(updated);
            setEditingId(null);
            setLoading(false);
        } else {
            try {
                await updateRoutine(id, { title: editTitle.trim(), time: editTime, days: editDays });
                setRoutines(prev => prev.map(r => r.id === id ? {
                    ...r,
                    title: editTitle.trim(),
                    time: editTime,
                    days: editDays
                } : r));
                setEditingId(null);
            } catch (err) {
                console.error('Failed to update routine:', err);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this routine?')) return;

        setLoading(true);
        if (isDbMissing) {
            const updated = routines.filter(r => r.id !== id);
            saveLocal(updated);
            setLoading(false);
        } else {
            try {
                await deleteRoutine(id);
                setRoutines(prev => prev.filter(r => r.id !== id));
            } catch (err) {
                console.error('Failed to delete routine:', err);
            } finally {
                setLoading(false);
            }
        }
    };

    const formatDisplayTime = (timeStr: string): string => {
        if (!timeStr) return '';
        const [hoursStr, minutesStr] = timeStr.split(':');
        const hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);
        if (isNaN(hours) || isNaN(minutes)) return timeStr;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        const minStr = minutes.toString().padStart(2, '0');
        return `${hours12}:${minStr} ${ampm}`;
    };

    const formatDisplayDays = (daysList: string[]): string => {
        if (!daysList || daysList.length === 0) return 'No days selected';
        if (daysList.length === 7) return 'Every day';
        
        const hasWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].every(d => daysList.includes(d));
        const hasWeekends = ['Saturday', 'Sunday'].every(d => daysList.includes(d));
        
        if (hasWeekdays && daysList.length === 5) return 'Weekdays';
        if (hasWeekends && daysList.length === 2) return 'Weekends';
        
        const ordered = DAYS_OF_WEEK.filter(d => daysList.includes(d));
        return ordered.map(d => DAYS_SHORT[d]).join(', ');
    };

    const displayedRoutines = isDesktop ? routines : sortRoutinesByDay(routines);

    return (
        <div className="h-full flex flex-col">
            {/* Fallback Warning Banner */}
            {isDbMissing && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2 animate-pulse">
                    <Info size={16} className="shrink-0 mt-0.5" />
                    <div>
                        <strong>Using Local Storage Fallback:</strong> Table `td_routines` not found in Supabase. Run the SQL schema in `database_routines.sql` to link it.
                    </div>
                </div>
            )}

            {/* Add Routine Form */}
            <form onSubmit={handleAdd} className="mb-6 space-y-3 bg-neutral-50/50 dark:bg-neutral-800/10 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/50">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Add a new routine..."
                        className="input text-sm flex-1 font-mono"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <input
                        type="time"
                        className="input text-sm w-28 font-mono"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest block">Repeat days</span>
                    <div className="flex justify-between gap-1">
                        {DAYS_OF_WEEK.map(day => {
                            const isSelected = selectedDays.includes(day);
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleDayInAddForm(day)}
                                    className={cn(
                                        "w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all cursor-pointer select-none",
                                        isSelected 
                                            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm" 
                                            : "border border-neutral-200 hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800 text-neutral-500"
                                    )}
                                    title={day}
                                    disabled={loading}
                                >
                                    {DAYS_SHORT[day][0]}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || !newTitle.trim() || selectedDays.length === 0}
                    className="btn btn-primary w-full text-xs py-2 mt-1 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                    <Plus size={14} />
                    Add Routine
                </button>
            </form>

            {/* Routines List */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 pb-20 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
                {displayedRoutines.length === 0 ? (
                    <div className="text-center text-neutral-400 mt-10 text-xs">
                        No routines yet. Create one above!
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={displayedRoutines.map(r => r.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {displayedRoutines.map((routine) => {
                                const isEditing = editingId === routine.id;

                                return (
                                    <SortableRoutineItem
                                        key={routine.id}
                                        routine={routine}
                                        disabled={isEditing || !isDesktop}
                                    >
                                        {isEditing ? (
                                            <div className="p-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl space-y-3 shadow-md transition-all">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        className="input text-sm flex-1 font-mono"
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        required
                                                        disabled={loading}
                                                    />
                                                    <input
                                                        type="time"
                                                        className="input text-sm w-28 font-mono"
                                                        value={editTime}
                                                        onChange={(e) => setEditTime(e.target.value)}
                                                        required
                                                        disabled={loading}
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest block">Repeat days</span>
                                                    <div className="flex justify-between gap-1">
                                                        {DAYS_OF_WEEK.map(day => {
                                                            const isSelected = editDays.includes(day);
                                                            return (
                                                                <button
                                                                    key={day}
                                                                    type="button"
                                                                    onClick={() => toggleDayInEditForm(day)}
                                                                    className={cn(
                                                                        "w-7 h-7 rounded-full text-[10px] font-semibold flex items-center justify-center transition-all cursor-pointer",
                                                                        isSelected 
                                                                            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" 
                                                                            : "border border-neutral-200 hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800 text-neutral-400"
                                                                    )}
                                                                    title={day}
                                                                    disabled={loading}
                                                                >
                                                                    {DAYS_SHORT[day][0]}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingId(null)}
                                                        className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
                                                        disabled={loading}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveEdit(routine.id)}
                                                        disabled={loading || !editTitle.trim() || editDays.length === 0}
                                                        className="p-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity flex items-center justify-center"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="group p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/60 rounded-xl hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex items-start justify-between shadow-sm cursor-grab active:cursor-grabbing">
                                                <div className="space-y-1 min-w-0 flex-1 pr-3">
                                                    <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate font-mono">
                                                        {routine.title}
                                                    </h4>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 dark:text-neutral-400">
                                                        <Clock size={10} className="text-neutral-400" />
                                                        <span>{formatDisplayDays(routine.days)}</span>
                                                        <span className="text-neutral-300 dark:text-neutral-700">•</span>
                                                        <span className="font-semibold text-neutral-600 dark:text-neutral-300">{formatDisplayTime(routine.time)}</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            startEdit(routine);
                                                        }}
                                                        className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                                                        title="Edit Routine"
                                                        disabled={loading}
                                                    >
                                                        <Edit3 size={12} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(routine.id);
                                                        }}
                                                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                        title="Delete Routine"
                                                        disabled={loading}
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </SortableRoutineItem>
                                );
                            })}
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    );
}
