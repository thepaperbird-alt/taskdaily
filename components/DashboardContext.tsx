'use client';

import { createContext, useContext, useState } from 'react';

type DashboardContextType = {
    isJournalCollapsed: boolean;
    isRoutineCollapsed: boolean;
    toggleJournal: () => void;
    toggleRoutine: () => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [isJournalCollapsed, setIsJournalCollapsed] = useState(true);
    const [isRoutineCollapsed, setIsRoutineCollapsed] = useState(true);

    const toggleJournal = () => setIsJournalCollapsed(prev => !prev);
    const toggleRoutine = () => setIsRoutineCollapsed(prev => !prev);

    return (
        <DashboardContext.Provider value={{ isJournalCollapsed, isRoutineCollapsed, toggleJournal, toggleRoutine }}>
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
