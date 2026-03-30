import Link from 'next/link';
import { cn } from '@/lib/utils';

interface HeaderProps {
  activeTab: 'tasks' | 'watchlist' | 'thoughts' | 'wallet';
  children?: React.ReactNode;
}

export default function Header({ activeTab, children }: HeaderProps) {
  const navItems = [
    { id: 'tasks', label: 'Tasks', href: '/' },
    { id: 'watchlist', label: 'Lists', href: '/watchlist' },
    { id: 'thoughts', label: 'Thoughts', href: '/thoughts' },
    { id: 'wallet', label: 'Wallet', href: '/wallet' },
  ];

  return (
    <header className="h-auto min-h-[5rem] md:min-h-[7rem] py-2 px-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <Link href="/">
          <img src="/logo.png" alt="TaskDaily Logo" className="h-24 md:h-32 w-auto object-contain cursor-pointer" />
        </Link>
      </div>
      <div className="hidden md:flex items-center gap-6">
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors",
              activeTab === item.id 
                ? "font-semibold text-neutral-900 dark:text-neutral-100" 
                : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="hidden md:flex items-center gap-4">
        {children || <div className="w-16"></div>}
      </div>
    </header>
  );
}
