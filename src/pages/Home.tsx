import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, BookOpen, TrendingUp } from 'lucide-react';
import { db } from '../db/db';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const journals = useLiveQuery(() => db.journals.toArray());
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [startingBalance, setStartingBalance] = useState('');
    const [error, setError] = useState('');

    const handleCreateJournal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Journal name is required.');
            return;
        }
        const balance = parseFloat(startingBalance);
        if (isNaN(balance) || balance < 0) {
            setError('Please enter a valid starting balance.');
            return;
        }

        try {
            const newJournalId = await db.journals.add({
                name: name.trim(),
                startingBalance: balance,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            setIsModalOpen(false);
            setName('');
            setStartingBalance('');
            setError('');
            navigate(`/journal/${newJournalId}`);
        } catch (err) {
            console.error(err);
            setError('Failed to create journal.');
        }
    };

    return (
        <div>
            <div className="flex-between" style={{ marginBottom: '2rem', marginTop: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Your Journals</h1>
                    <p className="text-secondary">Select a trading journal or create a new one to start logging.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} icon={<Plus size={18} />}>
                    New Journal
                </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {journals?.map(journal => (
                    <Card
                        key={journal.id}
                        onClick={() => navigate(`/journal/${journal.id}`)}
                        style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                    >
                        <div className="flex-between">
                            <div className="flex-center" style={{ gap: '0.75rem' }}>
                                <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                                    <BookOpen size={24} className="text-gradient" />
                                </div>
                                <h3 style={{ margin: 0 }}>{journal.name}</h3>
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span className="text-secondary" style={{ fontSize: '0.875rem' }}>Starting Balance</span>
                                <p style={{ fontWeight: 600, fontSize: '1.25rem' }}>${journal.startingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div style={{ color: 'var(--accent-primary)' }}>
                                <TrendingUp size={24} />
                            </div>
                        </div>
                    </Card>
                ))}

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
                        <Button variant="secondary" onClick={() => setIsModalOpen(true)}>Create your first journal</Button>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Journal">
                <form onSubmit={handleCreateJournal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                        label="Journal Name"
                        placeholder="e.g. 2024 Forex Account"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                    <Input
                        label="Starting Balance ($)"
                        type="number"
                        step="0.01"
                        placeholder="10000.00"
                        value={startingBalance}
                        onChange={e => setStartingBalance(e.target.value)}
                    />
                    {error && <p className="text-loss" style={{ fontSize: '0.875rem', margin: 0 }}>{error}</p>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Create Journal</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
