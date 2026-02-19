'use client';

import { Tag } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

export default function TagFilterBar({ tags }: { tags: Tag[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedTagIds = searchParams.get('tags')?.split(',').filter(Boolean) || [];

    const toggleTag = (tagId: string) => {
        const newSelected = selectedTagIds.includes(tagId)
            ? selectedTagIds.filter(id => id !== tagId)
            : [...selectedTagIds, tagId];

        const params = new URLSearchParams(searchParams);
        if (newSelected.length > 0) {
            params.set('tags', newSelected.join(','));
        } else {
            params.delete('tags');
        }
        router.replace(`/?${params.toString()}`);
    };

    const clearFilters = () => {
        const params = new URLSearchParams(searchParams);
        params.delete('tags');
        router.replace(`/?${params.toString()}`);
    };

    if (tags.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mb-4">
            {/* Filter Label or Icon? */}
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-widest py-1">Filters</span>

            {tags.map(tag => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                    <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                            "text-[10px] px-2 py-1 rounded-full border transition-all flex items-center gap-1",
                            isSelected
                                ? "bg-neutral-800 text-white border-neutral-800 dark:bg-white dark:text-black dark:border-white"
                                : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-700"
                        )}
                    >
                        {tag.name}
                    </button>
                );
            })}

            {selectedTagIds.length > 0 && (
                <button
                    onClick={clearFilters}
                    className="text-[10px] text-red-500 hover:text-red-600 px-2 py-1 flex items-center gap-1"
                >
                    <X size={12} /> Clear
                </button>
            )}
        </div>
    );
}
