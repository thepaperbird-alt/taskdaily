import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MediaItem } from '@/actions/watchlist';
import { cn } from '@/lib/utils';
import { Film, Tv, GripVertical, Edit2, ArrowRight, ArrowLeft, Gamepad2, ShoppingBag, Trash2, Plane, Book } from 'lucide-react';

export function SortableMediaCard({ item, isOverlay = false, onEdit, onDelete, onMoveRight, onMoveLeft }: { item: MediaItem, isOverlay?: boolean, onEdit?: () => void, onDelete?: () => void, onMoveRight?: () => void, onMoveLeft?: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { status: item.status }});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = item.type === 'movie' ? Film : item.type === 'game' ? Gamepad2 : item.type === 'gadget' ? ShoppingBag : item.type === 'travel' ? Plane : item.type === 'book' ? Book : Tv;
  
  const bgColors: Record<string, string> = {
      'movie': 'border-l-pink-400 bg-pink-50/50 dark:bg-pink-950/20',
      'tv': 'border-l-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/20',
      'game': 'border-l-purple-400 bg-purple-50/50 dark:bg-purple-950/20',
      'gadget': 'border-l-teal-400 bg-teal-50/50 dark:bg-teal-950/20',
      'travel': 'border-l-sky-400 bg-sky-50/50 dark:bg-sky-950/20',
      'book': 'border-l-orange-400 bg-orange-50/50 dark:bg-orange-950/20'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-800 bg-white dark:bg-black p-2.5 flex gap-2 group transition-all font-mono",
        isDragging && !isOverlay ? "opacity-30 border-neutral-400 dark:border-neutral-700" : "opacity-100",
        isOverlay ? "shadow-xl border-solid border-neutral-500 scale-105 z-50 cursor-grabbing" : "shadow-sm"
      )}
    >
        {/* Drag Handle */}
        <div 
            className="flex items-center justify-center cursor-grab active:cursor-grabbing text-neutral-300 dark:text-neutral-700 hover:text-neutral-500 dark:hover:text-neutral-400 transition-colors"
            {...attributes}
            {...listeners}
        >
            <GripVertical size={14} />
        </div>

        {/* Content Block */}
        <div 
            className={cn(
                "flex-1 flex flex-col justify-center rounded-lg border-l-4 p-2 gap-1 relative",
                bgColors[item.type]
            )}
        >
            <div className="flex items-start justify-between gap-2 pr-6">
                <h3 className="font-bold text-xs text-neutral-900 dark:text-white leading-tight flex-1 tracking-tight">{item.title}</h3>
                <Icon size={12} className="text-neutral-500 dark:text-neutral-400 shrink-0 mt-0.5" />
            </div>
            
            {item.summary && (
                <p className="text-[10px] text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed mt-0.5 max-w-[90%]">
                    {item.summary}
                </p>
            )}

            <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                {item.platform && (
                    <span className="text-[9px] uppercase font-bold tracking-wider bg-white/80 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 px-1 py-0.5 rounded shadow-sm border border-neutral-200 dark:border-neutral-800">
                        {item.platform}
                    </span>
                )}
                {item.type === 'tv' && item.season && (
                    <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-600 dark:text-neutral-400 bg-white/80 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-1 py-0.5 rounded">
                        {item.season}
                    </span>
                )}
                {item.medium && (
                    <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-600 dark:text-neutral-400 bg-white/80 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-1 py-0.5 rounded">
                        {item.medium}
                    </span>
                )}
                <div className="ml-auto md:hidden flex items-center gap-1">
                    {onMoveLeft && (
                        <button 
                            className="text-[9px] uppercase font-bold tracking-wider bg-black dark:bg-neutral-800 text-white px-2 py-1 rounded shadow-sm border border-neutral-800 dark:border-neutral-700 flex items-center gap-1 active:scale-95 transition-transform"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onMoveLeft();
                            }}
                        >
                            <ArrowLeft size={10} />
                        </button>
                    )}
                    {onMoveRight && (
                        <button 
                            className="text-[9px] uppercase font-bold tracking-wider bg-black dark:bg-neutral-800 text-white px-2 py-1 rounded shadow-sm border border-neutral-800 dark:border-neutral-700 flex items-center gap-1 active:scale-95 transition-transform"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onMoveRight();
                            }}
                        >
                            Move <ArrowRight size={10} />
                        </button>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button 
                    className="p-1 text-red-400 hover:text-white hover:bg-red-500 rounded transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Delete this item?')) {
                            onDelete?.();
                        }
                    }}
                >
                    <Trash2 size={12} />
                </button>
                <button 
                    className="p-1 text-neutral-400 hover:text-black dark:hover:text-white hover:bg-white/50 dark:hover:bg-neutral-800 rounded transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.();
                    }}
                >
                    <Edit2 size={12} />
                </button>
            </div>
        </div>
    </div>
  );
}
