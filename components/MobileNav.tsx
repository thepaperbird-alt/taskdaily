import Link from 'next/link';
import { List, Calendar, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileNav({ activeTab }: { activeTab: string }) {
    const navItems = [
        { id: 'tasks', label: 'Tasks', icon: List },
        { id: 'dailies', label: 'Dailies', icon: Calendar },
        { id: 'summary', label: 'Summary', icon: PieChart },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 md:hidden z-50 pb-safe">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <Link
                            key={item.id}
                            href={`/?tab=${item.id}`}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive ? "text-neutral-900 dark:text-white" : "text-neutral-500"
                            )}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
