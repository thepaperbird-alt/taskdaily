import { Suspense } from 'react';
import TaskList from '@/components/TaskList';
import DailyColumn from '@/components/DailyColumn';
import SummaryColumn from '@/components/SummaryColumn';
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
    <main className="h-screen flex flex-col bg-black overflow-hidden">
      {/* Header */}
      <header className="h-14 px-4 border-b border-neutral-800 bg-black flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 text-white p-1 rounded-md">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <h1 className="font-bold text-lg tracking-tight">TaskDaily</h1>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <ExportSummaryButton week={week} />
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
          summary={<SummaryColumn dateStr={week} filterTags={tagsFilter} />}
        />

        {/* Mobile View */}
        <div className="md:hidden h-full pb-20 p-4 overflow-y-auto">
          {tab === 'tasks' && <TaskList filterTags={tagsFilter} />}
          {tab === 'dailies' && <DailyColumn dateStr={dateStr} filterTags={tagsFilter} />}
          {tab === 'summary' && <SummaryColumn dateStr={week} filterTags={tagsFilter} />}
        </div>
      </div>

      {/* Mobile Nav */}
      <MobileNav activeTab={tab} />
    </main>
  );
}
