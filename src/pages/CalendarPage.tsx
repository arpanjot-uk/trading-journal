import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { CalendarView } from '../components/CalendarView';
import { useJournalContext } from '../context/JournalContext';

export const CalendarPage: React.FC = () => {
    const { activeJournalId } = useJournalContext();

    // Sort trades by newest open date first
    const trades = useLiveQuery(
        () => db.trades.where('journalId').equals(activeJournalId || 0).reverse().sortBy('openDate'),
        [activeJournalId]
    );

    if (!activeJournalId) {
        return (
            <div className="flex-center" style={{ minHeight: '50vh', flexDirection: 'column', gap: '1rem' }}>
                <h2 className="text-secondary">No Journal Selected</h2>
                <p className="text-muted">Please select a journal from the Journals page to view its calendar.</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem', marginTop: '1rem' }}>Calendar</h1>
            {trades ? <CalendarView trades={trades} /> : <p className="text-muted text-center" style={{ padding: '3rem 0' }}>Loading calendar data...</p>}
        </div>
    );
};
