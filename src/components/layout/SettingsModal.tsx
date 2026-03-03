import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, X, Download, Upload, ListTodo, Pencil, ChevronRight } from 'lucide-react';
import { db } from '../../db/db';
import type { StrategyDefinition } from '../../db/db';
import { Modal } from '../ui/Modal';
import { Input, Select } from '../ui/Input';
import { Button } from '../ui/Button';

/* ─────────────────────────────────────────────────────────────── */
/* Section Card wrapper                                            */
/* A self-contained, visually distinct panel for each settings     */
/* section — background + border creates clear separation.         */
/* ─────────────────────────────────────────────────────────────── */
const SectionCard: React.FC<{
    label: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}> = ({ label, action, children }) => (
    <div
        style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
        }}
    >
        {/* Section header band */}
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1.25rem',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-tertiary)',
            }}
        >
            <span
                style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                }}
            >
                {label}
            </span>
            {action}
        </div>

        {/* Section body */}
        <div style={{ padding: '1.25rem' }}>
            {children}
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────────── */
/* Toggle switch                                                   */
/* ─────────────────────────────────────────────────────────────── */
const Toggle: React.FC<{ checked: boolean; onChange: () => void; label: string; description?: string }> = ({
    checked, onChange, label, description
}) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
        }}
    >
        <div>
            <p style={{ fontWeight: 500, fontSize: '0.9rem', margin: 0, lineHeight: 1.4 }}>{label}</p>
            {description && (
                <p className="text-muted" style={{ fontSize: '0.78rem', margin: 0, marginTop: 2, lineHeight: 1.5 }}>
                    {description}
                </p>
            )}
        </div>
        <button
            onClick={onChange}
            aria-checked={checked}
            role="switch"
            style={{
                position: 'relative',
                width: 44,
                height: 26,
                borderRadius: 'var(--radius-round)',
                background: checked ? 'var(--accent-primary)' : 'var(--bg-primary)',
                border: '1px solid ' + (checked ? 'var(--accent-primary)' : 'var(--border-color)'),
                transition: 'background var(--transition-normal), border-color var(--transition-normal)',
                flexShrink: 0,
                cursor: 'pointer',
            }}
        >
            <span
                style={{
                    position: 'absolute',
                    top: 3,
                    left: checked ? 21 : 3,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
                    transition: 'left var(--transition-normal)',
                }}
            />
        </button>
    </div>
);

