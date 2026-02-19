'use client';

import { useState } from 'react';
import { generateWeeklySummary } from '@/actions/summary';
import { Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export default function SummaryAI({
    initialSummary,
    date
}: {
    initialSummary?: string;
    date: Date;
}) {
    const [summary, setSummary] = useState(initialSummary);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const newSummary = await generateWeeklySummary(date);
            setSummary(newSummary);
        } catch (e: any) {
            console.error(e);
            alert(`Failed to generate summary: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card relative overflow-hidden bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950">
            <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 z-10 relative flex items-center gap-2">
                AI Weekly Insights <Sparkles size={12} className="text-yellow-500" />
            </h3>

            {/* Decorative background */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7H11V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM4 12H2v3h2v-3zm18 0h-2v3h2v-3zM5 14h14v-3a5 5 0 0 0-10 0v3z" /></svg>
            </div>

            <div className="relative z-10">
                {summary ? (
                    <div className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto mb-3 scrollbar-none">
                        {summary}
                    </div>
                ) : (
                    <p className="text-xs text-neutral-500 italic mb-3">
                        No summary generated for this week yet.
                    </p>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="btn w-full bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs py-2 flex justify-center items-center gap-2 shadow-sm transition-all"
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {loading ? "Generating..." : (summary ? "Regenerate Summary" : "Generate AI Summary")}
                </button>
                <div className="text-[10px] text-center text-neutral-400 mt-2">
                    Powered by OpenAI • Week of {format(date, 'MMM d')}
                </div>
            </div>
        </div>
    );
}
