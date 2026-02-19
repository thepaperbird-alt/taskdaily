'use client';

import { createContext, useContext, useState } from 'react';

type DashboardContextType = {
    isSummaryCollapsed: boolean;
    toggleSummary: () => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(true);

    const toggleSummary = () => setIsSummaryCollapsed(prev => !prev);

    return (
        <DashboardContext.Provider value={{ isSummaryCollapsed, toggleSummary }}>
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
