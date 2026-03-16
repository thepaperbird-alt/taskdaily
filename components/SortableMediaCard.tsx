import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MediaItem } from '@/actions/watchlist';
import { cn } from '@/lib/utils';
import { Film, Tv, GripVertical, Edit2, ArrowRight } from 'lucide-react';

export function SortableMediaCard({ item, isOverlay = false, onEdit, onMove }: { item: MediaItem, isOverlay?: boolean, onEdit?: () => void, onMove?: () => void }) {
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

  const Icon = item.type === 'movie' ? Film : Tv;
  
  const bgColors = {
      'movie': 'border-l-pink-400 bg-pink-50/50',
      'tv': 'border-l-yellow-400 bg-yellow-50/50'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative rounded-xl border-2 border-dashed border-neutral-300 bg-white p-2.5 flex gap-2 group transition-all font-mono",
        isDragging && !isOverlay ? "opacity-30 border-neutral-400" : "opacity-100",
        isOverlay ? "shadow-xl border-solid border-neutral-500 scale-105 z-50 cursor-grabbing" : "shadow-sm"
      )}
    >
        {/* Drag Handle */}
        <div 
            className="flex items-center justify-center cursor-grab active:cursor-grabbing text-neutral-300 hover:text-neutral-500 transition-colors"
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
                <h3 className="font-bold text-xs text-neutral-900 leading-tight flex-1 tracking-tight">{item.title}</h3>
                <Icon size={12} className="text-neutral-500 shrink-0 mt-0.5" />
            </div>
            
            {item.summary && (
                <p className="text-[10px] text-neutral-600 line-clamp-2 leading-relaxed mt-0.5 max-w-[90%]">
                    {item.summary}
                </p>
            )}

            <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                {item.platform && (
                    <span className="text-[9px] uppercase font-bold tracking-wider bg-white/80 text-neutral-800 px-1 py-0.5 rounded shadow-sm border border-neutral-200">
                        {item.platform}
                    </span>
                )}
                {item.type === 'tv' && item.season && (
                    <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-600 bg-white/80 border border-neutral-200 px-1 py-0.5 rounded">
                        {item.season}
                    </span>
                )}
                <div className="ml-auto md:hidden flex items-center">
                    {onMove && (
                        <button 
                            className="text-[9px] uppercase font-bold tracking-wider bg-black text-white px-2 py-1 rounded shadow-sm border border-neutral-800 flex items-center gap-1 active:scale-95 transition-transform"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onMove();
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
                    className="p-1 text-neutral-400 hover:text-black hover:bg-white/50 rounded transition-colors"
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
