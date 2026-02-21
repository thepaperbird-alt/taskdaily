'use client';

import { useRef, useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { addTask } from '@/actions/tasks';
import TaskItem from './TaskItem';
import { Task } from '@/lib/types';
import { useHashtagAutocomplete } from './useHashtagAutocomplete';
import HashtagDropdown from './HashtagDropdown';

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

// Wrapper for Sortable item
function SortableTaskItem({ task, disabled }: { task: Task, disabled: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 10 : 1,
        position: 'relative' as const,
        touchAction: 'none', // Prevent scrolling issues on touch devices just in case
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskItem task={task} />
        </div>
    );
}

export default function TaskListClient({ tasks, allTags }: { tasks: Task[], allTags?: any[] }) {
    const formRef = useRef<HTMLFormElement>(null);
    const [inputValue, setInputValue] = useState("");
    const [orderedTasks, setOrderedTasks] = useState(tasks);
    const [isDesktop, setIsDesktop] = useState(false);

    // Sync order from local storage
    useEffect(() => {
        setIsDesktop(window.innerWidth >= 768);
        const handleResize = () => setIsDesktop(window.innerWidth >= 768);
        window.addEventListener('resize', handleResize);

        const savedOrder = localStorage.getItem('task_order');
        if (savedOrder) {
            try {
                const orderArray = JSON.parse(savedOrder) as string[];
                const orderMap = new Map();
                orderArray.forEach((id, index) => orderMap.set(id, index));

                const sorted = [...tasks].sort((a, b) => {
                    // Always put completed tasks at the bottom
                    if (a.completed && !b.completed) return 1;
                    if (!a.completed && b.completed) return -1;

                    const indexA = orderMap.has(a.id) ? orderMap.get(a.id) : Infinity;
                    const indexB = orderMap.has(b.id) ? orderMap.get(b.id) : Infinity;
                    if (indexA !== indexB) return indexA - indexB;
                    return 0; // Keep original relative order for new tasks
                });
                setOrderedTasks(sorted);
            } catch (e) {
                // Fallback sort if parsing fails
                setOrderedTasks([...tasks].sort((a, b) => {
                    if (a.completed && !b.completed) return 1;
                    if (!a.completed && b.completed) return -1;
                    return 0;
                }));
            }
        } else {
            setOrderedTasks([...tasks].sort((a, b) => {
                if (a.completed && !b.completed) return 1;
                if (!a.completed && b.completed) return -1;
                return 0;
            }));
        }

        return () => window.removeEventListener('resize', handleResize);
    }, [tasks]);

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
            setOrderedTasks((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);

                const newArray = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem('task_order', JSON.stringify(newArray.map(t => t.id)));
                return newArray;
            });
        }
    };

    // Autocomplete Hook
    const {
        showDropdown,
        filteredTags,
        selectedIndex,
        handleKeyDown,
        handleChange,
        handleSelect,
        selectTag
    } = useHashtagAutocomplete(inputValue, setInputValue, allTags || []);

    const handleSubmit = async (formData: FormData) => {
        await addTask(formData);
        setInputValue("");
        formRef.current?.reset();
    };

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-neutral-800 to-neutral-600 dark:from-neutral-100 dark:to-neutral-400 bg-clip-text text-transparent px-1">Tasks</h2>

            <div className="relative mb-6">
                <form action={handleSubmit} ref={formRef} className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            name="title"
                            type="text"
                            placeholder="Add a new task..."
                            className="input w-full font-mono"
                            required
                            value={inputValue}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            onSelect={handleSelect}
                            autoComplete="off"
                        />
                        <HashtagDropdown
                            isOpen={showDropdown}
                            tags={filteredTags}
                            selectedIndex={selectedIndex}
                            onSelect={selectTag}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary whitespace-nowrap">
                        <Plus size={18} />
                    </button>
                </form>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800 pb-20">
                {orderedTasks.length === 0 ? (
                    <div className="text-center text-neutral-400 mt-10 text-sm">
                        No tasks yet. Add one above!
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={orderedTasks.map(t => t.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {orderedTasks.map((task) => (
                                <SortableTaskItem key={task.id} task={task} disabled={!isDesktop} />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    );
}
