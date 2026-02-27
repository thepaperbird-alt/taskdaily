import { Suspense } from 'react';
import TaskList from '@/components/TaskList';
import DailyColumn from '@/components/DailyColumn';
import CalendarColumn from '@/components/CalendarColumn';
import MobileNav from '@/components/MobileNav';
import ExportSummaryButton from '@/components/ExportSummaryButton';
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
      <header className="h-auto min-h-[5rem] md:min-h-[7rem] py-2 px-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="TaskDaily Logo" className="h-20 md:h-32 w-auto object-contain" />
        </div>
        <div className="hidden md:flex items-center gap-4">

          {/* New Task is handled in columns mostly, but we can have global add */}
          {/* For now, just placeholder or link to focus task input */}
          <button className="btn btn-primary text-sm shadow-md">+ New Task</button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {/* Desktop Grid via DashboardLayout */}
        <DashboardLayout
          tasks={
            <div className="flex flex-col h-full gap-4">
              <div className="flex-1 overflow-hidden">
                <TaskList filterTags={tagsFilter} />
              </div>
              <div className="h-[35%] shrink-0 overflow-hidden">
                <HashtagManager tags={allTags} />
              </div>
            </div>
          }
          dailies={<DailyColumn dateStr={dateStr} filterTags={tagsFilter} />}
          calendar={<CalendarColumn dateStr={dateStr} />}
        />

        {/* Mobile View */}
        <div className="md:hidden flex-1 p-0 pb-20 flex flex-col min-h-0">
          {tab === 'tasks' && <div className="p-4 h-full"><TaskList filterTags={tagsFilter} /></div>}
          {tab === 'dailies' && <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-neutral-900"><DailyColumn dateStr={dateStr} filterTags={tagsFilter} /></div>}
          {tab === 'calendar' && <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-neutral-900"><CalendarColumn dateStr={dateStr} /></div>}
        </div>
      </div>

      {/* Mobile Nav */}
      <MobileNav activeTab={tab} />
    </main>
  );
}
