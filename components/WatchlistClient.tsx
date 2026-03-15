'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { MediaItem, updateMediaOrder, updateMediaItem } from '@/actions/watchlist';
import { cn } from '@/lib/utils';
import { Plus, Tv, Film, MoreVertical, Edit2 } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableMediaCard } from './SortableMediaCard';
import AddMediaModal from './AddMediaModal';

const COLUMNS = [
  { id: 'to_watch', title: 'To Watch', color: 'bg-pink-100/50', border: 'border-pink-200' },
  { id: 'current', title: 'Current Watch', color: 'bg-yellow-100/50', border: 'border-yellow-200' },
  { id: 'completed', title: 'Completed', color: 'bg-green-100/50', border: 'border-green-200' }
];

function DroppableColumn({ id, children, className }: { id: string, children: React.ReactNode, className: string }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef} id={id} className={className}>{children}</div>;
}

export default function WatchlistClient({ initialMedia }: { initialMedia: MediaItem[] }) {
  const [items, setItems] = useState<MediaItem[]>(initialMedia);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'to_watch' | 'current' | 'completed'>('to_watch');
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addStatus, setAddStatus] = useState<'to_watch' | 'current' | 'completed'>('to_watch');
  const [editItem, setEditItem] = useState<MediaItem | null>(null);

  useEffect(() => {
    setItems(initialMedia);
  }, [initialMedia]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getItemsByColumn = (columnId: string) => {
    return items
      .filter((i) => i.status === columnId)
      .filter((i) => typeFilter === 'all' || i.type === typeFilter)
      .sort((a, b) => a.order_index - b.order_index);
  };

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    // ... basic logic to move item between columns while dragging ...
    const activeId = active.id as string;
    const overId = over.id as string;

    const activeItem = items.find(i => i.id === activeId);
    const overItem = items.find(i => i.id === overId);

    if (!activeItem) return;

    const activeContainer = activeItem.status;
    const overContainer = overItem ? overItem.status : COLUMNS.find(c => c.id === overId)?.id;

    if (!overContainer || activeContainer === overContainer) {
      return;
    }

    setItems((prev) => {
      const activeItems = prev.filter(i => i.status === activeContainer);
      const overItems = prev.filter(i => i.status === overContainer);
      
      const activeIndex = activeItems.findIndex(i => i.id === activeId);
      const overIndex = overItem ? overItems.findIndex(i => i.id === overId) : 0;

      const newIndex = overIndex >= 0 ? overIndex : overItems.length;

      const updatedItem = { ...activeItem, status: overContainer as any };
      
      return [
        ...prev.filter(i => i.id !== activeId),
        updatedItem
      ];
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeItem = items.find(i => i.id === activeId);
    if (!activeItem) return;

    const overContainer = items.find(i => i.id === overId)?.status || COLUMNS.find(c => c.id === overId)?.id;
    
    if (!overContainer) return;

    let newItems = [...items];
    const containerItems = newItems.filter(i => i.status === overContainer).sort((a,b) => a.order_index - b.order_index);
    
    const oldIndex = containerItems.findIndex(i => i.id === activeId);
    const newIndex = containerItems.findIndex(i => i.id === overId);

    if (oldIndex !== newIndex) {
      const reorderedContainerItems = arrayMove(containerItems, oldIndex, newIndex);
      
      // Update items array locally
      const itemsWithoutContainer = newItems.filter(i => i.status !== overContainer);
      newItems = [...itemsWithoutContainer, ...reorderedContainerItems.map((item, index) => ({
          ...item,
          order_index: index * 1024
      }))];
      
      setItems(newItems);

      // Persist to server
      const updates = reorderedContainerItems.map((item, index) => ({
          id: item.id,
          status: overContainer as any,
          order_index: index * 1024
      }));
      
      await updateMediaOrder(updates);
    } else if (activeItem.status !== overContainer) {
       // Just dropped into empty container
       const updatedItem = { ...activeItem, status: overContainer as any, order_index: 0 };
       setItems((prev) => [...prev.filter(i => i.id !== activeId), updatedItem]);
       await updateMediaItem(activeId, { status: overContainer as any, order_index: 0 });
    }
  };

  const openAddModal = (status: 'to_watch' | 'current' | 'completed') => {
      setAddStatus(status);
      setEditItem(null);
      setIsAddModalOpen(true);
  };

  const openEditModal = (item: MediaItem) => {
      setEditItem(item);
      setAddStatus(item.status);
      setIsAddModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden">
        {/* Filters & Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
            {/* Mobile Tab Nav within Watchlist */}
            <div className="flex md:hidden bg-neutral-200/50 p-1 rounded-lg w-full max-w-sm mx-auto">
               {COLUMNS.map(col => (
                   <button 
                    key={col.id}
                    onClick={() => setActiveTab(col.id as any)}
                    className={cn(
                        "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all touch-manipulation",
                        activeTab === col.id ? "bg-white text-black shadow-sm" : "text-neutral-500"
                    )}
                   >
                    {col.title}
                   </button>
               ))}
            </div>

            <div className="hidden md:flex gap-2">
                <button onClick={() => setTypeFilter('all')} className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-colors", typeFilter === 'all' ? "bg-black text-white" : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50")}>All</button>
                <button onClick={() => setTypeFilter('movie')} className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1", typeFilter === 'movie' ? "bg-black text-white" : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50")}><Film size={14}/> Movies</button>
                <button onClick={() => setTypeFilter('tv')} className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1", typeFilter === 'tv' ? "bg-black text-white" : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50")}><Tv size={14}/> Shows</button>
            </div>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-hidden">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-4 md:gap-6 h-full w-full">
                    {COLUMNS.map((col) => {
                        const colItems = getItemsByColumn(col.id);
                        const isMobileHidden = activeTab !== col.id;
                        
                        return (
                        <DroppableColumn 
                            key={col.id} 
                            id={col.id}
                            className={cn(
                                "flex-1 flex flex-col h-full rounded-[2rem] border-2 overflow-hidden",
                                col.color, col.border,
                                isMobileHidden ? "hidden md:flex" : "flex"
                            )}
                        >
                            <div className={cn("p-4 md:p-5 border-b-2 border-dashed flex items-center justify-between shrink-0", col.border)}>
                                <h2 className="text-sm md:text-base font-bold text-neutral-800">{col.title} <span className="text-neutral-400 font-normal ml-1">({colItems.length})</span></h2>
                                <button 
                                    onClick={() => openAddModal(col.id as any)}
                                    className="p-1.5 rounded-full hover:bg-white/50 bg-white/30 text-neutral-700 transition-colors"
                                >
                                    <Plus size={16} strokeWidth={3} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
                                <SortableContext id={col.id} items={colItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                    {colItems.map((item) => (
                                        <SortableMediaCard key={item.id} item={item} onEdit={() => openEditModal(item)} />
                                    ))}
                                    {colItems.length === 0 && (
                                        <div className="h-24 rounded-xl border-2 border-dashed border-neutral-200 flex items-center justify-center text-xs text-neutral-400 italic">
                                            Drop items here
                                        </div>
                                    )}
                                </SortableContext>
                            </div>
                        </DroppableColumn>
                    )})}
                </div>

                <DragOverlay>
                    {activeItem ? <SortableMediaCard item={activeItem} isOverlay /> : null}
                </DragOverlay>
            </DndContext>
        </div>
        
        {isAddModalOpen && (
            <AddMediaModal 
                status={addStatus} 
                onClose={() => { setIsAddModalOpen(false); setEditItem(null); }} 
                editItem={editItem}
            />
        )}
    </div>
  );
}
