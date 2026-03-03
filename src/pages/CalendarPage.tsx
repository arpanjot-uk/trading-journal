import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Calendar } from 'lucide-react';
import { db } from '../db/db';
import { CalendarView } from '../components/CalendarView';
import { useJournalContext } from '../context/JournalContext';

export const CalendarPage: React.FC = () => {
    const { activeJournalId } = useJournalContext();

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
        <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem', marginTop: '0.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '0.45rem', borderRadius: '8px', display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.25)' }}>
                        <Calendar size={18} color="#fff" />
                    </div>
                    <h1 style={{ margin: 0, fontSize: '1.65rem' }}>Calendar</h1>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Monthly view of your trading activity</p>
            </div>

            {trades ? <CalendarView trades={trades} /> : <p className="text-muted" style={{ padding: '3rem 0', textAlign: 'center' }}>Loading calendar data...</p>}
        </div>
    );
};
