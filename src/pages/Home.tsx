import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, BookOpen, TrendingUp, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { db, type Journal } from '../db/db';
import { Card } from '../components/ui/Card';
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
            <div className="flex-between" style={{ marginBottom: '2rem', marginTop: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Your Journals</h1>
                    <p className="text-secondary">Select a trading journal or create a new one to start logging.</p>
                </div>
                <Button onClick={openCreate} icon={<Plus size={18} />}>
                    New Journal
                </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {journals?.map(journal => {
                    const isActive = activeJournalId === journal.id;
                    return (
                        <Card
                            key={journal.id}
                            onClick={() => handleSelectJournal(journal.id as number)}
                            style={{
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                border: isActive ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                position: 'relative',
                                background: isActive ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.05) 0%, rgba(30, 41, 59, 0) 100%)' : 'var(--bg-secondary)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {isActive && (
                                <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--bg-primary)', borderRadius: '50%', padding: '2px' }}>
                                    <CheckCircle2 size={24} className="text-gradient" />
                                </div>
                            )}

                            <div className="flex-between">
                                <div className="flex-center" style={{ gap: '0.75rem' }}>
                                    <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                                        <BookOpen size={24} className={isActive ? "text-gradient" : "text-muted"} />
                                    </div>
                                    <h3 style={{ margin: 0 }}>{journal.name}</h3>
                                </div>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button
                                        onClick={(e) => openEdit(e, journal)}
                                        style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}
                                        onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
                                        onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => openDelete(e, journal)}
                                        style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}
                                        onMouseOver={e => e.currentTarget.style.color = 'var(--loss-color)'}
                                        onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span className="text-secondary" style={{ fontSize: '0.875rem' }}>Starting Balance</span>
                                    <p style={{ fontWeight: 600, fontSize: '1.25rem' }}>${journal.startingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                                    <TrendingUp size={24} />
                                </div>
                            </div>
                        </Card>
                    );
                })}

                {!journals?.length && (
                    <div
                        className="flex-center glass-panel"
                        style={{
                            gridColumn: '1 / -1',
                            padding: '4rem 2rem',
                            flexDirection: 'column',
                            gap: '1rem',
                            borderStyle: 'dashed',
                            background: 'transparent'
                        }}
                    >
                        <BookOpen size={48} className="text-muted" />
                        <h3 className="text-muted">No Journals Found</h3>
                        <Button variant="secondary" onClick={openCreate}>Create your first journal</Button>
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
