import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, differenceInMinutes } from 'date-fns';
import { db } from '../db/db';
import type { Trade, TradeResult, StrategyDefinition } from '../db/db';
import { Modal } from './ui/Modal';
import { Input, Select } from './ui/Input';
import { Button } from './ui/Button';

interface AddTradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    tradeToEdit?: Trade | null;
}

const getDraftKey = (journalId: number) => `trade_draft_journal_${journalId}`;

export const AddTradeModal: React.FC<AddTradeModalProps> = ({ isOpen, onClose, tradeToEdit }) => {
    const journals = useLiveQuery(() => db.journals.toArray());
    const settings = useLiveQuery(() => db.settings.toCollection().first());

    // Step State
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Form State
    const [journalId, setJournalId] = useState<number>(0);
    const [openDate, setOpenDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [closeDate, setCloseDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [pair, setPair] = useState('');
    const [strategy, setStrategy] = useState('');
    const [direction, setDirection] = useState<'Buy' | 'Sell'>('Buy');
    const [lots, setLots] = useState<number | ''>(1.0);
    const [result, setResult] = useState<TradeResult>('Win');
    const [rr, setRr] = useState<number | ''>(0);
    const [sl, setSl] = useState<number | ''>(0);
    const [tp, setTp] = useState<number | ''>(0);
    const [pnl, setPnl] = useState<number | ''>(0);
    const [netPnl, setNetPnl] = useState<number | ''>(0);
    const [tvLink, setTvLink] = useState('');
    const [emotionNote, setEmotionNote] = useState('');
    const [technicalNote, setTechnicalNote] = useState('');
    const [checklistAnswers, setChecklistAnswers] = useState<Record<string, string>>({});

    // Define reset to defaults
    const resetForm = (jId: number, setPairDefault: string, setStratDefault: string) => {
        setStep(1);
        setJournalId(jId);
        setOpenDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
        setCloseDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
        setPair(setPairDefault);
        setStrategy(setStratDefault);
        setDirection('Buy');
        setLots(1.0);
        setResult('Win');
        setRr(0);
        setSl(0);
        setTp(0);
        setPnl(0);
        setNetPnl(0);
        setTvLink('');
        setEmotionNote('');
        setTechnicalNote('');
        setChecklistAnswers({});
    };

    // Auto-fill or Load Draft logic
    useEffect(() => {
        if (!isOpen || !journals || journals.length === 0 || !settings) return;

        if (tradeToEdit) {
            setStep(1);
            setJournalId(tradeToEdit.journalId);
            setOpenDate(tradeToEdit.openDate);
            setCloseDate(tradeToEdit.closeDate);
            setPair(tradeToEdit.pair);
            setStrategy(tradeToEdit.strategy);
            setDirection(tradeToEdit.direction);
            setLots(tradeToEdit.lots);
            setResult(tradeToEdit.result);
            setRr(tradeToEdit.rr);
            setSl(tradeToEdit.sl);
            setTp(tradeToEdit.tp);
            setPnl(tradeToEdit.pnl);
            setNetPnl(tradeToEdit.netPnl);
            setTvLink(tradeToEdit.tvLink || '');
            setEmotionNote(tradeToEdit.notes.emotion || '');
            setTechnicalNote(tradeToEdit.notes.technical || '');
            setChecklistAnswers(tradeToEdit.checklistAnswers || {});
            return;
        }

        let activeJournalId = journalId;
        if (activeJournalId === 0) {
            activeJournalId = journals[0].id!;
            setJournalId(activeJournalId);
        }

        const draftStr = localStorage.getItem(getDraftKey(activeJournalId));
        if (draftStr) {
            try {
                const draft = JSON.parse(draftStr);
                setStep(draft.step || 1);
                setOpenDate(draft.openDate || format(new Date(), "yyyy-MM-dd'T'HH:mm"));
                setCloseDate(draft.closeDate || format(new Date(), "yyyy-MM-dd'T'HH:mm"));
                setPair(draft.pair || (settings.pairs.length > 0 ? settings.pairs[0] : ''));
                setStrategy(draft.strategy || (settings.strategies.length > 0 ? settings.strategies[0].name : ''));
                setDirection(draft.direction || 'Buy');
                setLots(draft.lots ?? 1.0);
                setResult(draft.result || 'Win');
                setRr(draft.rr ?? 0);
                setSl(draft.sl ?? 0);
                setTp(draft.tp ?? 0);
                setPnl(draft.pnl ?? 0);
                setNetPnl(draft.netPnl ?? 0);
                setTvLink(draft.tvLink || '');
                setEmotionNote(draft.emotionNote || '');
                setTechnicalNote(draft.technicalNote || '');
                setChecklistAnswers(draft.checklistAnswers || {});
            } catch (e) {
                console.error("Failed to parse draft", e);
                resetForm(activeJournalId, settings.pairs[0] || '', settings.strategies[0]?.name || '');
            }
        } else {
            // No draft, just ensure defaults are set if not already
            if (!pair && settings.pairs.length > 0) setPair(settings.pairs[0]);
            if (!strategy && settings.strategies.length > 0) setStrategy(settings.strategies[0].name);
        }
    }, [isOpen, journalId, journals, settings, tradeToEdit]);

    const handleSaveDraft = () => {
        if (journalId === 0 || tradeToEdit) return; // Don't save drafts when editing
        const draft = {
            step, openDate, closeDate, pair, strategy, direction, lots, result, rr, sl, tp, pnl, netPnl,
            tvLink, emotionNote, technicalNote, checklistAnswers
        };
        localStorage.setItem(getDraftKey(journalId), JSON.stringify(draft));
    };

    const handleDeleteDraft = () => {
        if (journalId === 0) return;
        localStorage.removeItem(getDraftKey(journalId));
        if (settings) {
            resetForm(journalId, settings.pairs[0] || '', settings.strategies[0]?.name || '');
        }
    };

    const activeStrategy: StrategyDefinition | undefined = settings?.strategies.find(s => s.name === strategy);

    const handleChecklistChange = (question: string, answer: string) => {
        setChecklistAnswers(prev => ({ ...prev, [question]: answer }));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (journalId === 0 || !pair || !strategy) {
            alert("Please fill all required fields.");
            return;
        }

        const todayStr = openDate.split('T')[0];
        const todaysTrades = await db.trades
            .where('journalId').equals(journalId)
            .filter(t => t.openDate.startsWith(todayStr))
            .toArray();

        // If editing, preserve tradeNumber if it's the same day, else recalculate
        const isSameDayEdit = tradeToEdit && tradeToEdit.openDate.startsWith(todayStr);
        const tradeNumber = isSameDayEdit ? tradeToEdit.tradeNumber : todaysTrades.length + 1;
        const durationMin = differenceInMinutes(new Date(closeDate), new Date(openDate));

        const newTrade: Trade = {
            journalId, openDate, closeDate, pair, strategy, direction,
            tradeNumber,
            lots: Number(lots) || 0,
            result,
            rr: Number(rr) || 0,
            sl: Number(sl) || 0,
            tp: Number(tp) || 0,
            pnl: Number(pnl) || 0,
            netPnl: Number(netPnl) || 0,
            tvLink,
            notes: { emotion: emotionNote, technical: technicalNote, other: '' },
            duration: durationMin >= 0 ? durationMin : 0,
            checklistAnswers: Object.keys(checklistAnswers).length > 0 ? checklistAnswers : undefined
        };

        if (tradeToEdit && tradeToEdit.id) {
            await db.trades.put({ ...newTrade, id: tradeToEdit.id });
        } else {
            await db.trades.add(newTrade);
            localStorage.removeItem(getDraftKey(journalId)); // Clear draft on submit
        }

        if (settings) resetForm(0, settings.pairs[0] || '', settings.strategies[0]?.name || '');
        onClose();
    };

    const handleNext = () => setStep(prev => Math.min(prev + 1, 3) as 1 | 2 | 3);
    const handleBack = () => setStep(prev => Math.max(prev - 1, 1) as 1 | 2 | 3);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={tradeToEdit ? "Edit Trade" : "Log a Trade"} width="600px">

            {/* Step Indicator */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                {[1, 2, 3].map(s => (
                    <div key={s} style={{
                        flex: 1,
                        height: '4px',
                        borderRadius: '2px',
                        background: s <= step ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                        transition: 'var(--transition-fast)'
                    }} />
                ))}
            </div>

            <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '400px' }}>

                {/* ---------------- STEP 1 ---------------- */}
                {step === 1 && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <h4 className="text-secondary" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Core Execution</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Select
                                    label="Journal"
                                    value={journalId}
                                    onChange={e => setJournalId(Number(e.target.value))}
                                    options={journals ? journals.map(j => ({ label: j.name, value: j.id!.toString() })) : []}
                                />
                                <Select
                                    label="Direction"
                                    value={direction}
                                    onChange={e => setDirection(e.target.value as 'Buy' | 'Sell')}
                                    options={[
                                        { label: 'Buy (Long)', value: 'Buy' },
                                        { label: 'Sell (Short)', value: 'Sell' }
                                    ]}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                <Select
                                    label="Currency Pair"
                                    value={pair}
                                    onChange={e => setPair(e.target.value)}
                                    options={settings ? settings.pairs.map(p => ({ label: p, value: p })) : []}
                                />
                                <Select
                                    label="Strategy / Setup"
                                    value={strategy}
                                    onChange={e => { setStrategy(e.target.value); setChecklistAnswers({}); }}
                                    options={settings ? settings.strategies.map(s => ({ label: s.name, value: s.name })) : []}
                                />
                            </div>
                        </div>

                        <div>
                            <h4 className="text-secondary" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Time</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input type="datetime-local" label="Open Date" value={openDate} onChange={e => setOpenDate(e.target.value)} required />
                                <Input type="datetime-local" label="Close Date" value={closeDate} onChange={e => setCloseDate(e.target.value)} required />
                            </div>
                        </div>

                        {activeStrategy && activeStrategy.checklist && activeStrategy.checklist.length > 0 && (
                            <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--accent-primary)', borderRadius: 'var(--radius-md)' }}>
                                <h4 className="text-accent-primary" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.2rem' }}>⚡</span> Pre-Trade Checklist
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    {activeStrategy.checklist.map((section, sIdx) => (
                                        <div key={sIdx}>
                                            <h5 className="text-secondary" style={{ marginBottom: '0.5rem', fontWeight: 600 }}>{section.section}</h5>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--border-color)' }}>
                                                {section.questions.map((q, qIdx) => (
                                                    <div key={qIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        <label style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{q}</label>
                                                        <Input
                                                            placeholder="Your answer..."
                                                            value={checklistAnswers[q] || ''}
                                                            onChange={(e) => handleChecklistChange(q, e.target.value)}
                                                            style={{ marginBottom: 0, padding: '0.5rem', fontSize: '0.875rem' }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ---------------- STEP 2 ---------------- */}
                {step === 2 && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <h4 className="text-secondary" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Trade Parameters</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '1rem' }}>
                                <Input type="number" step="0.01" label="Lots" value={lots} onChange={e => setLots(Number(e.target.value))} />
                                <Input type="number" step="0.1" label="RR" value={rr} onChange={e => setRr(Number(e.target.value))} />
                                <Input type="number" step="0.1" label="SL (pips)" value={sl} onChange={e => setSl(Number(e.target.value))} />
                                <Input type="number" step="0.1" label="TP (pips)" value={tp} onChange={e => setTp(Number(e.target.value))} />
                            </div>
                        </div>

                        <div>
                            <h4 className="text-secondary" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Financial Result</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                                <Select
                                    label="Outcome"
                                    value={result}
                                    onChange={e => setResult(e.target.value as TradeResult)}
                                    options={[
                                        { label: 'Win', value: 'Win' },
                                        { label: 'Loss', value: 'Loss' },
                                        { label: 'Break Even', value: 'Break Even' }
                                    ]}
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <Input type="number" step="0.01" label="Gross PnL ($)" value={pnl} onChange={e => setPnl(Number(e.target.value))} />
                                    <Input type="number" step="0.01" label="Net PnL ($)" value={netPnl} onChange={e => setNetPnl(Number(e.target.value))} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ---------------- STEP 3 ---------------- */}
                {step === 3 && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <h4 className="text-secondary" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Review & Media</h4>
                            <Input type="url" label="TradingView Chart Link" placeholder="https://www.tradingview.com/x/..." value={tvLink} onChange={e => setTvLink(e.target.value)} />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Technical Notes</label>
                                <textarea
                                    className="input-base"
                                    rows={4}
                                    value={technicalNote}
                                    onChange={e => setTechnicalNote(e.target.value)}
                                    placeholder="What did price action tell you?"
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Emotional Notes</label>
                                <textarea
                                    className="input-base"
                                    rows={4}
                                    value={emotionNote}
                                    onChange={e => setEmotionNote(e.target.value)}
                                    placeholder="Were you tilted? FOMO? Patient?"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>

                    <Button type="button" variant="ghost" className="text-loss" onClick={handleDeleteDraft}>
                        Delete
                    </Button>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Button type="button" variant="ghost" onClick={handleSaveDraft}>
                            Save
                        </Button>
                        {step > 1 && (
                            <Button type="button" variant="secondary" onClick={handleBack}>
                                Back
                            </Button>
                        )}
                        {step < 3 && (
                            <Button type="button" variant="ghost" onClick={() => handleSubmit()} style={{ color: 'var(--accent-primary)' }}>
                                Submit Fast
                            </Button>
                        )}
                        {step < 3 ? (
                            <Button type="button" onClick={handleNext}>
                                Next
                            </Button>
                        ) : (
                            <Button type="submit">
                                Submit Trade
                            </Button>
                        )}
                    </div>
                </div>

            </form>
        </Modal>
    );
};
