import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, X, Download, Upload, Settings as GearIcon, ListTodo } from 'lucide-react';
import { db } from '../../db/db';
import type { StrategyDefinition } from '../../db/db';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

// SUB-MODAL FOR STRATEGY BUILDER
const StrategyBuilderModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    strategyName: string;
    initialChecklist: StrategyDefinition['checklist'];
    onSave: (name: string, checklist: StrategyDefinition['checklist']) => void;
}> = ({ isOpen, onClose, strategyName, initialChecklist, onSave }) => {
    const [name, setName] = useState(strategyName);
    const [checklist, setChecklist] = useState<StrategyDefinition['checklist']>(initialChecklist);
    const [newSectionName, setNewSectionName] = useState('');
    const [newQuestionText, setNewQuestionText] = useState('');
    const [targetSectionIdx, setTargetSectionIdx] = useState<number | null>(null);

    React.useEffect(() => {
        setName(strategyName);
        setChecklist(initialChecklist);
    }, [strategyName, initialChecklist, isOpen]);

    const addSection = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSectionName.trim()) return;
        setChecklist([...checklist, { section: newSectionName.trim(), questions: [] }]);
        setNewSectionName('');
    };

    const removeSection = (idx: number) => {
        setChecklist(checklist.filter((_, i) => i !== idx));
    };

    const addQuestion = (e: React.FormEvent) => {
        e.preventDefault();
        if (targetSectionIdx === null || !newQuestionText.trim()) return;

        const updated = [...checklist];
        updated[targetSectionIdx].questions.push(newQuestionText.trim());
        setChecklist(updated);
        setNewQuestionText('');
        setTargetSectionIdx(null);
    };

    const removeQuestion = (secIdx: number, qIdx: number) => {
        const updated = [...checklist];
        updated[secIdx].questions = updated[secIdx].questions.filter((_, i) => i !== qIdx);
        setChecklist(updated);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Builder: ${name || 'New Strategy'}`} width="600px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <Input label="Strategy Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Trend Following" />

                <div>
                    <h4 className="flex-between text-secondary" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        Checklist Sections
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                        {checklist.length === 0 && <span className="text-muted" style={{ fontSize: '0.875rem' }}>No sections yet. Add one below (e.g., "Market Structure").</span>}

                        {checklist.map((c, sIdx) => (
                            <div key={sIdx} className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                                <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: 600 }}>{c.section}</span>
                                    <button onClick={() => removeSection(sIdx)} className="text-loss"><X size={16} /></button>
                                </div>

                                <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {c.questions.map((q, qIdx) => (
                                        <li key={qIdx} className="text-secondary" style={{ fontSize: '0.875rem' }}>
                                            <div className="flex-between">
                                                <span>{q}</span>
                                                <button onClick={() => removeQuestion(sIdx, qIdx)} style={{ color: 'var(--text-muted)' }}><X size={14} /></button>
                                            </div>
                                        </li>
                                    ))}
                                    {c.questions.length === 0 && <li className="text-muted" style={{ fontSize: '0.75rem', listStyle: 'none', marginLeft: '-1.5rem' }}>No questions added.</li>}
                                </ul>

                                {targetSectionIdx === sIdx ? (
                                    <form onSubmit={addQuestion} style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Input placeholder="e.g. Is the M15 bullish?" value={newQuestionText} onChange={e => setNewQuestionText(e.target.value)} style={{ marginBottom: 0, padding: '0.4rem 0.6rem', fontSize: '0.875rem' }} autoFocus />
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setTargetSectionIdx(null)}>Cancel</Button>
                                        <Button type="submit" size="sm">Add</Button>
                                    </form>
                                ) : (
                                    <Button variant="ghost" size="sm" icon={<Plus size={14} />} onClick={() => setTargetSectionIdx(sIdx)}>Add Check</Button>
                                )}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={addSection} style={{ display: 'flex', gap: '0.5rem' }}>
                        <Input placeholder="New Section (e.g. Execution)" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} style={{ marginBottom: 0 }} />
                        <Button type="submit" variant="secondary" icon={<Plus size={16} />}>Add Section</Button>
                    </form>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onSave(name, checklist)}>Save Strategy</Button>
                </div>
            </div>
        </Modal>
    );
};

// MAIN SETTINGS MODAL
interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const settings = useLiveQuery(() => db.settings.toCollection().first());

    const [newPair, setNewPair] = useState('');

    const [builderOpen, setBuilderOpen] = useState(false);
    const [editingStrategy, setEditingStrategy] = useState<StrategyDefinition | null>(null);

    const handleAddPair = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings || !newPair.trim()) return;
        if (!settings.pairs.includes(newPair.trim().toUpperCase())) {
            await db.settings.update(settings.id!, {
                pairs: [...settings.pairs, newPair.trim().toUpperCase()]
            });
        }
        setNewPair('');
    };

    const handleRemovePair = async (pairToRemove: string) => {
        if (!settings) return;
        await db.settings.update(settings.id!, {
            pairs: settings.pairs.filter(p => p !== pairToRemove)
        });
    };

    const openNewStrategyBuilder = () => {
        setEditingStrategy({ name: '', checklist: [] });
        setBuilderOpen(true);
    };

    const openEditStrategyBuilder = (strat: StrategyDefinition) => {
        setEditingStrategy(strat);
        setBuilderOpen(true);
    };

    const handleRemoveStrategy = async (strToRemove: string) => {
        if (!settings) return;
        await db.settings.update(settings.id!, {
            strategies: settings.strategies.filter(s => s.name !== strToRemove)
        });
    };

    const handleSaveStrategy = async (name: string, checklist: StrategyDefinition['checklist']) => {
        if (!settings || !name.trim()) return;

        let updatedStrategies = [...settings.strategies];

        // If we were editing an existing one, find and replace it
        if (editingStrategy && editingStrategy.name) {
            const idx = updatedStrategies.findIndex(s => s.name === editingStrategy.name);
            if (idx !== -1) {
                updatedStrategies[idx] = { name: name.trim(), checklist };
            } else {
                updatedStrategies.push({ name: name.trim(), checklist });
            }
        } else {
            // New strategy
            // Prevent exact duplicates of name
            if (!updatedStrategies.find(s => s.name === name.trim())) {
                updatedStrategies.push({ name: name.trim(), checklist });
            }
        }

        await db.settings.update(settings.id!, {
            strategies: updatedStrategies
        });
        setBuilderOpen(false);
    };

    // --- Export / Import ---
    const handleExport = async () => {
        const data = {
            journals: await db.journals.toArray(),
            trades: await db.trades.toArray(),
            settings: await db.settings.toArray()
        };

        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trading_journal_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                const data = JSON.parse(text);

                if (data.journals && data.trades && data.settings) {
                    if (window.confirm('This will overwrite all existing data. Continue?')) {
                        await db.transaction('rw', db.journals, db.trades, db.settings, async () => {
                            await db.journals.clear();
                            await db.trades.clear();
                            await db.settings.clear();

                            await db.journals.bulkAdd(data.journals);
                            await db.trades.bulkAdd(data.trades);
                            await db.settings.bulkAdd(data.settings);
                        });
                        alert('Import successful!');
                        window.location.reload();
                    }
                } else {
                    alert('Invalid backup file format.');
                }
            } catch (err) {
                console.error(err);
                alert('Failed to import data.');
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Settings & Sync" width="600px">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Data Sync */}
                    <div>
                        <h4 className="flex-between text-secondary" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            Backup & Sync
                        </h4>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button variant="secondary" icon={<Download size={18} />} onClick={handleExport}>
                                Export Backup (JSON)
                            </Button>
                            <Button variant="secondary" icon={<Upload size={18} />} onClick={() => fileInputRef.current?.click()}>
                                Import Backup
                            </Button>
                            <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
                        </div>
                        <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            Export your data to a device storage file. If using multiple devices, you can share this file via Google Drive.
                        </p>
                    </div>

                    {/* Currency Pairs */}
                    <div>
                        <h4 className="flex-between text-secondary" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            Manage Currency Pairs
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                            {settings?.pairs.map(pair => (
                                <span key={pair} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
                                    {pair}
                                    <button onClick={() => handleRemovePair(pair)} style={{ color: 'var(--loss-color)', marginLeft: '0.25rem' }}><X size={14} /></button>
                                </span>
                            ))}
                        </div>
                        <form onSubmit={handleAddPair} style={{ display: 'flex', gap: '0.5rem' }}>
                            <Input placeholder="e.g. AUDUSD" value={newPair} onChange={e => setNewPair(e.target.value)} style={{ marginBottom: 0 }} />
                            <Button type="submit" size="sm" icon={<Plus size={16} />}>Add</Button>
                        </form>
                    </div>

                    {/* Strategies */}
                    <div>
                        <div className="flex-between" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            <h4 className="text-secondary" style={{ margin: 0 }}>Manage Strategies</h4>
                            <Button variant="ghost" size="sm" icon={<Plus size={16} />} onClick={openNewStrategyBuilder}>Build New</Button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {settings?.strategies.map(strat => (
                                <div key={strat.name} className="flex-between glass-panel" style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <ListTodo size={18} className="text-accent-primary" />
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1rem' }}>{strat.name}</h4>
                                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                {strat.checklist.length} sections, {strat.checklist.reduce((acc, c) => acc + c.questions.length, 0)} questions
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Button variant="secondary" size="sm" icon={<GearIcon size={14} />} onClick={() => openEditStrategyBuilder(strat)}>Edit</Button>
                                        <Button variant="danger" size="sm" onClick={() => handleRemoveStrategy(strat.name)}><X size={14} /></Button>
                                    </div>
                                </div>
                            ))}
                            {(!settings?.strategies || settings.strategies.length === 0) && (
                                <span className="text-muted" style={{ fontSize: '0.875rem' }}>No strategies defined. Build one to utilize the checklist feature!</span>
                            )}
                        </div>
                    </div>

                </div>
            </Modal>

            {editingStrategy && (
                <StrategyBuilderModal
                    isOpen={builderOpen}
                    onClose={() => setBuilderOpen(false)}
                    strategyName={editingStrategy.name}
                    initialChecklist={editingStrategy.checklist}
                    onSave={handleSaveStrategy}
                />
            )}
        </>
    );
};
