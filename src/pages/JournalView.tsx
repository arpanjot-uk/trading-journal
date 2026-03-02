import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, BookOpen, Download, Activity, FileText, Frown, Angry, Meh, Smile, SmilePlus, Zap, Moon, Coffee, Dumbbell, Utensils } from 'lucide-react';
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
        if (!trades || trades.length === 0) return;

        const headers = ['Date', 'Pair', 'Direction', 'Lots', 'Strategy', 'RR', 'PnL', 'Duration'];
        const rows = trades.map(t => [
            format(new Date(t.openDate), 'yyyy-MM-dd HH:mm'),
            t.pair,
            t.direction,
            t.lots.toFixed(2),
            t.strategy,
            t.rr.toString(),
            t.netPnl.toFixed(2),
            t.duration.toString()
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `trades_${journal?.name?.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                        Export Trades
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
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dir</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lots</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strategy</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RR</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PnL</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trades && trades.length > 0 ? (
                                trades.map((trade) => (
                                    <tr key={trade.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s', background: 'transparent' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '1.25rem 1.5rem', whiteSpace: 'nowrap' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{format(new Date(trade.openDate), 'MMM dd, yyyy')}</span>
                                                <span className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.1rem' }}>{format(new Date(trade.openDate), 'HH:mm')}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{trade.pair}</td>
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
                                        <td style={{ padding: '1.25rem 1.5rem', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{trade.rr > 0 ? trade.rr.toFixed(1) : '-'}</td>
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
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No trades logged yet. Click "Add Entry" to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'Mood Tracker' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {moods && moods.length > 0 ? (
                        moods.map(mood => {
                            const faces = [
                                { score: 1, icon: <Angry size={30} />, color: '#EF4444' },
                                { score: 2, icon: <Frown size={30} />, color: '#F97316' },
                                { score: 3, icon: <Meh size={30} />, color: '#EAB308' },
                                { score: 4, icon: <Smile size={30} />, color: '#84CC16' },
                                { score: 5, icon: <SmilePlus size={30} />, color: '#22C55E' }
                            ];
                            const face = faces.find(f => f.score === mood.moodScore);

                            return (
                                <div key={mood.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
                                    <button
                                        onClick={() => { setMoodToEdit(mood); setIsMoodModalOpen(true); }}
                                        style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-muted)' }}
                                    >
                                        <Edit2 size={16} />
                                    </button>

                                    <div className="flex-between">
                                        <span className="text-secondary" style={{ fontWeight: 600 }}>{format(new Date(mood.date + 'T00:00:00'), 'MMM dd, yyyy')}</span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            fontSize: '3rem',
                                            width: '60px',
                                            height: '60px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: `${face?.color}33`,
                                            borderRadius: '50%',
                                            border: `2px solid ${face?.color}`,
                                            color: face?.color
                                        }}>
                                            {face?.icon}
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', background: '#EAB30833', color: '#EAB308', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                                                    <Zap size={14} /> Energy {mood.energyLevel}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', background: '#EF444433', color: '#EF4444', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                                                    <Activity size={14} /> Stress {mood.stressLevel}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                                                    <Moon size={12} /> {mood.sleepHours} hrs
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                                                    <Coffee size={12} /> {mood.caffeineIntake}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                                                    <Dumbbell size={12} /> {mood.exercised ? 'Yes' : 'No'}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                                                    <Utensils size={12} /> {mood.dietScore}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {mood.notes && (
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                                            "{mood.notes}"
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No mood logs yet. Logs will automatically be requested once a day if enabled in settings, or you can log manually above.
                        </div>
                    )}
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
