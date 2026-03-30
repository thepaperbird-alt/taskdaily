import { Suspense } from 'react';
import MobileNav from '@/components/MobileNav';
import Link from 'next/link';
import Header from '@/components/Header';
import { getThoughts } from '@/actions/thoughts';
import ThoughtsClient from '@/components/ThoughtsClient';

export default async function ThoughtsPage() {
  const initialThoughts = await getThoughts();

  return (
    <main className="h-[100dvh] flex flex-col bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
      {/* Header */}
      <Header activeTab="thoughts" />

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-[#F8F9FA] dark:bg-neutral-950">
          <ThoughtsClient initialThoughts={initialThoughts} />
      </div>

      {/* Mobile Nav */}
      <MobileNav activeTab="thoughts" />
    </main>
  );
}
