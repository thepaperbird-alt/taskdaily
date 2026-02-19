import { useMemo } from 'react';

// Simple hash function to generate a stable color index
function getHashColor(str: string) {
    const colors = [
        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
        'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
        'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
        'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300',
        'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
        'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
}

export default function HashtagText({ text }: { text: string }) {
    const segments = useMemo(() => {
        if (!text) return [];
        // Split by hashtag regex (capture group keeps the tag)
        // Regex: space or start, #tag, word boundary
        // Easier: Split by (#\w+)
        const parts = text.split(/(#\w+)/g);
        return parts;
    }, [text]);

    return (
        <span>
            {segments.map((part, i) => {
                if (part.startsWith('#')) {
                    const colorClass = getHashColor(part);
                    return (
                        <span key={i} className={`rounded px-1 py-0.5 text-[0.9em] font-medium ${colorClass}`}>
                            {part}
                        </span>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
}
