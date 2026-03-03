import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Trade, type StrategyDefinition } from '../db/db';
import { useJournalContext } from '../context/JournalContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer,
    LineChart, Line, Cell
} from 'recharts';
import {
    BookOpen, CheckCircle2, XCircle, BarChart2,
    TrendingUp, TrendingDown, AlertCircle, Target,
    Trophy, Layers, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { SEO } from '../components/SEO';

// ── Types ────────────────────────────────────────────────────────────────────

interface ChecklistItemStat {
    question: string;
    section: string;
    total: number;        // trades where this checklist answer was recorded
    checked: number;      // how many times it was ticked ✓
    unchecked: number;
    winWhenChecked: number;
    winWhenUnchecked: number;
    totalWhenChecked: number;
    totalWhenUnchecked: number;
}

interface StrategyStats {
    trades: number;
    won: number;
    lost: number;
    breakEven: number;
    grossProfit: number;
    netLoss: number;
    netPnl: number;
    avgRr: number;
    expectedValue: number;
    profitFactor: number | null;
    maxDrawdown: number;
    equityCurve: { date: string; equity: number }[];
    pairData: Record<string, { trades: number; won: number; pnl: number }>;
    dirData: { Buy: { trades: number; won: number; pnl: number }; Sell: { trades: number; won: number; pnl: number } };
    dayData: { day: string; wins: number; losses: number }[];
    checklistStats: ChecklistItemStat[];
    complianceRate: number; // % of checklist items that were ticked across all trades
    fullCompliance: number; // # of trades where ALL items were ticked
    fullComplianceWins: number;
    partialComplianceTrades: number;
    partialComplianceWins: number;
    totalChecklistSteps: number;
    avgTicksPerTrade: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PAIR_COLORS = ['#4f7cf6', '#7c3aed', '#22c55e', '#f59e0b', '#f25c6e', '#14b8a6', '#e879f9'];

function computeStrategyStats(
    trades: Trade[],
    definition: StrategyDefinition,
    startingBalance: number
): StrategyStats {
    // Build flat question list from checklist sections
    const allQuestions = definition.checklist.flatMap(s =>
        s.questions.map(q => ({ section: s.section, question: q }))
    );

    // Init per-question stats
    const checkMap = new Map<string, ChecklistItemStat>();
    allQuestions.forEach(({ section, question }) => {
        checkMap.set(question, {
            question, section,
            total: 0, checked: 0, unchecked: 0,
            winWhenChecked: 0, winWhenUnchecked: 0,
            totalWhenChecked: 0, totalWhenUnchecked: 0
        });
    });

    const dayMap: Record<string, { wins: number; losses: number }> = {};
    DAYS.forEach(d => (dayMap[d] = { wins: 0, losses: 0 }));

    const pairData: Record<string, { trades: number; won: number; pnl: number }> = {};
    const dirData = {
        Buy: { trades: 0, won: 0, pnl: 0 },
        Sell: { trades: 0, won: 0, pnl: 0 }
    };

    let grossProfit = 0, netLoss = 0, netPnl = 0, rrSum = 0;
    let won = 0, lost = 0, breakEven = 0;
    let totalChecked = 0, totalPossible = 0, fullCompliance = 0;
    let fullComplianceWins = 0, partialComplianceTrades = 0, partialComplianceWins = 0;
    let balance = startingBalance;
    const equityCurveMap = new Map<string, number>();

    const sorted = [...trades].sort((a, b) => a.openDate.localeCompare(b.openDate));

    sorted.forEach(t => {
        netPnl += t.netPnl;
        rrSum += t.rr;
        balance += t.netPnl;

        if (t.result === 'Win') { won++; grossProfit += t.pnl > 0 ? t.pnl : t.netPnl; }
        else if (t.result === 'Loss') { lost++; netLoss += Math.abs(t.netPnl); }
        else breakEven++;

        // Day split
        const d = new Date(t.openDate);
        const dayName = DAYS[d.getDay()];
        if (t.result === 'Win') dayMap[dayName].wins++;
        else if (t.result === 'Loss') dayMap[dayName].losses++;

        // Pair split
        if (!pairData[t.pair]) pairData[t.pair] = { trades: 0, won: 0, pnl: 0 };
        pairData[t.pair].trades++;
        pairData[t.pair].pnl += t.netPnl;
        if (t.result === 'Win') pairData[t.pair].won++;

        // Direction split
        const dir = t.direction as 'Buy' | 'Sell';
        if (dir === 'Buy' || dir === 'Sell') {
            dirData[dir].trades++;
            dirData[dir].pnl += t.netPnl;
            if (t.result === 'Win') dirData[dir].won++;
        }

        // Equity curve (aggregate by day)
        const dateKey = t.openDate.slice(0, 10);
        equityCurveMap.set(dateKey, balance);

        // Checklist compliance
        if (allQuestions.length > 0) {
            let tradeCheckedAll = true;
            let tradeTotal = 0;
            allQuestions.forEach(({ question }) => {
                const stat = checkMap.get(question)!;
                const val = t.checklistAnswers?.[question];
                const isChecked = val === true || val === 1 || val === 'true';
                const wasRecorded = val !== undefined && val !== null;
                if (wasRecorded) {
                    stat.total++;
                    totalPossible++;
                    tradeTotal++;
                    if (isChecked) {
                        stat.checked++;
                        stat.totalWhenChecked++;
                        totalChecked++;
                        if (t.result === 'Win') stat.winWhenChecked++;
                    } else {
                        tradeCheckedAll = false;
                        stat.unchecked++;
                        stat.totalWhenUnchecked++;
                        if (t.result === 'Win') stat.winWhenUnchecked++;
                    }
                }
                checkMap.set(question, stat);
            });
            if (tradeTotal > 0) {
                if (tradeCheckedAll) {
                    fullCompliance++;
                    if (t.result === 'Win') fullComplianceWins++;
                } else {
                    partialComplianceTrades++;
                    if (t.result === 'Win') partialComplianceWins++;
                }
            }
        }
    });

    let peak = startingBalance;
    let maxDrawdown = 0;
    const equityCurve: { date: string; equity: number }[] = [
        { date: 'Start', equity: startingBalance }
    ];
    equityCurveMap.forEach((equity, date) => {
        equityCurve.push({ date, equity });
        if (equity > peak) peak = equity;
        const dd = peak > 0 ? (peak - equity) / peak : 0;
        if (dd > maxDrawdown) maxDrawdown = dd;
    });

    const dayData = DAYS.map(day => ({ day, ...dayMap[day] }));

    const winRate = trades.length > 0 ? won / trades.length : 0;
    const lossRate = trades.length > 0 ? lost / trades.length : 0;
    const avgWin = won > 0 ? grossProfit / won : 0;
    const avgLoss = lost > 0 ? netLoss / lost : 0;
    const expectedValue = (winRate * avgWin) - (lossRate * avgLoss);
    const profitFactor = netLoss > 0 ? grossProfit / netLoss : (grossProfit > 0 ? 999 : null);

    return {
        trades: trades.length,
        won, lost, breakEven,
        grossProfit, netLoss, netPnl,
        avgRr: trades.length > 0 ? rrSum / trades.length : 0,
        expectedValue,
        profitFactor,
        maxDrawdown: maxDrawdown * 100,
        equityCurve,
        pairData, dirData, dayData,
        checklistStats: Array.from(checkMap.values()),
        complianceRate: totalPossible > 0 ? (totalChecked / totalPossible) * 100 : 0,
        fullCompliance,
        fullComplianceWins,
        partialComplianceTrades,
        partialComplianceWins,
        totalChecklistSteps: allQuestions.length,
        avgTicksPerTrade: trades.length > 0 ? (totalPossible > 0 ? totalChecked / trades.length : 0) : 0
    };
}

// ── Sub-components ────────────────────────────────────────────────────────────

const StatCard: React.FC<{
    label: string;
    value: string;
    sub?: string;
    color?: string;
    icon?: React.ReactNode;
}> = ({ label, value, sub, color, icon }) => (
    <div className="stat-card">
        <div className="flex-between">
            <span className="stat-card-label">{label}</span>
            {icon && (
                <div className="icon-badge" style={{ background: 'var(--bg-tertiary)' }}>
                    {icon}
                </div>
            )}
        </div>
        <div className="stat-card-value" style={{ color: color ?? 'var(--text-primary)' }}>{value}</div>
        {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
);

const fmt$ = (v: number) => `${v >= 0 ? '' : '-'}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Main Page ─────────────────────────────────────────────────────────────────

export const StrategyAnalysis: React.FC = () => {
    const navigate = useNavigate();
    const { activeJournalId } = useJournalContext();
    const [selectedStrategy, setSelectedStrategy] = useState<string>('');

    const journal = useLiveQuery(
        () => activeJournalId ? db.journals.get(activeJournalId) : undefined,
        [activeJournalId]
    );

    const settings = useLiveQuery(() => db.settings.toCollection().first());

    const trades = useLiveQuery(
        () => activeJournalId
            ? db.trades.where('journalId').equals(activeJournalId).toArray()
            : Promise.resolve([] as Trade[]),
        [activeJournalId]
    );

    const strategies = settings?.strategies ?? [];

    // Auto-select Overview or first strategy if none selected
    const activeStrategyName = selectedStrategy || 'Overview';
    const activeDefinition = strategies.find(s => s.name === activeStrategyName);

    const strategyTrades = useMemo(
        () => (trades ?? []).filter(t => t.strategy === activeStrategyName),
        [trades, activeStrategyName]
    );

    const stats = useMemo(() => {
        if (!activeDefinition || strategyTrades.length === 0) return null;
        return computeStrategyStats(strategyTrades, activeDefinition, journal?.startingBalance ?? 10000);
    }, [strategyTrades, activeDefinition, journal?.startingBalance]);

    // Pair table data
    const pairTableData = useMemo(() => {
        if (!stats) return [];
        return Object.entries(stats.pairData)
            .map(([pair, d]) => ({ pair, ...d, wr: d.trades > 0 ? (d.won / d.trades) * 100 : 0 }))
            .sort((a, b) => b.pnl - a.pnl);
    }, [stats]);

    // Guard: no journal
    if (!activeJournalId) {
        return (
            <div className="flex-center" style={{ minHeight: '50vh', flexDirection: 'column', gap: '1rem' }}>
                <BookOpen size={48} className="text-muted" />
                <h2 className="text-secondary">No Journal Selected</h2>
                <p className="text-muted">Select a journal from the Journals page to view strategy analytics.</p>
                <Button onClick={() => navigate('/')}>Go to Journals</Button>
            </div>
        );
    }

    const winRate = stats && stats.trades > 0 ? (stats.won / stats.trades) * 100 : 0;
    const profitFactor = stats && stats.netLoss > 0 ? stats.grossProfit / stats.netLoss : null;

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
            <SEO title={`${journal?.name ?? 'Strategy Analysis'} | ArpanTrade`} description="Deep-dive into each strategy's performance, checklist compliance, and behavioural patterns." />
            {/* ── Header ── */}
            <div className="page-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <div style={{ background: 'linear-gradient(135deg, #7c3aed, #4f7cf6)', padding: '0.45rem', borderRadius: '8px', display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
                            <BarChart2 size={18} color="#fff" />
                        </div>
                        <h1 className="page-title">{journal?.name ?? 'Strategy Analysis'}</h1>
                    </div>
                    <p className="page-subtitle">Deep-dive into each strategy's performance, checklist compliance, and behavioural patterns.</p>
                </div>

            </div>

            {/* Guard: no trades for this strategy */}
            {strategies.length === 0 && (
                <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem', minHeight: '40vh' }}>
                    <Layers size={40} className="text-muted" />
                    <p className="text-secondary">No strategies configured. Add them in Settings.</p>
                </div>
            )}

            {activeStrategyName === 'Overview' && strategies.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* All Strategies Compare Table */}
                    <Card noHover style={{ padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: 600 }}>Strategies Overview</h3>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Strategy</th>
                                    <th>Trades</th>
                                    <th>Win %</th>
                                    <th>Net P&L</th>
                                    <th>Avg R:R</th>
                                    <th>Checks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {strategies.map(s => {
                                    const sTrades = (trades ?? []).filter(t => t.strategy === s.name);
                                    if (sTrades.length === 0) return (
                                        <tr key={s.name} style={{ opacity: 0.45 }} onClick={() => setSelectedStrategy(s.name)}>
                                            <td style={{ cursor: 'pointer' }}><strong>{s.name}</strong></td>
                                            <td>0</td>
                                            <td>—</td>
                                            <td>—</td>
                                            <td>—</td>
                                            <td>—</td>
                                        </tr>
                                    );
                                    const sStats = computeStrategyStats(sTrades, s, journal?.startingBalance ?? 10000);
                                    const sWr = sTrades.length > 0 ? (sStats.won / sStats.trades) * 100 : 0;
                                    return (
                                        <tr
                                            key={s.name}
                                            onClick={() => setSelectedStrategy(s.name)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td style={{ fontWeight: 500 }}>
                                                {s.name}
                                            </td>
                                            <td>{sStats.trades}</td>
                                            <td style={{ color: sWr >= 50 ? 'var(--win-color)' : 'var(--loss-color)' }}>{sWr.toFixed(0)}%</td>
                                            <td style={{ color: sStats.netPnl >= 0 ? 'var(--win-color)' : 'var(--loss-color)', fontWeight: 600 }}>{fmt$(sStats.netPnl)}</td>
                                            <td>{sStats.avgRr.toFixed(2)}R</td>
                                            <td>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: sStats.complianceRate >= 80 ? 'var(--win-color)' : sStats.complianceRate >= 50 ? 'var(--neutral-color)' : 'var(--loss-color)' }}>
                                                    {sStats.complianceRate > 0 ? `${sStats.complianceRate.toFixed(0)}%` : '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </Card>

                    {/* Comparative Charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <Card noHover style={{ padding: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: 600 }}>Net P&L by Strategy</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={strategies.map(s => {
                                    const sTrades = (trades ?? []).filter(t => t.strategy === s.name);
                                    const sStats = sTrades.length > 0 ? computeStrategyStats(sTrades, s, 0) : { netPnl: 0 };
                                    return { name: s.name, pnl: sStats.netPnl };
                                })} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} interval={0} tick={{ fontSize: 10 }} />
                                    <YAxis stroke="var(--text-secondary)" fontSize={11} tickFormatter={v => `$${v}`} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }} />
                                    <Bar dataKey="pnl" name="Net P&L" radius={[3, 3, 0, 0]}>
                                        {strategies.map((s, i) => {
                                            const sTrades = (trades ?? []).filter(t => t.strategy === s.name);
                                            const pnl = sTrades.reduce((acc, t) => acc + t.netPnl, 0);
                                            return <Cell key={i} fill={pnl >= 0 ? 'var(--win-color)' : 'var(--loss-color)'} />;
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>

                        <Card noHover style={{ padding: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: 600 }}>Win Rate by Strategy</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={strategies.map(s => {
                                    const sTrades = (trades ?? []).filter(t => t.strategy === s.name);
                                    let wr = 0;
                                    if (sTrades.length > 0) {
                                        const won = sTrades.filter(t => t.result === 'Win').length;
                                        wr = (won / sTrades.length) * 100;
                                    }
                                    return { name: s.name, wr: +wr.toFixed(1) };
                                })} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} interval={0} tick={{ fontSize: 10 }} />
                                    <YAxis stroke="var(--text-secondary)" fontSize={11} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }} />
                                    <Bar dataKey="wr" name="Win Rate" radius={[3, 3, 0, 0]}>
                                        {strategies.map((s, i) => {
                                            const sTrades = (trades ?? []).filter(t => t.strategy === s.name);
                                            const wr = sTrades.length > 0 ? (sTrades.filter(t => t.result === 'Win').length / sTrades.length) * 100 : 0;
                                            return <Cell key={i} fill={wr >= 50 ? 'var(--win-color)' : 'var(--loss-color)'} />;
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <Card noHover style={{ padding: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: 600 }}>Trade Count by Strategy</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={strategies.map(s => {
                                    const sTrades = (trades ?? []).filter(t => t.strategy === s.name);
                                    return { name: s.name, trades: sTrades.length };
                                })} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} interval={0} />
                                    <YAxis stroke="var(--text-secondary)" fontSize={11} allowDecimals={false} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }} />
                                    <Bar dataKey="trades" name="Trades" fill="#7c3aed" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                        <Card noHover style={{ padding: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: 600 }}>Profit Factor by Strategy</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={strategies.map(s => {
                                    const sTrades = (trades ?? []).filter(t => t.strategy === s.name);
                                    const sStats = sTrades.length > 0 ? computeStrategyStats(sTrades, s, 0) : { grossProfit: 0, netLoss: 0 };
                                    const profitFactor = sStats.netLoss > 0 ? sStats.grossProfit / sStats.netLoss : (sStats.grossProfit > 0 ? 99 : 0);
                                    return { name: s.name, pf: +(profitFactor >= 99 ? 10 : profitFactor).toFixed(2), isInfinite: profitFactor >= 99 && sStats.grossProfit > 0 };
                                })} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} interval={0} />
                                    <YAxis stroke="var(--text-secondary)" fontSize={11} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }} formatter={(val, _name, props) => { return [props.payload.isInfinite ? '∞' : val, 'Profit Factor']; }} />
                                    <Bar dataKey="pf" name="Profit Factor" radius={[3, 3, 0, 0]}>
                                        {strategies.map((s, i) => {
                                            const sTrades = (trades ?? []).filter(t => t.strategy === s.name);
                                            const sStats = sTrades.length > 0 ? computeStrategyStats(sTrades, s, 0) : { grossProfit: 0, netLoss: 0 };
                                            const profitFactor = sStats.netLoss > 0 ? sStats.grossProfit / sStats.netLoss : (sStats.grossProfit > 0 ? 99 : 0);
                                            return <Cell key={i} fill={profitFactor >= 1.5 ? 'var(--win-color)' : 'var(--neutral-color)'} />;
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </div>
                </div>
            )}

            {activeStrategyName !== 'Overview' && strategies.length > 0 && strategyTrades.length === 0 && (
                <div className="flex-center" style={{ flexDirection: 'column', gap: '0.75rem', minHeight: '40vh' }}>
                    <BarChart2 size={40} className="text-muted" />
                    <h3 className="text-secondary">No trades logged for "{activeStrategyName}"</h3>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>Add trades using this strategy to see analytics.</p>
                </div>
            )}

            {activeStrategyName !== 'Overview' && stats && (
                <>
                    {/* ── Stat Cards ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <StatCard label="Trades" value={String(stats.trades)} sub={`${stats.won}W · ${stats.lost}L · ${stats.breakEven}BE`} icon={<Layers size={15} className="text-muted" />} />
                        <StatCard label="Win Rate" value={`${winRate.toFixed(1)}%`} color={winRate >= 50 ? 'var(--win-color)' : 'var(--loss-color)'} icon={<Target size={15} className="text-muted" />} sub="Win ÷ total trades" />
                        <StatCard label="Net P&L" value={fmt$(stats.netPnl)} color={stats.netPnl >= 0 ? 'var(--win-color)' : 'var(--loss-color)'} icon={stats.netPnl >= 0 ? <TrendingUp size={15} className="text-muted" /> : <TrendingDown size={15} className="text-muted" />} sub="Net across all trades" />
                        <StatCard label="Profit Factor" value={profitFactor !== null ? profitFactor.toFixed(2) : '∞'} color={profitFactor !== null && profitFactor >= 1.5 ? 'var(--win-color)' : 'var(--neutral-color)'} icon={<Trophy size={15} className="text-muted" />} sub="Target ≥ 1.5" />
                        <StatCard label="Avg R:R" value={`${stats.avgRr.toFixed(2)}R`} icon={<Target size={15} className="text-muted" />} sub="Planned risk-reward" />
                        <StatCard label="Full Checklist" value={`${stats.fullCompliance}/${stats.trades}`} icon={<CheckCircle2 size={15} className="text-muted" />} color={stats.fullCompliance === stats.trades ? 'var(--win-color)' : 'var(--neutral-color)'} sub="Trades 100% compliant" />
                    </div>

                    {/* ── Two-col layout ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

                        {/* Equity Curve */}
                        <Card noHover style={{ padding: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: 600 }}>Equity Curve</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={stats.equityCurve} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={10} tick={{ fontSize: 10 }} />
                                    <YAxis stroke="var(--text-secondary)" fontSize={10} tickFormatter={v => `$${v}`} domain={['auto', 'auto']} />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}
                                        formatter={(v: number | undefined) => [`$${(v ?? 0).toFixed(2)}`, 'Balance' as const]}
                                    />
                                    <Line type="monotone" dataKey="equity" stroke="#7c3aed" strokeWidth={2.5} dot={stats.equityCurve.length < 20} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card>

                        {/* Win/Loss by Day */}
                        <Card noHover style={{ padding: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: 600 }}>Performance by Day</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={stats.dayData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={11} />
                                    <YAxis stroke="var(--text-secondary)" fontSize={11} allowDecimals={false} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }} />
                                    <Bar dataKey="wins" name="Wins" fill="var(--win-color)" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="losses" name="Losses" fill="var(--loss-color)" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </div>

                    {/* ── Checklist Compliance ── */}
                    <Card noHover style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                            <div>
                                <h3 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 600 }}>Pre-Trade Checklist Compliance</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    How consistently you followed each rule — and whether it correlates with winning.
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: stats.complianceRate >= 80 ? 'var(--win-color)' : stats.complianceRate >= 50 ? 'var(--neutral-color)' : 'var(--loss-color)', lineHeight: 1 }}>
                                    {stats.complianceRate.toFixed(0)}%
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Overall compliance</div>
                            </div>
                        </div>

                        {activeDefinition && activeDefinition.checklist.length === 0 && (
                            <div className="flex-center" style={{ flexDirection: 'column', gap: '0.5rem', padding: '2rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                                <AlertCircle size={24} className="text-muted" />
                                <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0, textAlign: 'center' }}>
                                    No checklist defined for this strategy.<br />
                                    Build one in <strong>Settings → Strategies</strong>.
                                </p>
                            </div>
                        )}

                        {stats.checklistStats.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                {/* Group by section */}
                                {activeDefinition?.checklist.map((section) => {
                                    const sectionItems = stats.checklistStats.filter(i => i.section === section.section);
                                    if (sectionItems.length === 0) return null;
                                    return (
                                        <div key={section.section} style={{ marginBottom: '1.25rem' }}>
                                            <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.5rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                                                {section.section}
                                            </div>
                                            {sectionItems.map((item) => {
                                                const rate = item.total > 0 ? (item.checked / item.total) * 100 : 0;
                                                const wrChecked = item.totalWhenChecked > 0 ? (item.winWhenChecked / item.totalWhenChecked) * 100 : null;
                                                const wrUnchecked = item.totalWhenUnchecked > 0 ? (item.winWhenUnchecked / item.totalWhenUnchecked) * 100 : null;
                                                const hasImpact = wrChecked !== null && wrUnchecked !== null;
                                                const improvesWin = hasImpact && wrChecked! > wrUnchecked!;

                                                return (
                                                    <div key={item.question} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                                        {/* Check/cross icon */}
                                                        <div style={{ flexShrink: 0 }}>
                                                            {rate >= 80
                                                                ? <CheckCircle2 size={18} color="var(--win-color)" />
                                                                : rate >= 40
                                                                    ? <AlertCircle size={18} color="var(--neutral-color)" />
                                                                    : <XCircle size={18} color="var(--loss-color)" />
                                                            }
                                                        </div>

                                                        {/* Question + bar */}
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                                                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{item.question}</span>
                                                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: rate >= 80 ? 'var(--win-color)' : rate >= 40 ? 'var(--neutral-color)' : 'var(--loss-color)', marginLeft: '1rem', flexShrink: 0 }}>
                                                                    {item.checked}/{item.total > 0 ? item.total : stats.trades} checked ({rate.toFixed(0)}%)
                                                                </span>
                                                            </div>
                                                            {/* Progress bar */}
                                                            <div style={{ height: '5px', background: 'var(--bg-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
                                                                <div style={{ height: '100%', width: `${rate}%`, background: rate >= 80 ? 'var(--win-color)' : rate >= 40 ? 'var(--neutral-color)' : 'var(--loss-color)', borderRadius: '9999px', transition: 'width 0.5s ease' }} />
                                                            </div>
                                                        </div>

                                                        {/* Win rate impact */}
                                                        {hasImpact && (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', textAlign: 'right', flexShrink: 0, minWidth: '120px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                                                    {improvesWin
                                                                        ? <ArrowUpRight size={11} color="var(--win-color)" />
                                                                        : <ArrowDownRight size={11} color="var(--loss-color)" />
                                                                    }
                                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                                        Checked: <strong style={{ color: 'var(--win-color)' }}>{wrChecked!.toFixed(0)}% WR</strong>
                                                                    </span>
                                                                </div>
                                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                                                                    Skipped: <strong style={{ color: 'var(--loss-color)' }}>{wrUnchecked!.toFixed(0)}% WR</strong>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}

                                {/* Full compliance trades counter */}
                                <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Trades where ALL checklist items were ticked:</span>
                                    <span style={{ fontWeight: 700, fontSize: '1rem', color: stats.fullCompliance === stats.trades ? 'var(--win-color)' : 'var(--neutral-color)' }}>
                                        {stats.fullCompliance} / {stats.trades}
                                    </span>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* ── Pair & Direction breakdown ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

                        {/* Pair breakdown table */}
                        <Card noHover style={{ padding: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: 600 }}>Pair Breakdown</h3>
                            {pairTableData.length === 0
                                ? <p className="text-muted" style={{ fontSize: '0.875rem' }}>No pair data.</p>
                                : (
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Pair</th>
                                                <th>Trades</th>
                                                <th>Win%</th>
                                                <th>Net P&L</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pairTableData.map((p, i) => (
                                                <tr key={p.pair}>
                                                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: PAIR_COLORS[i % PAIR_COLORS.length], flexShrink: 0, display: 'inline-block' }} />
                                                        <strong>{p.pair}</strong>
                                                    </td>
                                                    <td>{p.trades}</td>
                                                    <td style={{ color: p.wr >= 50 ? 'var(--win-color)' : 'var(--loss-color)' }}>{p.wr.toFixed(0)}%</td>
                                                    <td style={{ color: p.pnl >= 0 ? 'var(--win-color)' : 'var(--loss-color)', fontWeight: 600 }}>{fmt$(p.pnl)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                        </Card>

                        {/* Direction breakdown */}
                        <Card noHover style={{ padding: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: 600 }}>Long vs Short</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {(['Buy', 'Sell'] as const).map(dir => {
                                    const d = stats.dirData[dir];
                                    const wr = d.trades > 0 ? (d.won / d.trades) * 100 : 0;
                                    const icon = dir === 'Buy'
                                        ? <ArrowUpRight size={18} color="var(--win-color)" />
                                        : <ArrowDownRight size={18} color="var(--loss-color)" />;
                                    return (
                                        <div key={dir} style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ background: dir === 'Buy' ? 'var(--win-bg)' : 'var(--loss-bg)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', display: 'flex' }}>
                                                {icon}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{dir === 'Buy' ? 'Long (Buy)' : 'Short (Sell)'}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{d.trades} trades · {wr.toFixed(0)}% WR</div>
                                                <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '9999px', marginTop: '0.4rem', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${wr}%`, background: dir === 'Buy' ? 'var(--win-color)' : 'var(--loss-color)', borderRadius: '9999px' }} />
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 700, color: d.pnl >= 0 ? 'var(--win-color)' : 'var(--loss-color)' }}>{fmt$(d.pnl)}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Net P&L</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>

                </>
            )}
        </div>
    );
};
