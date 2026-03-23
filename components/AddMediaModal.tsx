import React, { useState } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';
import { addMediaItem, updateMediaItem, MediaItem } from '@/actions/watchlist';
import { cn } from '@/lib/utils';

export default function AddMediaModal({ 
    status, 
    onClose,
    editItem
}: { 
    status: 'to_watch' | 'current' | 'completed', 
    onClose: () => void,
    editItem?: MediaItem | null
}) {
    const [title, setTitle] = useState(editItem?.title || '');
    const [summary, setSummary] = useState(editItem?.summary || '');
    const [type, setType] = useState<'movie' | 'tv' | 'game' | 'gadget'>(editItem?.type || 'movie');
    const [platform, setPlatform] = useState(editItem?.platform || '');
    const [season, setSeason] = useState(editItem?.season || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        try {
            if (editItem) {
                await updateMediaItem(editItem.id, {
                    title,
                    summary,
                    type,
                    platform,
                    season
                });
            } else {
                await addMediaItem({
                    title,
                    summary,
                    type,
                    status,
                    platform,
                    season
                });
            }
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#F8F9FA] dark:bg-neutral-900 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border-2 border-dashed border-neutral-300 dark:border-neutral-700 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{editItem ? 'Edit Media' : 'Add to Watchlist'}</h2>
                    <button onClick={onClose} className="p-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-full transition-colors text-neutral-600 dark:text-neutral-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Title <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            required
                            autoFocus
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full text-lg p-3 rounded-xl border-2 border-neutral-200 focus:border-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-400 outline-none transition-all shadow-sm"
                            placeholder="Interstellar, Breaking Bad..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Type</label>
                            <div className="flex bg-white dark:bg-neutral-800 rounded-xl p-1 border-2 border-neutral-200 dark:border-neutral-700 shadow-sm overflow-x-auto hide-scrollbar">
                                <button type="button" onClick={() => setType('movie')} className={cn("flex-1 px-2 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap", type === 'movie' ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700")}>Movie</button>
                                <button type="button" onClick={() => setType('tv')} className={cn("flex-1 px-2 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap", type === 'tv' ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700")}>Show</button>
                                <button type="button" onClick={() => setType('game')} className={cn("flex-1 px-2 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap", type === 'game' ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700")}>Game</button>
                                <button type="button" onClick={() => setType('gadget')} className={cn("flex-1 px-2 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap", type === 'gadget' ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700")}>Gadget</button>
                            </div>
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                                {type === 'game' ? 'Platform' : type === 'gadget' ? 'Store' : 'Platform / Network'}
                            </label>
                            <input 
                                type="text" 
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                                className="w-full p-2.5 rounded-xl border-2 border-neutral-200 focus:border-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white outline-none text-sm transition-all"
                                placeholder={type === 'game' ? "PS5, PC, Switch..." : (type === 'gadget' ? "Amazon, BestBuy..." : "Netflix, HBO...")}
                            />
                        </div>
                    </div>

                    {type === 'tv' && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Season / Episode</label>
                            <input 
                                type="text" 
                                value={season}
                                onChange={(e) => setSeason(e.target.value)}
                                className="w-full p-2.5 rounded-xl border-2 border-neutral-200 focus:border-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white outline-none text-sm transition-all"
                                placeholder="S01E03"
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Summary (Optional)</label>
                            <span className="text-[10px] text-blue-500 font-bold flex items-center gap-1"><Sparkles size={10} /> AI Auto-Fill if blank</span>
                        </div>
                        <textarea 
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            className="w-full p-3 rounded-xl border-2 border-neutral-200 focus:border-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white outline-none text-sm transition-all resize-none h-24 font-mono shadow-sm"
                            placeholder="Add your own thoughts or leave blank for magic..."
                        />
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={loading || !title.trim()}
                            className="w-full bg-black hover:bg-neutral-800 text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 py-4 rounded-xl font-bold text-lg shadow-xl shadow-black/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : (editItem ? "Save Changes" : "Add to Dashboard")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

