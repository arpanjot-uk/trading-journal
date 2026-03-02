import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react';
import { db, type Trade } from '../db/db';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { AddTradeModal } from '../components/AddTradeModal';
import { useJournalContext } from '../context/JournalContext';

export const JournalView: React.FC = () => {
    const navigate = useNavigate();
    const { activeJournalId } = useJournalContext();

    const journal = useLiveQuery(() => db.journals.get(activeJournalId || 0), [activeJournalId]);

    // Sort trades by newest open date first
    const trades = useLiveQuery(
        () => activeJournalId ? db.trades.where('journalId').equals(activeJournalId).reverse().sortBy('openDate') : Promise.resolve([] as Trade[]),
        [activeJournalId]
    );

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);
    const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);

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
                    <h1 style={{ margin: 0, fontSize: '2rem' }}>Trade Log</h1>
                    <p className="text-secondary">{journal.name}</p>
                </div>
                <Button icon={<Plus size={18} />} onClick={() => setIsAddModalOpen(true)}>
                    Add Entry
                </Button>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
                    <thead>
                        <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '2px solid var(--border-color)' }}>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid var(--border-color)' }}>Date</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid var(--border-color)' }}>Pair</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid var(--border-color)' }}>Dir</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid var(--border-color)' }}>Lots</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid var(--border-color)' }}>Strategy</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid var(--border-color)' }}>RR</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid var(--border-color)' }}>PnL</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid var(--border-color)' }}>Duration</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trades && trades.length > 0 ? (
                            trades.map((trade) => (
                                <tr key={trade.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '0.75rem 1rem', borderRight: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 500 }}>{format(new Date(trade.openDate), 'MMM dd, yyyy')}</span>
                                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>{format(new Date(trade.openDate), 'HH:mm')}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', borderRight: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--text-primary)' }}>{trade.pair}</td>
                                    <td style={{ padding: '0.75rem 1rem', borderRight: '1px solid var(--border-color)' }}>
                                        <span style={{
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            background: trade.direction === 'Buy' ? 'var(--win-bg)' : 'var(--loss-bg)',
                                            color: trade.direction === 'Buy' ? 'var(--win-color)' : 'var(--loss-color)'
                                        }}>
                                            {trade.direction.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', borderRight: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '0.9rem' }}>{trade.lots.toFixed(2)}</td>
                                    <td style={{ padding: '0.75rem 1rem', borderRight: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>{trade.strategy}</td>
                                    <td style={{ padding: '0.75rem 1rem', borderRight: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '0.9rem' }}>{trade.rr > 0 ? trade.rr.toFixed(1) : '-'}</td>
                                    <td style={{ padding: '0.75rem 1rem', borderRight: '1px solid var(--border-color)', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.95rem', color: trade.netPnl > 0 ? 'var(--win-color)' : trade.netPnl < 0 ? 'var(--loss-color)' : 'var(--text-secondary)' }}>
                                        {trade.netPnl > 0 ? '+' : ''}${trade.netPnl.toFixed(2)}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', borderRight: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        {trade.duration < 60 ? `${trade.duration}m` : `${Math.floor(trade.duration / 60)}h ${trade.duration % 60}m`}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => openEdit(trade)}
                                                style={{ padding: '0.25rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}
                                                onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
                                                onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                                                title="Edit Trade"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => openDelete(trade)}
                                                style={{ padding: '0.25rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}
                                                onMouseOver={e => e.currentTarget.style.color = 'var(--loss-color)'}
                                                onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
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

            <AddTradeModal
                isOpen={isAddModalOpen}
                onClose={handleCloseAddModal}
                tradeToEdit={tradeToEdit}
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
