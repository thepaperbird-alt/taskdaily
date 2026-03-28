import { Suspense } from 'react';
export const dynamic = 'force-dynamic';
import MobileNav from '@/components/MobileNav';
import Link from 'next/link';
import { getThoughts } from '@/actions/thoughts';
import ThoughtsClient from '@/components/ThoughtsClient';

export default async function ThoughtsPage() {
  let initialThoughts: Awaited<ReturnType<typeof getThoughts>> = [];
  let loadError: string | null = null;

  try {
    initialThoughts = await getThoughts();
  } catch (err: any) {
    console.error('[ThoughtsPage] Failed to load thoughts:', err);
    loadError = 'Could not load thoughts. The database table may not be set up yet.';
  }

  return (
    <main className="h-[100dvh] flex flex-col bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
      {/* Header */}
      <header className="h-auto min-h-[5rem] md:min-h-[7rem] py-2 px-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="TaskDaily Logo" className="h-24 md:h-32 w-auto object-contain" />
        </div>
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors">Tasks</Link>
          <Link href="/watchlist" className="text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors">Lists</Link>
          <Link href="/thoughts" className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Thoughts</Link>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="w-16"></div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-[#F8F9FA] dark:bg-neutral-950">
        {loadError ? (
          <div className="flex items-center justify-center h-full p-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center font-mono">
              <p className="text-red-600 text-sm font-bold mb-2">⚠️ Database Error</p>
              <p className="text-red-500 text-xs">{loadError}</p>
              <p className="text-neutral-400 text-xs mt-3">Check Vercel Function Logs for full details.</p>
            </div>
          </div>
        ) : (
          <ThoughtsClient initialThoughts={initialThoughts} />
        )}
      </div>

      {/* Mobile Nav */}
      <MobileNav activeTab="thoughts" />
    </main>
  );
}