/* ─────────────────────────────────────────────────────────────── */
/* Strategy Builder Sub-modal                                      */
/* ─────────────────────────────────────────────────────────────── */
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

    const removeSection = (idx: number) => setChecklist(checklist.filter((_, i) => i !== idx));

    const addQuestion = (e: React.FormEvent) => {
        e.preventDefault();
        if (targetSectionIdx === null || !newQuestionText.trim()) return;
        if (totalQuestions >= MAX_CHECKLIST) {
            alert(`Maximum ${MAX_CHECKLIST} checklist items allowed per strategy.`);
            return;
        }
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

    const totalQuestions = checklist.reduce((acc, c) => acc + c.questions.length, 0);
    const MAX_CHECKLIST = 20;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Builder: ${name || 'New Strategy'}`} width="600px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <Input label="Strategy Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Trend Following" />

                <SectionCard
                    label="Checklist Sections"
                    action={
                        <span style={{
                            fontSize: '0.72rem', fontWeight: 700,
                            color: totalQuestions >= MAX_CHECKLIST ? 'var(--loss-color)' : 'var(--text-muted)',
                            background: totalQuestions >= MAX_CHECKLIST ? 'var(--loss-bg)' : 'var(--bg-primary)',
                            padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-round)',
                            border: '1px solid ' + (totalQuestions >= MAX_CHECKLIST ? 'rgba(239,68,68,0.3)' : 'var(--border-color)')
                        }}>
                            {totalQuestions}/{MAX_CHECKLIST} checks
                        </span>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        {checklist.length === 0 && (
                            <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                                No sections yet. Add one below (e.g., "Market Structure").
                            </p>
                        )}

                        {checklist.map((c, sIdx) => (
                            <div
                                key={sIdx}
                                style={{
                                    padding: '1rem',
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)',
                                }}
                            >
                                <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.section}</span>
                                    <Button variant="ghost" size="sm" onClick={() => removeSection(sIdx)}>
                                        <X size={14} />
                                    </Button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>
                                    {c.questions.map((q, qIdx) => (
                                        <div key={qIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <ChevronRight size={12} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                                                {q}
                                            </span>
                                            <Button variant="ghost" size="sm" onClick={() => removeQuestion(sIdx, qIdx)}>
                                                <X size={13} />
                                            </Button>
                                        </div>
                                    ))}
                                    {c.questions.length === 0 && (
                                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>No checks yet.</span>
                                    )}
                                </div>

                                {targetSectionIdx === sIdx ? (
                                    <form onSubmit={addQuestion} style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Input
                                            placeholder="e.g. Is the M15 bullish?"
                                            value={newQuestionText}
                                            onChange={e => setNewQuestionText(e.target.value)}
                                            style={{ marginBottom: 0 }}
                                            autoFocus
                                        />
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setTargetSectionIdx(null)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" size="sm">Add</Button>
                                    </form>
                                ) : (
                                    <Button variant="ghost" size="sm" icon={<Plus size={14} />} onClick={() => setTargetSectionIdx(sIdx)}>
                                        Add Check
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={addSection} style={{ display: 'flex', gap: '0.5rem' }}>
                        <Input
                            placeholder="New Section (e.g. Execution)"
                            value={newSectionName}
                            onChange={e => setNewSectionName(e.target.value)}
                            style={{ marginBottom: 0 }}
                        />
                        <Button type="submit" variant="secondary" icon={<Plus size={16} />} style={{ flexShrink: 0 }}>
                            Add Section
                        </Button>
                    </form>
                </SectionCard>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onSave(name, checklist)}>Save Strategy</Button>
                </div>
            </div>
        </Modal>
    );
};

/* ─────────────────────────────────────────────────────────────── */
/* Main Settings Modal                                             */
/* ─────────────────────────────────────────────────────────────── */
interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const settings = useLiveQuery(() => db.settings.toCollection().first());

    const [newPair, setNewPair] = useState('');
    const [newPairUnit, setNewPairUnit] = useState('pips');
    const [builderOpen, setBuilderOpen] = useState(false);
    const [editingStrategy, setEditingStrategy] = useState<StrategyDefinition | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddPair = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings || !newPair.trim()) return;
        const pairName = newPair.trim().toUpperCase();
        if (!settings.pairs.includes(pairName)) {
            const updatedUnits = { ...(settings.pairUnits || {}) };
            updatedUnits[pairName] = newPairUnit;
            await db.settings.update(settings.id!, {
                pairs: [...settings.pairs, pairName],
                pairUnits: updatedUnits,
            });
        }
        setNewPair('');
    };

    const handleRemovePair = async (pairToRemove: string) => {
        if (!settings) return;
        await db.settings.update(settings.id!, {
            pairs: settings.pairs.filter(p => p !== pairToRemove),
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

    const handleRemoveStrategy = async (strName: string) => {
        if (!settings) return;
        await db.settings.update(settings.id!, {
            strategies: settings.strategies.filter(s => s.name !== strName),
        });
    };

    const handleSaveStrategy = async (name: string, checklist: StrategyDefinition['checklist']) => {
        if (!settings || !name.trim()) return;
        let updated = [...settings.strategies];
        if (editingStrategy && editingStrategy.name) {
            const idx = updated.findIndex(s => s.name === editingStrategy.name);
            if (idx !== -1) updated[idx] = { name: name.trim(), checklist };
            else updated.push({ name: name.trim(), checklist });
        } else {
            if (!updated.find(s => s.name === name.trim())) {
                updated.push({ name: name.trim(), checklist });
            }
        }
        await db.settings.update(settings.id!, { strategies: updated });
        setBuilderOpen(false);
    };

    const handleExport = async () => {
        const data = {
            journals: await db.journals.toArray(),
            trades: await db.trades.toArray(),
            settings: await db.settings.toArray(),
        };
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trading_journal_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (data.journals && data.trades && data.settings) {
                    if (window.confirm('This will overwrite all existing data. Continue?')) {
                        await db.transaction('rw', db.journals, db.trades, db.settings, async () => {
                            await db.journals.clear(); await db.trades.clear(); await db.settings.clear();
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
            } catch { alert('Failed to import data.'); }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Settings & Sync" width="580px">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* ── Backup & Sync ── */}
                    <SectionCard label="Backup & Sync">
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.875rem' }}>
                            <Button variant="secondary" size="sm" icon={<Download size={15} />} onClick={handleExport}>
                                Export JSON
                            </Button>
                            <Button variant="secondary" size="sm" icon={<Upload size={15} />} onClick={() => fileInputRef.current?.click()}>
                                Import JSON
                            </Button>
                            <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
                        </div>
                        <p className="text-muted" style={{ fontSize: '0.8rem', lineHeight: 1.6, margin: 0 }}>
                            All data is stored locally in your browser. Export regularly or share via Google Drive to sync across devices.
                        </p>
                    </SectionCard>

                    {/* ── Features & Preferences ── */}
                    <SectionCard label="Features & Preferences">
                        <Toggle
                            label="Daily Mood Tracker"
                            description="Log sleep, mood, and diet metrics each day"
                            checked={!!settings?.enableMoodTracker}
                            onChange={async () => {
                                if (!settings) return;
                                await db.settings.update(settings.id!, { enableMoodTracker: !settings.enableMoodTracker });
                            }}
                        />
                    </SectionCard>

                    {/* ── Instrument Pairs ── */}
                    <SectionCard label="Instrument Pairs">
                        {/* Active pair pills */}
                        {settings?.pairs && settings.pairs.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                                {settings.pairs.map(pair => (
                                    <span
                                        key={pair}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                            padding: '0.3rem 0.5rem 0.3rem 0.75rem',
                                            background: 'var(--bg-primary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-round)',
                                            fontSize: '0.8rem',
                                            fontWeight: 500,
                                            color: 'var(--text-primary)',
                                        }}
                                    >
                                        {pair}
                                        {settings.pairUnits?.[pair] && (
                                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                                · {settings.pairUnits[pair]}
                                            </span>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            style={{ padding: '0 2px', minWidth: 0, height: 'auto', color: 'var(--text-muted)' }}
                                            onClick={() => handleRemovePair(pair)}
                                        >
                                            <X size={12} />
                                        </Button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Add pair form */}
                        <form onSubmit={handleAddPair}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                                <Input
                                    label="Pair"
                                    placeholder="e.g. AUDUSD"
                                    value={newPair}
                                    onChange={e => setNewPair(e.target.value)}
                                    style={{ marginBottom: 0 }}
                                />
                                <Select
                                    label="Unit"
                                    value={newPairUnit}
                                    onChange={e => setNewPairUnit(e.target.value)}
                                    options={[
                                        { value: 'pips', label: 'Pips' },
                                        { value: 'points', label: 'Points' },
                                        { value: '%', label: '%' },
                                        { value: '$', label: '$' },
                                    ]}
                                    fullWidth={false}
                                    style={{ marginBottom: 0, width: 120 }}
                                />
                                <div style={{ alignSelf: 'flex-end', flexShrink: 0 }}>
                                    <Button type="submit" size="sm" icon={<Plus size={15} />}>
                                        Add
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </SectionCard>

                    {/* ── Strategies ── */}
                    <SectionCard
                        label="Strategies"
                        action={
                            <Button variant="ghost" size="sm" icon={<Plus size={14} />} onClick={openNewStrategyBuilder}>
                                Build New
                            </Button>
                        }
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {settings?.strategies && settings.strategies.length > 0 ? (
                                settings.strategies.map(strat => (
                                    <div
                                        key={strat.name}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.75rem 1rem',
                                            background: 'var(--bg-primary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 'var(--radius-md)',
                                            transition: 'border-color var(--transition-fast)',
                                        }}
                                        onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--card-border-strong)')}
                                        onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: 34, height: 34,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                borderRadius: 'var(--radius-sm)',
                                                background: 'rgba(59,130,246,0.1)',
                                                color: 'var(--accent-primary)',
                                                flexShrink: 0,
                                            }}>
                                                <ListTodo size={16} />
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0, lineHeight: 1.3 }}>{strat.name}</p>
                                                <p className="text-muted" style={{ fontSize: '0.72rem', margin: 0, lineHeight: 1.3 }}>
                                                    {strat.checklist.length} section{strat.checklist.length !== 1 ? 's' : ''} · {strat.checklist.reduce((acc, c) => acc + c.questions.length, 0)} checks
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={<Pencil size={13} />}
                                                onClick={() => openEditStrategyBuilder(strat)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleRemoveStrategy(strat.name)}
                                                style={{ padding: '0.4rem 0.6rem' }}
                                            >
                                                <X size={13} />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '2rem 1rem',
                                    border: '1px dashed var(--border-color)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.85rem',
                                }}>
                                    No strategies yet —{' '}
                                    <button
                                        onClick={openNewStrategyBuilder}
                                        style={{ color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
                                    >
                                        Build your first
                                    </button>
                                </div>
                            )}
                        </div>
                    </SectionCard>

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
