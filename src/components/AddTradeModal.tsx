import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, differenceInMinutes } from 'date-fns';
import { Settings2, Zap, Clock, DollarSign, Image, Brain, RotateCcw } from 'lucide-react';
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
    const [openDatePart, setOpenDatePart] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [openTimePart, setOpenTimePart] = useState(format(new Date(), 'HH:mm'));
    const [closeDatePart, setCloseDatePart] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [closeTimePart, setCloseTimePart] = useState(format(new Date(), 'HH:mm'));
    // Derived full ISO strings used when saving
    const openDate = `${openDatePart}T${openTimePart}`;
    const closeDate = `${closeDatePart}T${closeTimePart}`;
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
    const [screenshotUrl, setScreenshotUrl] = useState('');
    const [emotionNote, setEmotionNote] = useState('');
    const [emotionRatings, setEmotionRatings] = useState<Record<string, number>>({
        fomo: 0,
        patience: 0,
        discipline: 0,
        confidence: 0
    });
    const [technicalNote, setTechnicalNote] = useState('');
    const [checklistAnswers, setChecklistAnswers] = useState<Record<string, any>>({});

    const timeframes = ['1m', '3m', '5m', '15m', '30m', '1H', '4H', 'Daily', 'Weekly'];

    // Helper to split an ISO string into date/time parts
    const splitDateTime = (iso: string) => {
        const [d, t] = iso.split('T');
        return { date: d || format(new Date(), 'yyyy-MM-dd'), time: (t || '').slice(0, 5) || format(new Date(), 'HH:mm') };
    };

    // Define reset to defaults
    const resetForm = (jId: number, setPairDefault: string, setStratDefault: string) => {
        setJournalId(jId);
        const now = new Date();
        setOpenDatePart(format(now, 'yyyy-MM-dd'));
        setOpenTimePart(format(now, 'HH:mm'));
        setCloseDatePart(format(now, 'yyyy-MM-dd'));
        setCloseTimePart(format(now, 'HH:mm'));
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
        setScreenshotUrl('');
        setEmotionNote('');
        setEmotionRatings({ fomo: 0, patience: 0, discipline: 0, confidence: 0 });
        setTechnicalNote('');
        setChecklistAnswers({});
    };

    // Auto-fill or Load Draft logic
    useEffect(() => {
        if (!isOpen || !journals || journals.length === 0 || !settings) return;

        if (tradeToEdit) {
            setJournalId(tradeToEdit.journalId);
            const od = splitDateTime(tradeToEdit.openDate);
            setOpenDatePart(od.date); setOpenTimePart(od.time);
            const cd = splitDateTime(tradeToEdit.closeDate);
            setCloseDatePart(cd.date); setCloseTimePart(cd.time);
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
                const od = splitDateTime(draft.openDate || format(new Date(), "yyyy-MM-dd'T'HH:mm"));
                setOpenDatePart(od.date); setOpenTimePart(od.time);
                const cd = splitDateTime(draft.closeDate || format(new Date(), "yyyy-MM-dd'T'HH:mm"));
                setCloseDatePart(cd.date); setCloseTimePart(cd.time);
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
                setScreenshotUrl(draft.screenshotUrl || '');
                setEmotionNote(draft.emotionNote || '');
                setEmotionRatings(draft.emotionRatings || { fomo: 0, patience: 0, discipline: 0, confidence: 0 });
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

    // Auto-save draft on every change so the user can close and come back
    useEffect(() => {
        if (journalId === 0 || tradeToEdit) return;
        const draft = {
            openDate, closeDate,
            pair, timeframe, strategy, direction, lots, result, rr, sl, tp, pnl, netPnl,
            screenshotUrl, emotionNote, emotionRatings, technicalNote, checklistAnswers
        };
        localStorage.setItem(getDraftKey(journalId), JSON.stringify(draft));
    }, [journalId, tradeToEdit, openDate, closeDate, pair, timeframe, strategy, direction, lots, result, rr, sl, tp, pnl, netPnl, screenshotUrl, emotionNote, emotionRatings, technicalNote, checklistAnswers]);



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
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* --- Section 1: Core Execution --- */}
                <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', background: 'var(--accent-primary)', opacity: 0.9 }}>
                            <Settings2 size={15} color="#fff" />
                        </div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Core Execution</h4>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <Select label="Journal" value={journalId} onChange={e => setJournalId(Number(e.target.value))} options={journals ? journals.map(j => ({ label: j.name, value: j.id!.toString() })) : []} />
                        <Select label="Direction" value={direction} onChange={e => setDirection(e.target.value as 'Buy' | 'Sell')} options={[{ label: 'Buy (Long)', value: 'Buy' }, { label: 'Sell (Short)', value: 'Sell' }]} />
                        <Select label="Currency Pair" value={pair} onChange={e => setPair(e.target.value)} options={settings ? settings.pairs.map(p => ({ label: p, value: p })) : []} />
                        <Select label="Timeframe" value={timeframe} onChange={e => setTimeframe(e.target.value)} options={timeframes.map(tf => ({ label: tf, value: tf }))} />
                        <Select label="Strategy / Setup" value={strategy} onChange={e => { setStrategy(e.target.value); setChecklistAnswers({}); }} options={settings ? settings.strategies.map(s => ({ label: s.name, value: s.name })) : []} />
                    </div>
                </div>

                {/* --- Section 2: Pre-Trade Checklist --- */}
                {activeStrategy && activeStrategy.checklist && activeStrategy.checklist.length > 0 && (
                    <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', borderLeft: '3px solid var(--accent-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', background: 'var(--accent-primary)', opacity: 0.9 }}>
                                <Zap size={15} color="#fff" />
                            </div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Pre-Trade Checklist</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '280px', overflowY: 'auto' }}>
                            {activeStrategy.checklist.map((section, sIdx) => (
                                <div key={sIdx}>
                                    <h5 style={{ margin: '0 0 0.6rem 0', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{section.section}</h5>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingLeft: '0.75rem', borderLeft: '2px solid var(--border-color)' }}>
                                        {section.questions.map((q, qIdx) => (
                                            <label key={qIdx} htmlFor={`checklist-${sIdx}-${qIdx}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    id={`checklist-${sIdx}-${qIdx}`}
                                                    checked={!!checklistAnswers[q]}
                                                    onChange={(e) => handleChecklistChange(q, e.target.checked)}
                                                    style={{ width: '15px', height: '15px', accentColor: 'var(--accent-primary)', cursor: 'pointer', marginTop: '0.2rem', flexShrink: 0 }}
                                                />
                                                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{q}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- Section 3: Timing & Parameters --- */}
                <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', background: '#6366f1' }}>
                            <Clock size={15} color="#fff" />
                        </div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Timing &amp; Parameters</h4>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.25rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 500 }}>Open Date</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem' }}>
                                <Input type="date" value={openDatePart} onChange={e => setOpenDatePart(e.target.value)} required />
                                <Input type="time" value={openTimePart} onChange={e => setOpenTimePart(e.target.value)} style={{ width: '120px' }} />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 500 }}>Close Date</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem' }}>
                                <Input type="date" value={closeDatePart} onChange={e => setCloseDatePart(e.target.value)} required />
                                <Input type="time" value={closeTimePart} onChange={e => setCloseTimePart(e.target.value)} style={{ width: '120px' }} />
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        <Input type="number" step="0.01" label="Lots" value={lots} onChange={e => setLots(Number(e.target.value))} />
                        <Input type="number" step="0.1" label={`SL (${settings?.pairUnits?.[pair] || 'pips'})`} value={sl} onChange={e => setSl(Number(e.target.value))} />
                        <Input type="number" step="0.1" label={`TP (${settings?.pairUnits?.[pair] || 'pips'})`} value={tp} onChange={e => setTp(Number(e.target.value))} />
                        <Input type="number" step="0.1" label="Risk : Reward" value={rr} onChange={e => setRr(Number(e.target.value))} />
                    </div>
                </div>

                {/* --- Section 4: Financial Result --- */}
                <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', background: '#22c55e' }}>
                            <DollarSign size={15} color="#fff" />
                        </div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Financial Result</h4>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <Select label="Outcome" value={result} onChange={e => setResult(e.target.value as TradeResult)} options={[{ label: 'Win', value: 'Win' }, { label: 'Loss', value: 'Loss' }, { label: 'Break Even', value: 'Break Even' }]} />
                        <Input type="number" step="0.01" label="Gross PnL ($)" value={pnl} onChange={e => { const val = Number(e.target.value); setPnl(val); if (netPnl === pnl || netPnl === '' || netPnl === 0) { setNetPnl(val); } }} />
                        <Input type="number" step="0.01" label="Net PnL ($)" value={netPnl} onChange={e => setNetPnl(Number(e.target.value))} />
                    </div>
                </div>

                {/* --- Section 5: Review & Media --- */}
                <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', background: '#8b5cf6' }}>
                            <Image size={15} color="#fff" />
                        </div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Review &amp; Media</h4>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <Input type="url" label="Chart Screenshot Link" placeholder="https://www.tradingview.com/x/..." value={screenshotUrl} onChange={e => setScreenshotUrl(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Technical Notes</label>
                        <textarea className="input-base" rows={3} value={technicalNote} onChange={e => setTechnicalNote(e.target.value)} placeholder="What did price action tell you?" style={{ resize: 'vertical' }} />
                    </div>
                </div>

                {/* --- Section 6: Emotion Tracker --- */}
                <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', background: '#f59e0b' }}>
                                <Brain size={15} color="#fff" />
                            </div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Emotion Tracker</h4>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>1 – 5</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        {['fomo', 'patience', 'discipline', 'confidence'].map(emo => (
                            <div key={emo} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'capitalize', fontWeight: 500 }}>{emo}</label>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', background: 'var(--bg-tertiary)', padding: '0.1rem 0.35rem', borderRadius: '4px', minWidth: '18px', textAlign: 'center' }}>{emotionRatings[emo]}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-tertiary)', padding: '0.2rem', borderRadius: '6px' }}>
                                    {[1, 2, 3, 4, 5].map(val => (
                                        <div key={val} onClick={() => setEmotionRatings(prev => ({ ...prev, [emo]: val }))} style={{ flex: 1, height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: emotionRatings[emo] === val ? 700 : 400, cursor: 'pointer', borderRadius: '4px', background: emotionRatings[emo] === val ? 'var(--accent-primary)' : 'transparent', color: emotionRatings[emo] === val ? '#fff' : 'var(--text-secondary)', transition: 'all 0.15s ease' }}>
                                            {val}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Emotional Notes</label>
                        <textarea className="input-base" rows={2} value={emotionNote} onChange={e => setEmotionNote(e.target.value)} placeholder="How were you feeling during this trade?" style={{ fontSize: '0.9rem', resize: 'vertical' }} />
                    </div>
                </div>

                {/* --- Footer --- */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <Button type="button" variant="ghost" onClick={handleDeleteDraft} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--loss-color)', padding: '0.4rem 0.75rem' }}>
                            <RotateCcw size={14} /> Reset Form
                        </Button>
                        {!tradeToEdit && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', paddingLeft: '0.75rem' }}>Auto-saved</span>
                        )}
                    </div>
                    <Button type="submit" style={{ minWidth: '130px' }}>
                        Submit Trade
                    </Button>
                </div>

            </form>
        </Modal>
    );
};
