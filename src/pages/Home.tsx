import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, BookOpen, TrendingUp, Edit2, Trash2 } from 'lucide-react';
import { db, type Journal } from '../db/db';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useJournalContext } from '../context/JournalContext';

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const journals = useLiveQuery(() => db.journals.toArray());
    const { activeJournalId, setActiveJournalId } = useJournalContext();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [startingBalance, setStartingBalance] = useState('');
    const [error, setError] = useState('');

    const openCreate = () => {
        setName('');
        setStartingBalance('');
        setError('');
        setIsCreateModalOpen(true);
    };

    const openEdit = (e: React.MouseEvent, journal: Journal) => {
        e.stopPropagation();
        setSelectedJournal(journal);
        setName(journal.name);
        setStartingBalance(journal.startingBalance.toString());
        setError('');
        setIsEditModalOpen(true);
    };

    const openDelete = (e: React.MouseEvent, journal: Journal) => {
        e.stopPropagation();
        setSelectedJournal(journal);
        setIsDeleteModalOpen(true);
    };

    const handleCreateJournal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return setError('Journal name is required.');
        const balance = parseFloat(startingBalance);
        if (isNaN(balance) || balance < 0) return setError('Please enter a valid starting balance.');

        try {
            const newJournalId = await db.journals.add({
                name: name.trim(),
                startingBalance: balance,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            setIsCreateModalOpen(false);
            setActiveJournalId(newJournalId as number);
            navigate(`/log`);
        } catch (err) {
            console.error(err);
            setError('Failed to create journal.');
        }
    };

    const handleEditJournal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedJournal?.id) return;
        if (!name.trim()) return setError('Journal name is required.');
        const balance = parseFloat(startingBalance);
        if (isNaN(balance) || balance < 0) return setError('Please enter a valid balance.');

        try {
            await db.journals.update(selectedJournal.id, {
                name: name.trim(),
                startingBalance: balance,
                updatedAt: new Date().toISOString()
            });
            setIsEditModalOpen(false);
        } catch (err) {
            console.error(err);
            setError('Failed to update journal.');
        }
    };

    const handleDeleteJournal = async () => {
        if (!selectedJournal?.id) return;
        try {
            const journalId = selectedJournal.id;

            // Delete all associated trades
            const trades = await db.trades.where('journalId').equals(journalId).toArray();
            const tradeIds = trades.map(t => t.id).filter((id): id is number => id !== undefined);
            await db.trades.bulkDelete(tradeIds);

            // Delete all associated daily moods (B1 fix: was missing)
            await db.dailyMoods.where('journalId').equals(journalId).delete();

            // Delete the journal
            await db.journals.delete(journalId);

            if (activeJournalId === journalId) {
                setActiveJournalId(null);
            }
            setIsDeleteModalOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSelectJournal = (journalId: number) => {
        setActiveJournalId(journalId);
        navigate(`/log`);
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
            {/* Header */}
            <div className="flex-between" style={{ marginBottom: '2.25rem', marginTop: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                        <div style={{ background: 'linear-gradient(135deg, #4f7cf6, #7c3aed)', padding: '0.45rem', borderRadius: '8px', display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(79,124,246,0.3)' }}>
                            <BookOpen size={18} color="#fff" />
                        </div>
                        <h1 style={{ fontSize: '1.65rem', margin: 0 }}>Trading Journals</h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Select or create a journal to start logging your trades.</p>
                </div>
                <button
                    onClick={openCreate}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                        padding: '0.6rem 1.1rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(135deg, var(--accent-primary), #6366f1)',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        border: 'none',
                        boxShadow: '0 4px 14px var(--accent-glow)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                    }}
                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px var(--accent-glow)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px var(--accent-glow)'; }}
                >
                    <Plus size={16} />
                    New Journal
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {journals?.map(journal => {
                    const isActive = activeJournalId === journal.id;
                    return (
                        <div
                            key={journal.id}
                            onClick={() => handleSelectJournal(journal.id as number)}
                            style={{
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0',
                                border: isActive ? '1.5px solid var(--accent-primary)' : '1px solid var(--card-border)',
                                borderRadius: 'var(--radius-md)',
                                position: 'relative',
                                background: 'var(--card-bg)',
                                boxShadow: isActive ? '0 0 0 3px var(--accent-glow), var(--card-shadow-md)' : 'var(--card-shadow-sm)',
                                transition: 'all var(--transition-fast)',
                                overflow: 'hidden',
                            }}
                            onMouseOver={e => { if (!isActive) { e.currentTarget.style.boxShadow = 'var(--card-shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                            onMouseOut={e => { if (!isActive) { e.currentTarget.style.boxShadow = 'var(--card-shadow-sm)'; e.currentTarget.style.transform = 'none'; } }}
                        >
                            {/* Top accent bar */}
                            <div style={{ height: '3px', background: isActive ? 'linear-gradient(90deg, var(--accent-primary), #7c3aed)' : 'var(--card-border)', transition: 'background var(--transition-fast)' }} />

                            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                                {/* Card header */}
                                <div className="flex-between">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            background: isActive ? 'linear-gradient(135deg, #4f7cf6, #7c3aed)' : 'var(--bg-tertiary)',
                                            padding: '0.6rem',
                                            borderRadius: 'var(--radius-sm)',
                                            display: 'flex',
                                            boxShadow: isActive ? '0 4px 10px var(--accent-glow)' : 'none',
                                            transition: 'all var(--transition-fast)',
                                        }}>
                                            <BookOpen size={18} color={isActive ? '#fff' : 'var(--text-muted)'} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>{journal.name}</div>
                                            {isActive && <span className="badge badge-accent" style={{ marginTop: '0.2rem', display: 'inline-flex' }}>Active</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.15rem' }}>
                                        <button
                                            onClick={(e) => openEdit(e, journal)}
                                            style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', transition: 'all var(--transition-fast)' }}
                                            onMouseOver={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                                            onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <Edit2 size={15} />
                                        </button>
                                        <button
                                            onClick={(e) => openDelete(e, journal)}
                                            style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', transition: 'all var(--transition-fast)' }}
                                            onMouseOver={e => { e.currentTarget.style.color = 'var(--loss-color)'; e.currentTarget.style.background = 'var(--loss-bg)'; }}
                                            onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                {/* Balance stat */}
                                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Starting Balance</div>
                                        <div style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
                                            ${journal.startingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)', opacity: isActive ? 1 : 0.4, transition: 'all var(--transition-fast)' }}>
                                        <TrendingUp size={20} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {!journals?.length && (
                    <div
                        style={{
                            gridColumn: '1 / -1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4rem 2rem',
                            gap: '1rem',
                            background: 'var(--card-bg)',
                            border: '1.5px dashed var(--border-color)',
                            borderRadius: 'var(--radius-lg)',
                        }}
                    >
                        <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }}>
                            <BookOpen size={36} color="var(--text-muted)" />
                        </div>
                        <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>No journals yet</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0, textAlign: 'center' }}>Create your first trading journal to start tracking your performance.</p>
                        <button
                            onClick={openCreate}
                            style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--accent-primary), #6366f1)', color: '#fff', fontWeight: 600, fontSize: '0.875rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px var(--accent-glow)' }}
                        >
                            <Plus size={16} /> Create First Journal
                        </button>
                    </div>
                )}
            </div>

            {/* CREATE MODAL */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Journal">
                <form onSubmit={handleCreateJournal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input label="Journal Name" placeholder="e.g. 2024 Forex Account" value={name} onChange={e => setName(e.target.value)} />
                    <Input label="Starting Balance ($)" type="number" step="0.01" placeholder="10000.00" value={startingBalance} onChange={e => setStartingBalance(e.target.value)} />
                    {error && <p className="text-loss" style={{ fontSize: '0.875rem', margin: 0 }}>{error}</p>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Create Journal</Button>
                    </div>
                </form>
            </Modal>

            {/* EDIT MODAL */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Journal">
                <form onSubmit={handleEditJournal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input label="Journal Name" placeholder="e.g. 2024 Forex Account" value={name} onChange={e => setName(e.target.value)} />
                    <Input label="Starting Balance ($)" type="number" step="0.01" placeholder="10000.00" value={startingBalance} onChange={e => setStartingBalance(e.target.value)} />
                    {error && <p className="text-loss" style={{ fontSize: '0.875rem', margin: 0 }}>{error}</p>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </Modal>

            {/* DELETE MODAL */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Journal">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p>Are you sure you want to delete <strong>{selectedJournal?.name}</strong>?</p>
                    <p className="text-loss" style={{ fontSize: '0.9rem', padding: '0.75rem', background: 'var(--loss-bg)', borderRadius: 'var(--radius-sm)' }}>
                        Warning: This will permanently delete the journal and all of its logged trades. This action cannot be undone.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleDeleteJournal} style={{ background: 'var(--loss-color)', color: '#fff' }}>Delete Journal</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
