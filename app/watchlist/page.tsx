import { Suspense } from 'react';
import MobileNav from '@/components/MobileNav';
import Link from 'next/link';
import Header from '@/components/Header';
import { getWatchlist } from '@/actions/watchlist';
import WatchlistClient from '@/components/WatchlistClient';

export default async function WatchlistPage() {
  const initialMedia = await getWatchlist();

  return (
    <main className="h-[100dvh] flex flex-col bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
      {/* Header */}
      <Header activeTab="watchlist" />

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-[#F8F9FA] dark:bg-neutral-950">
          <WatchlistClient initialMedia={initialMedia} />
      </div>

      {/* Mobile Nav */}
      <MobileNav activeTab="watchlist" />
    </main>
  );
}
