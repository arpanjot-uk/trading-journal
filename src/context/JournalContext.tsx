import React, { createContext, useContext, useState } from 'react';

interface JournalContextType {
    activeJournalId: number | null;
    setActiveJournalId: (id: number | null) => void;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export const JournalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeJournalId, setActiveJournalIdState] = useState<number | null>(() => {
        const stored = localStorage.getItem('activeJournalId');
        return stored ? parseInt(stored, 10) : null;
    });

    const setActiveJournalId = (id: number | null) => {
        setActiveJournalIdState(id);
        if (id) {
            localStorage.setItem('activeJournalId', id.toString());
        } else {
            localStorage.removeItem('activeJournalId');
        }
    };

    return (
        <JournalContext.Provider value={{ activeJournalId, setActiveJournalId }}>
            {children}
        </JournalContext.Provider>
    );
};

export const useJournalContext = () => {
    const context = useContext(JournalContext);
    if (context === undefined) {
        throw new Error('useJournalContext must be used within a JournalProvider');
    }
    return context;
};
