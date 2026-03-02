import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, BookOpen, Download, Activity, FileText, Frown, Angry, Meh, Smile, SmilePlus, Zap, Moon, Coffee, Dumbbell, Utensils, ChevronDown, ChevronRight } from 'lucide-react';
import { db, type Trade, type DailyMood } from '../db/db';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { AddTradeModal } from '../components/AddTradeModal';
import { DailyMoodModal } from '../components/DailyMoodModal';
import { useJournalContext } from '../context/JournalContext';

type Tab = 'Trades' | 'Mood Tracker';

export const JournalView: React.FC = () => {
    const navigate = useNavigate();
    const { activeJournalId } = useJournalContext();

    const journal = useLiveQuery(() => db.journals.get(activeJournalId || 0), [activeJournalId]);

    const trades = useLiveQuery(
        () => activeJournalId ? db.trades.where('journalId').equals(activeJournalId).reverse().sortBy('openDate') : Promise.resolve([] as Trade[]),
        [activeJournalId]
    );

    const moods = useLiveQuery(
        () => activeJournalId ? db.dailyMoods.where('journalId').equals(activeJournalId).reverse().sortBy('date') : Promise.resolve([] as DailyMood[]),
        [activeJournalId]
    );

    const settings = useLiveQuery(() => db.settings.toCollection().first());

    const [activeTab, setActiveTab] = useState<Tab>('Trades');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
    const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);
    const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
    const [moodToEdit, setMoodToEdit] = useState<DailyMood | null>(null);
    const [expandedTradeId, setExpandedTradeId] = useState<number | null>(null);

    const todayDateStr = format(new Date(), 'yyyy-MM-dd');
    const hasLoggedToday = moods ? moods.some(m => m.date === todayDateStr) : false;

    // Auto Daily Mood Logic
    React.useEffect(() => {
        if (!activeJournalId || !settings?.enableMoodTracker || !moods) return;

        // Check local storage to prevent harassing them in a single session if they closed it today
        const sessionKey = `mood_prompt_suppressed_${todayDateStr}`;
        const hasSuppressed = sessionStorage.getItem(sessionKey);

        if (!hasLoggedToday && !hasSuppressed) {
            setIsMoodModalOpen(true);
        }
    }, [activeJournalId, settings?.enableMoodTracker, moods]);

    const handleCloseMoodModal = () => {
        setIsMoodModalOpen(false);
        setMoodToEdit(null);
        sessionStorage.setItem(`mood_prompt_suppressed_${format(new Date(), 'yyyy-MM-dd')}`, 'true');
    };

    const openEdit = (trade: Trade) => {
        setTradeToEdit(trade);
        setIsAddModalOpen(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setTradeToEdit(null);
    };

    const openDelete = (trade: Trade) => {
        setTradeToDelete(trade);
    };

    const confirmDelete = async () => {
        if (!tradeToDelete?.id) return;
        await db.trades.delete(tradeToDelete.id);
        setTradeToDelete(null);
    };

    const handleExportCSV = () => {
        if ((!trades || trades.length === 0) && (!moods || moods.length === 0)) return;

        const headers = [
            'Date', 'Time', 'Pair', 'Direction', 'Lots', 'Strategy', 'Timeframe', 'SL', 'TP', 'Outcome', 'PnL', 'Duration (m)', 'Screenshot URL',
            'Mood Score', 'Energy Level', 'Stress Level', 'Sleep (hrs)', 'Diet Setup', 'Caffeine Intake', 'Exercised', 'Daily Journal Notes'
        ];

        const rows: string[][] = [];

        // Find all unique dates across trades and moods
        const allDates = new Set<string>();
        trades?.forEach(t => allDates.add(format(new Date(t.openDate), 'yyyy-MM-dd')));
        moods?.forEach(m => allDates.add(m.date));

        // Sort dates descending
        const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a));

        sortedDates.forEach(dateStr => {
            const dayTrades = trades?.filter(t => format(new Date(t.openDate), 'yyyy-MM-dd') === dateStr) || [];
            const dayMood = moods?.find(m => m.date === dateStr);

            const moodCols = [
                dayMood ? dayMood.moodScore.toString() : '',
                dayMood ? dayMood.energyLevel.toString() : '',
                dayMood ? dayMood.stressLevel.toString() : '',
                dayMood ? dayMood.sleepHours?.toString() || '' : '',
                dayMood ? `"${dayMood.dietScore}"` : '',
                dayMood ? `"${dayMood.caffeineIntake}"` : '',
                dayMood ? (dayMood.exercised ? 'Yes' : 'No') : '',
                dayMood && dayMood.notes ? `"${dayMood.notes.replace(/"/g, '""')}"` : '' // Escape quotes
            ];

            if (dayTrades.length > 0) {
                dayTrades.forEach(t => {
                    rows.push([
                        dateStr,
                        t.openDate ? format(new Date(t.openDate), 'HH:mm') : '',
                        t.pair || '',
                        t.direction || '',
                        t.lots ? t.lots.toFixed(2) : '',
                        t.strategy || '',
                        t.timeframe || '',
                        t.sl ? t.sl.toString() : '',
                        t.tp ? t.tp.toString() : '',
                        t.result || '',
                        t.netPnl ? t.netPnl.toFixed(2) : '0.00',
                        t.duration ? t.duration.toString() : '0',
                        t.screenshotUrl ? `"${t.screenshotUrl}"` : '',
                        ...moodCols
                    ]);
                });
            } else {
                // Mood only, no trades
                rows.push([
                    dateStr,
                    '', '', '', '', '', '', '', '', '', '', '', '',
                    ...moodCols
                ]);
            }
        });

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const safeName = (journal?.name || 'export').replace(/[^a-zA-Z0-9]/g, '_');
        link.download = `journal_${safeName}_${format(new Date(), 'yyyyMMdd')}.csv`;

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);
    };

    if (!activeJournalId) {
        return (
            <div className="flex-center" style={{ minHeight: '50vh', flexDirection: 'column', gap: '1rem' }}>
                <BookOpen size={48} className="text-muted" />
                <h2 className="text-secondary">No Journal Selected</h2>
                <p className="text-muted">Please select a journal from the Journals page to view its trade log.</p>
                <Button onClick={() => navigate('/')}>Go to Journals</Button>
            </div>
        );
    }

    if (!journal) {
        return <div className="container" style={{ paddingTop: '2rem' }}>Loading Journal...</div>;
    }

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
            <div className="flex-between" style={{ marginBottom: '2rem', marginTop: '1rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem' }}>Journal Data</h1>
                    <p className="text-secondary">{journal.name}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="ghost" icon={<Download size={18} />} onClick={handleExportCSV}>
                        Export Journal
                    </Button>
                    {!hasLoggedToday && (
                        <Button variant="secondary" icon={<Activity size={18} />} onClick={() => setIsMoodModalOpen(true)}>
                            Log Mood
                        </Button>
                    )}
                    <Button icon={<Plus size={18} />} onClick={() => setIsAddModalOpen(true)}>
                        Add Trade
                    </Button>
                </div>
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                {(['Trades', 'Mood Tracker'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.5rem 1rem',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                            borderBottom: activeTab === tab ? '2px solid var(--accent-primary)' : '2px solid transparent',
                            transition: 'var(--transition-fast)'
                        }}
                    >
                        {tab === 'Trades' ? <FileText size={16} /> : <Activity size={16} />}
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'Trades' && (
                <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pair</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TF</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dir</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lots</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strategy</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Emotions</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SL</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TP</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outcome</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PnL</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trades && trades.length > 0 ? (
                                trades.map((trade) => (
                                    <React.Fragment key={trade.id}>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s', background: 'transparent' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '1.25rem 1.5rem', whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={() => setExpandedTradeId(prev => prev === trade.id ? null : trade.id!)}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    {expandedTradeId === trade.id ? <ChevronDown size={16} className="text-muted" /> : <ChevronRight size={16} className="text-muted" />}
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{format(new Date(trade.openDate), 'MMM dd, yyyy')}</span>
                                                        <span className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.1rem' }}>{format(new Date(trade.openDate), 'HH:mm')}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{trade.pair}</td>
                                            <td style={{ padding: '1.25rem 1.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{trade.timeframe || '-'}</td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <span style={{
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 700,
                                                    background: trade.direction === 'Buy' ? 'var(--win-bg)' : 'var(--loss-bg)',
                                                    color: trade.direction === 'Buy' ? 'var(--win-color)' : 'var(--loss-color)'
                                                }}>
                                                    {trade.direction.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{trade.lots.toFixed(2)}</td>
                                            <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>{trade.strategy}</td>
                                            <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)' }}>
                                                {typeof trade.notes.emotion === 'object' && trade.notes.emotion.fomo ? (
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.2rem', fontSize: '0.7rem', fontWeight: 500 }}>
                                                        <span title="FOMO">F:{trade.notes.emotion.fomo}</span>
                                                        <span title="Patience">P:{trade.notes.emotion.patience}</span>
                                                        <span title="Discipline">D:{trade.notes.emotion.discipline}</span>
                                                        <span title="Confidence">C:{trade.notes.emotion.confidence}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{trade.sl > 0 ? trade.sl.toString() : '-'}</td>
                                            <td style={{ padding: '1.25rem 1.5rem', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{trade.tp > 0 ? trade.tp.toString() : '-'}</td>
                                            <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600, fontSize: '0.85rem', color: trade.result === 'Win' ? 'var(--win-color)' : trade.result === 'Loss' ? 'var(--loss-color)' : 'var(--text-secondary)' }}>
                                                {trade.result}
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.95rem', color: trade.netPnl > 0 ? 'var(--win-color)' : trade.netPnl < 0 ? 'var(--loss-color)' : 'var(--text-secondary)' }}>
                                                {trade.netPnl > 0 ? '+' : ''}${trade.netPnl.toFixed(2)}
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                {trade.duration < 60 ? `${trade.duration}m` : `${Math.floor(trade.duration / 60)}h ${trade.duration % 60}m`}
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                    <button
                                                        onClick={() => openEdit(trade)}
                                                        style={{ color: 'var(--text-muted)', transition: 'color 0.2s', padding: 0 }}
                                                        onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
                                                        onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                                        title="Edit Trade"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => openDelete(trade)}
                                                        style={{ color: 'var(--text-muted)', transition: 'color 0.2s', padding: 0 }}
                                                        onMouseOver={e => e.currentTarget.style.color = 'var(--loss-color)'}
                                                        onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                                        title="Delete Trade"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedTradeId === trade.id && (
                                            <tr style={{ background: 'var(--bg-tertiary)' }}>
                                                <td colSpan={13} style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                                                        {/* Media links */}
                                                        {(trade.tvLink || trade.screenshotUrl) && (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                <h5 className="text-secondary" style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Media Links</h5>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                    {trade.tvLink && <a href={trade.tvLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', textDecoration: 'none' }}>→ TradingView Profile</a>}
                                                                    {trade.screenshotUrl && <a href={trade.screenshotUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', textDecoration: 'none' }}>→ Chart Screenshot</a>}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Checklist */}
                                                        {trade.checklistAnswers && Object.keys(trade.checklistAnswers).length > 0 && (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                <h5 className="text-secondary" style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pre-Trade Checklist</h5>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                                    {Object.entries(trade.checklistAnswers).map(([q, a]) => (
                                                                        <div key={q} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                                            <span style={{ color: a ? 'var(--win-color)' : 'var(--loss-color)', marginTop: '2px', fontWeight: 700 }}>{a ? '✓' : '✗'}</span>
                                                                            <span style={{ color: 'var(--text-primary)' }}>{q}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Notes */}
                                                        {(trade.notes.technical || (typeof trade.notes.emotion === 'object' ? trade.notes.emotion.text : trade.notes.emotion)) && (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', gridColumn: '1 / -1', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                                                {trade.notes.technical && (
                                                                    <div>
                                                                        <h5 className="text-secondary" style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Technical Notes</h5>
                                                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{trade.notes.technical}</p>
                                                                    </div>
                                                                )}
                                                                {(typeof trade.notes.emotion === 'object' ? trade.notes.emotion.text : trade.notes.emotion) && (
                                                                    <div>
                                                                        <h5 className="text-secondary" style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Additional Emotional Notes</h5>
                                                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{typeof trade.notes.emotion === 'object' ? trade.notes.emotion.text : trade.notes.emotion}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={13} style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No trades logged yet. Click "Add Entry" to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'Mood Tracker' && (
                <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mood</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Energy</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stress</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sleep</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Diet</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Caffeine</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exercise</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {moods && moods.length > 0 ? (
                                moods.map(mood => {
                                    const faces = [
                                        { score: 1, icon: <Angry size={20} />, color: '#EF4444' },
                                        { score: 2, icon: <Frown size={20} />, color: '#F97316' },
                                        { score: 3, icon: <Meh size={20} />, color: '#EAB308' },
                                        { score: 4, icon: <Smile size={20} />, color: '#84CC16' },
                                        { score: 5, icon: <SmilePlus size={20} />, color: '#22C55E' }
                                    ];
                                    const face = faces.find(f => f.score === mood.moodScore);

                                    return (
                                        <tr key={mood.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s', background: 'transparent' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '1.25rem 1.5rem', whiteSpace: 'nowrap' }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{format(new Date(mood.date + 'T00:00:00'), 'MMM dd, yyyy')}</span>
                                            </td>

                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: `${face?.color}22`,
                                                    color: face?.color,
                                                    padding: '0.4rem',
                                                    borderRadius: '50%',
                                                    border: `1px solid ${face?.color}88`
                                                }}>
                                                    {face?.icon}
                                                </div>
                                            </td>

                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: '#EAB308', fontWeight: 500 }}>
                                                    <Zap size={14} /> {mood.energyLevel}
                                                </span>
                                            </td>

                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: '#EF4444', fontWeight: 500 }}>
                                                    <Activity size={14} /> {mood.stressLevel}
                                                </span>
                                            </td>

                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    <Moon size={14} /> {mood.sleepHours} hrs
                                                </span>
                                            </td>

                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    <Utensils size={14} /> {mood.dietScore}
                                                </span>
                                            </td>

                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    <Coffee size={14} /> {mood.caffeineIntake}
                                                </span>
                                            </td>

                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    <Dumbbell size={14} /> {mood.exercised ? 'Yes' : 'No'}
                                                </span>
                                            </td>

                                            <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={mood.notes}>
                                                {mood.notes || '-'}
                                            </td>

                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <button
                                                    onClick={() => { setMoodToEdit(mood); setIsMoodModalOpen(true); }}
                                                    style={{ color: 'var(--text-muted)', transition: 'color 0.2s', padding: 0 }}
                                                    onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
                                                    onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                                    title="Edit Log"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={10} style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No mood logs yet. Logs will automatically be requested once a day if enabled in settings, or you can log manually above.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <AddTradeModal
                isOpen={isAddModalOpen}
                onClose={handleCloseAddModal}
                tradeToEdit={tradeToEdit}
            />

            <DailyMoodModal
                isOpen={isMoodModalOpen}
                onClose={handleCloseMoodModal}
                journalId={activeJournalId}
                existingMood={moodToEdit}
            />

            {/* DELETE CONFIRMATION MODAL */}
            <Modal isOpen={!!tradeToDelete} onClose={() => setTradeToDelete(null)} title="Delete Trade">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p>Are you sure you want to delete this {tradeToDelete?.pair} trade?</p>
                    <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
                        Date: {tradeToDelete && format(new Date(tradeToDelete.openDate), 'MMM dd, yyyy HH:mm')}<br />
                        Net PnL: ${tradeToDelete?.netPnl.toFixed(2)}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={() => setTradeToDelete(null)}>Cancel</Button>
                        <Button onClick={confirmDelete} style={{ background: 'var(--loss-color)', color: '#fff' }}>Delete Trade</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
