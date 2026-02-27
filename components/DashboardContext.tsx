'use client';

import { createContext, useContext, useState } from 'react';

type DashboardContextType = {
    isCalendarCollapsed: boolean;
    toggleCalendar: () => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [isCalendarCollapsed, setIsCalendarCollapsed] = useState(true);

    const toggleCalendar = () => setIsCalendarCollapsed(prev => !prev);

    return (
        <DashboardContext.Provider value={{ isCalendarCollapsed, toggleCalendar }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
