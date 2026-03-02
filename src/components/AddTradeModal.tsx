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

    // Form State
    const [journalId, setJournalId] = useState<number>(0);
    const [openDate, setOpenDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [closeDate, setCloseDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [pair, setPair] = useState('');
    const [timeframe, setTimeframe] = useState('');
    const [strategy, setStrategy] = useState('');
    const [direction, setDirection] = useState<'Buy' | 'Sell'>('Buy');
    const [lots, setLots] = useState<number | ''>(1.0);
    const [result, setResult] = useState<TradeResult>('Win');
    const [rr, setRr] = useState<number | ''>('');
    const [sl, setSl] = useState<number | ''>('');
    const [tp, setTp] = useState<number | ''>('');
    const [pnl, setPnl] = useState<number | ''>('');
    const [netPnl, setNetPnl] = useState<number | ''>('');
    const [tvLink, setTvLink] = useState('');
    const [screenshotUrl, setScreenshotUrl] = useState('');
    const [emotionNote, setEmotionNote] = useState('');
    const [emotionRatings, setEmotionRatings] = useState<Record<string, number>>({
        fomo: 3,
        patience: 3,
        discipline: 3,
        confidence: 3
    });
    const [technicalNote, setTechnicalNote] = useState('');
    const [checklistAnswers, setChecklistAnswers] = useState<Record<string, any>>({});

    const timeframes = ['1m', '3m', '5m', '15m', '30m', '1H', '4H', 'Daily', 'Weekly'];

    // Define reset to defaults
    const resetForm = (jId: number, setPairDefault: string, setStratDefault: string) => {
        setJournalId(jId);
        setOpenDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
        setCloseDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
        setPair(setPairDefault);
        setTimeframe('15m');
        setStrategy(setStratDefault);
        setDirection('Buy');
        setLots(1.0);
        setResult('Win');
        setRr('');
        setSl('');
        setTp('');
        setPnl('');
        setNetPnl('');
        setTvLink('');
        setScreenshotUrl('');
        setEmotionNote('');
        setEmotionRatings({ fomo: 3, patience: 3, discipline: 3, confidence: 3 });
        setTechnicalNote('');
        setChecklistAnswers({});
    };

    // Auto-fill or Load Draft logic
    useEffect(() => {
        if (!isOpen || !journals || journals.length === 0 || !settings) return;

        if (tradeToEdit) {
            setJournalId(tradeToEdit.journalId);
            setOpenDate(tradeToEdit.openDate);
            setCloseDate(tradeToEdit.closeDate);
            setPair(tradeToEdit.pair);
            setTimeframe(tradeToEdit.timeframe || '15m');
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
            setScreenshotUrl(tradeToEdit.screenshotUrl || '');
            const em = tradeToEdit.notes.emotion;
            if (typeof em === 'string') {
                setEmotionNote(em || '');
                setEmotionRatings({ fomo: 3, patience: 3, discipline: 3, confidence: 3 });
            } else if (em) {
                setEmotionNote(em.text || '');
                setEmotionRatings({
                    fomo: em.fomo || 3,
                    patience: em.patience || 3,
                    discipline: em.discipline || 3,
                    confidence: em.confidence || 3
                });
            } else {
                setEmotionNote('');
                setEmotionRatings({ fomo: 3, patience: 3, discipline: 3, confidence: 3 });
            }
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
                setOpenDate(draft.openDate || format(new Date(), "yyyy-MM-dd'T'HH:mm"));
                setCloseDate(draft.closeDate || format(new Date(), "yyyy-MM-dd'T'HH:mm"));
                setPair(draft.pair || (settings.pairs.length > 0 ? settings.pairs[0] : ''));
                setTimeframe(draft.timeframe || '15m');
                setStrategy(draft.strategy || (settings.strategies.length > 0 ? settings.strategies[0].name : ''));
                setDirection(draft.direction || 'Buy');
                setLots(draft.lots ?? 1.0);
                setResult(draft.result || 'Win');
                setRr(draft.rr ?? '');
                setSl(draft.sl ?? '');
                setTp(draft.tp ?? '');
                setPnl(draft.pnl ?? '');
                setNetPnl(draft.netPnl ?? '');
                setTvLink(draft.tvLink || '');
                setScreenshotUrl(draft.screenshotUrl || '');
                setEmotionNote(draft.emotionNote || '');
                setEmotionRatings(draft.emotionRatings || { fomo: 3, patience: 3, discipline: 3, confidence: 3 });
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, journalId, journals, settings, tradeToEdit]); // intentionally omitting pair/strategy variables to prevent overwriting user edits

    // Auto-calculate RR
    useEffect(() => {
        const slNum = Number(sl);
        const tpNum = Number(tp);
        if (slNum > 0 && tpNum > 0) {
            setRr(+(tpNum / slNum).toFixed(2));
        } else if (slNum === 0 || tpNum === 0) {
            setRr('');
        }
    }, [sl, tp]);

    const handleSaveDraft = () => {
        if (journalId === 0 || tradeToEdit) return; // Don't save drafts when editing
        const draft = {
            openDate, closeDate, pair, timeframe, strategy, direction, lots, result, rr, sl, tp, pnl, netPnl,
            tvLink, screenshotUrl, emotionNote, emotionRatings, technicalNote, checklistAnswers
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

    const handleChecklistChange = (question: string, answer: any) => {
        setChecklistAnswers(prev => ({ ...prev, [question]: answer }));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (journalId === 0 || !pair || !strategy) {
            alert("Please fill all required fields.");
            return;
        }

        const newDateStr = openDate.split('T')[0];
        // B2 fix: get ALL trades for the new date, excluding the trade being edited
        const sameDayTrades = await db.trades
            .where('journalId').equals(journalId)
            .filter(t => t.openDate.startsWith(newDateStr) && t.id !== tradeToEdit?.id)
            .toArray();

        // Preserve tradeNumber only if the date hasn't changed
        const originalDateStr = tradeToEdit?.openDate.split('T')[0];
        const isSameDayEdit = tradeToEdit && originalDateStr === newDateStr;
        const tradeNumber = isSameDayEdit ? tradeToEdit.tradeNumber : sameDayTrades.length + 1;
        const durationMin = differenceInMinutes(new Date(closeDate), new Date(openDate));

        const newTrade: Trade = {
            journalId, openDate, closeDate, pair, timeframe, strategy, direction,
            tradeNumber,
            lots: Number(lots) || 0,
            result,
            rr: Number(rr) || 0,
            sl: Number(sl) || 0,
            tp: Number(tp) || 0,
            pnl: Number(pnl) || 0,
            netPnl: Number(netPnl) || 0,
            tvLink,
            screenshotUrl,
            notes: {
                emotion: {
                    text: emotionNote,
                    fomo: emotionRatings.fomo,
                    patience: emotionRatings.patience,
                    discipline: emotionRatings.discipline,
                    confidence: emotionRatings.confidence
                },
                technical: technicalNote,
                other: ''
            },
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={tradeToEdit ? "Edit Trade" : "Log a Trade"} width="800px">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* --- Section 1: Core Details --- */}
                <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <h4 className="text-secondary" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Core Execution
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
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
                        <Select
                            label="Currency Pair"
                            value={pair}
                            onChange={e => setPair(e.target.value)}
                            options={settings ? settings.pairs.map(p => ({ label: p, value: p })) : []}
                        />
                        <Select
                            label="Timeframe"
                            value={timeframe}
                            onChange={e => setTimeframe(e.target.value)}
                            options={timeframes.map(tf => ({ label: tf, value: tf }))}
                        />
                        <Select
                            label="Strategy / Setup"
                            value={strategy}
                            onChange={e => { setStrategy(e.target.value); setChecklistAnswers({}); }}
                            options={settings ? settings.strategies.map(s => ({ label: s.name, value: s.name })) : []}
                        />
                    </div>
                </div>

                {/* --- Section 2: Timing & Parameters --- */}
                <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <h4 className="text-secondary" style={{ marginBottom: '1rem' }}>Timing & Parameters</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <Input type="datetime-local" label="Open Date" value={openDate} onChange={e => setOpenDate(e.target.value)} required />
                        <Input type="datetime-local" label="Close Date" value={closeDate} onChange={e => setCloseDate(e.target.value)} required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                        <Input type="number" step="0.01" label="Lots" value={lots} onChange={e => setLots(Number(e.target.value))} />
                        <Input type="number" step="0.1" label={`SL (${settings?.pairUnits?.[pair] || 'pips'})`} value={sl} onChange={e => setSl(Number(e.target.value))} />
                        <Input type="number" step="0.1" label={`TP (${settings?.pairUnits?.[pair] || 'pips'})`} value={tp} onChange={e => setTp(Number(e.target.value))} />
                        <Input type="number" step="0.1" label="Risk:Reward" value={rr} onChange={e => setRr(Number(e.target.value))} />
                    </div>
                </div>

                {/* --- Section 3: Results --- */}
                <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <h4 className="text-secondary" style={{ marginBottom: '1rem' }}>Financial Result</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
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
                        <Input
                            type="number"
                            step="0.01"
                            label="Gross PnL ($)"
                            value={pnl}
                            onChange={e => {
                                const val = Number(e.target.value);
                                setPnl(val);
                                // Auto-fill net pnl if they match or if net pnl is empty
                                if (netPnl === pnl || netPnl === '' || netPnl === 0) {
                                    setNetPnl(val);
                                }
                            }}
                        />
                        <Input
                            type="number"
                            step="0.01"
                            label="Net PnL ($)"
                            value={netPnl}
                            onChange={e => setNetPnl(Number(e.target.value))}
                        />
                    </div>
                </div>

                {/* --- Section 4: Notes & Media --- */}
                <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <h4 className="text-secondary" style={{ marginBottom: '1rem' }}>Review & Media</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <Input type="url" label="TradingView Profile Link" placeholder="https://www.tradingview.com/u/..." value={tvLink} onChange={e => setTvLink(e.target.value)} />
                        <Input type="url" label="Chart Screenshot Link" placeholder="https://www.tradingview.com/x/..." value={screenshotUrl} onChange={e => setScreenshotUrl(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Technical Notes</label>
                        <textarea
                            className="input-base"
                            rows={3}
                            value={technicalNote}
                            onChange={e => setTechnicalNote(e.target.value)}
                            placeholder="What did price action tell you?"
                            style={{ resize: 'vertical' }}
                        />
                    </div>
                </div>

                {/* --- Section 5: Psychology & Checklist --- */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                    {/* Emotion Tracker */}
                    <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 className="text-secondary" style={{ margin: 0 }}>Emotion Tracker</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>1-5 Rating</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            {['fomo', 'patience', 'discipline', 'confidence'].map(emo => (
                                <div key={emo} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{emo}</label>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 500 }}>{emotionRatings[emo]}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.2rem', background: 'var(--bg-tertiary)', padding: '0.2rem', borderRadius: '4px' }}>
                                        {[1, 2, 3, 4, 5].map(val => (
                                            <div
                                                key={val}
                                                onClick={() => setEmotionRatings(prev => ({ ...prev, [emo]: val }))}
                                                style={{
                                                    flex: 1, height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.75rem', fontWeight: emotionRatings[emo] === val ? 600 : 400, cursor: 'pointer', borderRadius: '3px',
                                                    background: emotionRatings[emo] === val ? 'var(--accent-primary)' : 'transparent',
                                                    color: emotionRatings[emo] === val ? '#fff' : 'var(--text-primary)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                {val}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Emotional Notes</label>
                            <textarea
                                className="input-base"
                                rows={2}
                                value={emotionNote}
                                onChange={e => setEmotionNote(e.target.value)}
                                placeholder="Execution or mood thoughts?"
                                style={{ fontSize: '0.9rem', resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    {/* Pre-Trade Checklist */}
                    {activeStrategy && activeStrategy.checklist && activeStrategy.checklist.length > 0 && (
                        <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--accent-primary)' }}>
                            <h4 className="text-accent-primary" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <span style={{ fontSize: '1.2rem' }}>⚡</span> Pre-Trade Checklist
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                                {activeStrategy.checklist.map((section, sIdx) => (
                                    <div key={sIdx}>
                                        <h5 className="text-secondary" style={{ marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>{section.section}</h5>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--border-color)' }}>
                                            {section.questions.map((q, qIdx) => (
                                                <div key={qIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                    <input
                                                        type="checkbox"
                                                        id={`checklist-${sIdx}-${qIdx}`}
                                                        checked={!!checklistAnswers[q]}
                                                        onChange={(e) => handleChecklistChange(q, e.target.checked)}
                                                        style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)', cursor: 'pointer', marginTop: '0.15rem' }}
                                                    />
                                                    <label htmlFor={`checklist-${sIdx}-${qIdx}`} style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer', margin: 0, lineHeight: 1.4 }}>
                                                        {q}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <Button type="button" variant="ghost" className="text-loss" onClick={handleDeleteDraft}>
                        Delete
                    </Button>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Button type="button" variant="ghost" onClick={handleSaveDraft}>
                            Save Draft
                        </Button>
                        <Button type="submit">
                            Submit Trade
                        </Button>
                    </div>
                </div>

            </form>
        </Modal>
    );
};
