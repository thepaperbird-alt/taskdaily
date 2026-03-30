import { Suspense } from 'react';
import TaskList from '@/components/TaskList';
import DailyColumn from '@/components/DailyColumn';
import CalendarColumn from '@/components/CalendarColumn';
import MobileNav from '@/components/MobileNav';
import Link from 'next/link';
import Header from '@/components/Header';

import DashboardLayout from '@/components/DashboardLayout';
import HashtagManager from '@/components/HashtagManager';
import { getTags } from '@/actions/tags';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; week?: string; tags?: string; date?: string }>; // Added date param
}) {
  const resolvedParams = await searchParams;
  const tab = resolvedParams.tab || 'tasks';
  const week = resolvedParams.week;
  const dateStr = resolvedParams.date; // Support date param for Dailies
  const tagsFilter = resolvedParams.tags ? resolvedParams.tags.split(',') : undefined;

  const allTags = await getTags();

  return (
    <main className="h-[100dvh] flex flex-col bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
      {/* Header */}
      <Header activeTab="tasks">
        <button className="btn btn-primary text-sm shadow-md">+ New Task</button>
      </Header>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {/* Desktop Grid via DashboardLayout */}
        <DashboardLayout
          tasks={
            <div className="h-full overflow-hidden">
              <TaskList filterTags={tagsFilter} />
            </div>
          }
          dailies={<DailyColumn dateStr={dateStr} filterTags={tagsFilter} />}
          calendar={<CalendarColumn dateStr={dateStr} />}
        />

        {/* Mobile View */}
        <div className="md:hidden flex-1 p-0 pb-20 flex flex-col min-h-0 bg-neutral-50 dark:bg-neutral-950">
          {tab === 'tasks' && <div className="p-4 h-full"><TaskList filterTags={tagsFilter} /></div>}
          {tab === 'dailies' && <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-neutral-900"><DailyColumn dateStr={dateStr} filterTags={tagsFilter} /></div>}
          {tab === 'hashtags' && <div className="flex-1 p-4 h-full overflow-hidden"><HashtagManager tags={allTags} /></div>}
        </div>
      </div>

      {/* Mobile Nav */}
      <MobileNav activeTab={tab} />
    </main>
  );
}
