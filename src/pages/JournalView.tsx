import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { ArrowLeft, Plus, ExternalLink } from 'lucide-react';
import { db } from '../db/db';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AddTradeModal } from '../components/AddTradeModal';
import { CalendarView } from '../components/CalendarView';
import { useMetrics } from '../hooks/useMetrics';
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Legend, ScatterChart, Scatter, ZAxis
} from 'recharts';

type Tab = 'Advanced' | 'Trades' | 'Hourly' | 'Daily' | 'Duration';

export const JournalView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const journalId = parseInt(id || '0', 10);
    const journal = useLiveQuery(() => db.journals.get(journalId), [journalId]);

    // Sort trades by newest open date first
    const trades = useLiveQuery(
        () => db.trades.where('journalId').equals(journalId).reverse().sortBy('openDate'),
        [journalId]
    );

    const { stats, charts } = useMetrics(journalId);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('Advanced');
    const [activeMainTab, setActiveMainTab] = useState<'Metrics' | 'Calendar' | 'Emotions'>('Metrics');

    if (!journal) {
        return <div className="container" style={{ paddingTop: '2rem' }}>Loading Journal...</div>;
    }

    const formatMoney = (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatPct = (val: number) => `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;

    return (
        <div>
            {/* 1. HEADER (Top) */}
            <div className="flex-between" style={{ marginBottom: '2rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/')} style={{ padding: '0.4rem' }}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h1 style={{ margin: 0, fontSize: '2rem' }}>{journal.name}</h1>
                </div>

                <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-round)', padding: '0.25rem' }}>
                    <button
                        onClick={() => setActiveMainTab('Metrics')}
                        style={{ padding: '0.4rem 1.5rem', borderRadius: 'var(--radius-round)', background: activeMainTab === 'Metrics' ? 'var(--accent-primary)' : 'transparent', color: activeMainTab === 'Metrics' ? '#fff' : 'var(--text-secondary)', fontWeight: 500, transition: 'var(--transition-fast)' }}
                    >
                        Metrics
                    </button>
                    <button
                        onClick={() => setActiveMainTab('Calendar')}
                        style={{ padding: '0.4rem 1.5rem', borderRadius: 'var(--radius-round)', background: activeMainTab === 'Calendar' ? 'var(--accent-primary)' : 'transparent', color: activeMainTab === 'Calendar' ? '#fff' : 'var(--text-secondary)', fontWeight: 500, transition: 'var(--transition-fast)' }}
                    >
                        Calendar
                    </button>
                    <button
                        onClick={() => setActiveMainTab('Emotions')}
                        style={{ padding: '0.4rem 1.5rem', borderRadius: 'var(--radius-round)', background: activeMainTab === 'Emotions' ? 'var(--accent-primary)' : 'transparent', color: activeMainTab === 'Emotions' ? '#fff' : 'var(--text-secondary)', fontWeight: 500, transition: 'var(--transition-fast)' }}
                    >
                        Emotions
                    </button>
                </div>

                <Button icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
                    Add Entry
                </Button>
            </div>

            {/* MAIN CONTENT AREA */}
            {activeMainTab === 'Calendar' && trades ? (
                <div className="animate-fade-in" style={{ marginBottom: '3rem' }}>
                    <CalendarView trades={trades} />
                </div>
            ) : activeMainTab === 'Emotions' && trades ? (
                <div className="animate-fade-in" style={{ marginBottom: '3rem' }}>
                    <Card style={{ padding: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Emotions & Technical Notes</h2>
                        {trades.length === 0 ? (
                            <p className="text-muted text-center" style={{ padding: '3rem 0' }}>No trades logged yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {trades.map(trade => (
                                    <div key={trade.id} style={{ padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                        <div className="flex-between" style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{trade.pair}</span>
                                                <span className="text-secondary" style={{ fontSize: '0.9rem' }}>{format(new Date(trade.openDate), 'MMM dd, yyyy HH:mm')}</span>
                                            </div>
                                            <span style={{ fontWeight: 600, color: trade.netPnl > 0 ? 'var(--win-color)' : trade.netPnl < 0 ? 'var(--loss-color)' : 'var(--text-secondary)' }}>
                                                {trade.netPnl > 0 ? '+' : ''}${trade.netPnl.toFixed(2)}
                                            </span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                            <div>
                                                <h4 className="text-secondary" style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Emotional Notes</h4>
                                                <p style={{ color: trade.notes?.emotion ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                                    {trade.notes?.emotion || 'No emotional notes recorded.'}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="text-secondary" style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>Technical Notes</h4>
                                                <p style={{ color: trade.notes?.technical ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                                    {trade.notes?.technical || 'No technical notes recorded.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            ) : (
                <div className="animate-fade-in">
                    {/* 2. DASHBOARD DASHBOARD (Chart top, Metrics below) */}
                    {stats && charts ? (
                        <div style={{ marginBottom: '3rem' }}>

                            {/* NEW SIDE-BY-SIDE LAYOUT */}
                            <div className="dashboard-grid">

                                {/* LEFT SIDEBAR: STATS */}
                                <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>Overview</h3>

                                    <div className="flex-between">
                                        <span className="text-secondary" style={{ fontSize: '0.9rem' }}>Gain</span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 600, color: stats.gain >= 0 ? 'var(--win-color)' : 'var(--loss-color)' }}>{formatPct(stats.gain)}</span>
                                    </div>

                                    <div className="flex-between">
                                        <span className="text-secondary" style={{ fontSize: '0.9rem' }}>Balance</span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{formatMoney(stats.balance)}</span>
                                    </div>

                                    <div className="flex-between">
                                        <span className="text-secondary" style={{ fontSize: '0.9rem' }}>Profit</span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 600, color: stats.totalPnl >= 0 ? 'var(--win-color)' : 'var(--loss-color)' }}>{formatMoney(stats.totalPnl)}</span>
                                    </div>

                                    <div className="flex-between">
                                        <span className="text-secondary" style={{ fontSize: '0.9rem' }}>Drawdown</span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{stats.maxDrawdown.toFixed(2)}%</span>
                                    </div>

                                    <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
                                        <span className="text-secondary" style={{ fontSize: '0.9rem' }}>Win Rate</span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 600, color: stats.winRate >= 50 ? 'var(--win-color)' : 'var(--loss-color)' }}>{stats.winRate.toFixed(1)}%</span>
                                    </div>

                                    <div className="flex-between" style={{ marginTop: '0.5rem' }}>
                                        <span className="text-secondary" style={{ fontSize: '0.85rem' }}>Trades</span>
                                        <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{stats.totalTrades}</span>
                                    </div>
                                    <div className="flex-between">
                                        <span className="text-secondary" style={{ fontSize: '0.85rem' }}>Profit Factor</span>
                                        <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{stats.profitFactor.toFixed(2)}</span>
                                    </div>
                                    <div className="flex-between">
                                        <span className="text-secondary" style={{ fontSize: '0.85rem' }}>Expectancy</span>
                                        <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{formatMoney(stats.expectancy)}</span>
                                    </div>
                                </Card>

                                {/* RIGHT CONTENT: CHARTS */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
                                    {/* Growth Chart */}
                                    <Card style={{ height: '400px' }}>
                                        <h3 style={{ marginBottom: '1rem' }}>Growth Chart</h3>
                                        <ResponsiveContainer width="100%" height="85%">
                                            <ComposedChart data={charts.growthData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} />
                                                <YAxis yAxisId="left" stroke="var(--text-secondary)" fontSize={12} tickFormatter={(v) => `$${v}`} domain={['auto', 'auto']} />
                                                <YAxis yAxisId="right" orientation="right" stroke="var(--text-secondary)" fontSize={12} />
                                                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
                                                <Bar yAxisId="right" dataKey="profit" name="Trade PnL" fill="var(--neutral-color)" opacity={0.5} />
                                                <Line yAxisId="left" type="monotone" dataKey="equity" name="Equity" stroke="var(--accent-primary)" strokeWidth={3} dot={false} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </Card>
                                </div>
                            </div> {/* End of .dashboard-grid */}

                            {/* FULL-WIDTH BOTTOM METRICS */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '0.5rem' }}>
                                {/* Metrics Tabs */}
                                <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
                                    {(['Advanced', 'Trades', 'Hourly', 'Daily', 'Duration'] as Tab[]).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                fontWeight: 500,
                                                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                borderBottom: activeTab === tab ? '2px solid var(--accent-primary)' : '2px solid transparent',
                                                transition: 'var(--transition-fast)',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                {/* ADVANCED STATISTICS TAB */}
                                {activeTab === 'Advanced' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        {/* RAW NUMBERS GRID */}
                                        <Card>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                                                {/* Column 1: General & PnL */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                    <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                                        <span className="text-secondary">Expected Payoff:</span>
                                                        <span style={{ fontWeight: 600 }}>{formatMoney(stats.expectancy)}</span>
                                                    </div>
                                                    <div className="flex-between"><span className="text-secondary">Total Trades:</span> <span>{stats.totalTrades}</span></div>
                                                    <div className="flex-between"><span className="text-secondary">Profit Trades (% of total):</span> <span>{stats.totalWon} ({stats.winRate.toFixed(2)}%)</span></div>
                                                    <div className="flex-between"><span className="text-secondary">Loss Trades (% of total):</span> <span>{stats.totalLost} ({stats.lossRate.toFixed(2)}%)</span></div>
                                                    <div className="flex-between" style={{ marginTop: '0.5rem' }}><span className="text-secondary">Gross Profit:</span> <span className="text-win">{formatMoney(stats.grossProfit)}</span></div>
                                                    <div className="flex-between"><span className="text-secondary">Gross Loss:</span> <span className="text-loss">{formatMoney(stats.grossLoss * -1)}</span></div>
                                                    <div className="flex-between"><span className="text-secondary">Average Win:</span> <span>{formatMoney(stats.avgWin)}</span></div>
                                                    <div className="flex-between"><span className="text-secondary">Average Loss:</span> <span>{formatMoney(stats.avgLoss * -1)}</span></div>
                                                </div>

                                                {/* Column 2: Streaks & Extremes */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                    <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                                        <span className="text-secondary">Profit Factor:</span>
                                                        <span style={{ fontWeight: 600 }}>{stats.profitFactor.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex-between"><span className="text-secondary">Best Trade:</span> <span className="text-win">{formatMoney(stats.bestTrade === Number.NEGATIVE_INFINITY ? 0 : stats.bestTrade)}</span></div>
                                                    <div className="flex-between"><span className="text-secondary">Worst Trade:</span> <span className="text-loss">{formatMoney(stats.worstTrade === Number.POSITIVE_INFINITY ? 0 : stats.worstTrade)}</span></div>
                                                    <div className="flex-between" style={{ marginTop: '0.5rem' }}><span className="text-secondary">Max Consecutive Wins:</span> <span>{stats.maxConsecutiveWins} ({formatMoney(stats.maxConsecutiveProfit)})</span></div>
                                                    <div className="flex-between"><span className="text-secondary">Max Consecutive Losses:</span> <span>{stats.maxConsecutiveLosses} ({formatMoney(stats.maxConsecutiveLoss)})</span></div>
                                                </div>

                                                {/* Column 3: Biases & Averages */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                    <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                                        <span className="text-secondary">Avg Trade Duration:</span>
                                                        <span style={{ fontWeight: 600 }}>{stats.avgDuration.toFixed(0)} min</span>
                                                    </div>
                                                    <div className="flex-between"><span className="text-secondary">Long Trades (Won %):</span> <span>{stats.longTrades} ({stats.longTrades ? ((stats.longWon / stats.longTrades) * 100).toFixed(2) : 0}%)</span></div>
                                                    <div className="flex-between"><span className="text-secondary">Short Trades (Won %):</span> <span>{stats.shortTrades} ({stats.shortTrades ? ((stats.shortWon / stats.shortTrades) * 100).toFixed(2) : 0}%)</span></div>
                                                    <div className="flex-between" style={{ marginTop: '0.5rem' }}><span className="text-secondary">Lots Traded:</span> <span>{stats.totalLots.toFixed(2)}</span></div>
                                                </div>
                                            </div>
                                        </Card>

                                        {/* VISUAL BARS (Like the screenshot) */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                                            <Card>
                                                <div className="flex-between" style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                                    <span>Best trade: <span className="text-win">{formatMoney(stats.bestTrade === Number.NEGATIVE_INFINITY ? 0 : stats.bestTrade)}</span></span>
                                                    <span>Worst trade: <span className="text-loss">{formatMoney(stats.worstTrade === Number.POSITIVE_INFINITY ? 0 : stats.worstTrade)}</span></span>
                                                </div>
                                                <div style={{ display: 'flex', height: '12px', width: '100%', borderRadius: '2px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                                    <div style={{
                                                        width: `${(Math.abs(stats.bestTrade) / (Math.abs(stats.bestTrade) + Math.abs(stats.worstTrade === Number.POSITIVE_INFINITY ? 0 : stats.worstTrade))) * 100 || 50}%`,
                                                        background: 'rgba(34, 197, 94, 0.2)',
                                                        borderRight: '1px solid var(--win-color)'
                                                    }} />
                                                    <div style={{ flex: 1, background: 'rgba(239, 68, 68, 0.15)' }} />
                                                </div>
                                            </Card>

                                            <Card>
                                                <div className="flex-between" style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                                    <span>Max. consecutive wins: <span className="text-win">{stats.maxConsecutiveWins}</span></span>
                                                    <span>Max. consecutive losses: <span className="text-loss">{stats.maxConsecutiveLosses}</span></span>
                                                </div>
                                                <div style={{ display: 'flex', height: '12px', width: '100%', borderRadius: '2px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                                    <div style={{
                                                        width: `${(stats.maxConsecutiveWins / (stats.maxConsecutiveWins + stats.maxConsecutiveLosses)) * 100 || 50}%`,
                                                        background: 'rgba(34, 197, 94, 0.2)',
                                                        borderRight: '1px solid var(--win-color)'
                                                    }} />
                                                    <div style={{ flex: 1, background: 'rgba(239, 68, 68, 0.15)' }} />
                                                </div>
                                            </Card>

                                            <Card>
                                                <div className="flex-between" style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                                    <span>Long trades: <span style={{ color: 'var(--accent-primary)' }}>{stats.longTrades}</span></span>
                                                    <span>Short trades: <span style={{ color: 'var(--accent-secondary, #f59e0b)' }}>{stats.shortTrades}</span></span>
                                                </div>
                                                <div style={{ display: 'flex', height: '12px', width: '100%', borderRadius: '2px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                                    <div style={{
                                                        width: `${(stats.longTrades / (stats.longTrades + stats.shortTrades)) * 100 || 50}%`,
                                                        background: 'rgba(59, 130, 246, 0.2)',
                                                        borderRight: '1px solid var(--accent-primary)'
                                                    }} />
                                                    <div style={{ flex: 1, background: 'rgba(245, 158, 11, 0.15)' }} />
                                                </div>
                                            </Card>
                                        </div>
                                    </div>
                                )}

                                {/* TRADES / SUMMARY TAB */}
                                {activeTab === 'Trades' && (
                                    <Card padding="none" style={{ overflow: 'hidden' }}>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                                                <thead>
                                                    <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                                                        <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Currency</th>
                                                        <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Trades</th>
                                                        <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Pips (est.)</th>
                                                        <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Profit($)</th>
                                                        <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Won(%)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {charts.pairsData.map(p => {
                                                        const totalW = p.hw + p.sw;
                                                        const winPct = p.trades > 0 ? (totalW / p.trades) * 100 : 0;
                                                        return (
                                                            <tr key={p.currency} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                                <td style={{ padding: '1rem', fontWeight: 600 }}>{p.currency}</td>
                                                                <td style={{ padding: '1rem' }}>{p.trades}</td>
                                                                <td style={{ padding: '1rem', color: p.pips >= 0 ? 'var(--win-color)' : 'var(--loss-color)' }}>{p.pips.toFixed(1)}</td>
                                                                <td style={{ padding: '1rem', color: p.pnl >= 0 ? 'var(--win-color)' : 'var(--loss-color)' }}>{formatMoney(p.pnl)}</td>
                                                                <td style={{ padding: '1rem' }}>
                                                                    <span style={{
                                                                        padding: '0.2rem 0.6rem',
                                                                        borderRadius: 'var(--radius-sm)',
                                                                        background: winPct >= 50 ? 'var(--win-bg)' : 'var(--loss-bg)',
                                                                        color: winPct >= 50 ? 'var(--win-color)' : 'var(--loss-color)'
                                                                    }}>
                                                                        {totalW} ({winPct.toFixed(0)}%)
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {charts.pairsData.length === 0 && (
                                                        <tr><td colSpan={5} style={{ padding: '2rem' }} className="text-muted">No pair data available.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>
                                )}

                                {/* HOURLY TAB */}
                                {activeTab === 'Hourly' && (
                                    <Card style={{ height: '500px' }}>
                                        <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Winners Vs. Losers (Hourly)</h3>
                                        <ResponsiveContainer width="100%" height="90%">
                                            <BarChart data={charts.hourlyMap}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="hour" stroke="var(--text-secondary)" />
                                                <YAxis stroke="var(--text-secondary)" />
                                                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
                                                <Legend />
                                                <Bar dataKey="Winners" stackId="a" fill="var(--win-color)" />
                                                <Bar dataKey="Losers" stackId="a" fill="var(--loss-color)" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Card>
                                )}

                                {/* DAILY TAB */}
                                {activeTab === 'Daily' && (
                                    <Card style={{ height: '500px' }}>
                                        <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Winners Vs. Losers (Daily)</h3>
                                        <ResponsiveContainer width="100%" height="90%">
                                            <BarChart data={charts.dailyMap}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="day" stroke="var(--text-secondary)" />
                                                <YAxis stroke="var(--text-secondary)" />
                                                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
                                                <Legend />
                                                <Bar dataKey="Winners" stackId="a" fill="var(--win-color)" />
                                                <Bar dataKey="Losers" stackId="a" fill="var(--loss-color)" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Card>
                                )}

                                {/* DURATION TAB */}
                                {activeTab === 'Duration' && (
                                    <Card style={{ height: '500px' }}>
                                        <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Duration vs Growth (%)</h3>
                                        <ResponsiveContainer width="100%" height="90%">
                                            <ScatterChart>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="Duration" type="number" name="Duration (min)" stroke="var(--text-secondary)" domain={['dataMin', 'dataMax']} />
                                                <YAxis dataKey="Growth" type="number" name="Growth (%)" stroke="var(--text-secondary)" tickFormatter={(v) => `${(v * 100).toFixed(2)}%`} />
                                                <ZAxis dataKey="Growth" range={[100, 100]} />
                                                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
                                                <Legend />
                                                <Scatter name="Winners" data={charts.durationData.filter(d => d.Result === 'Win')} fill="var(--win-color)" shape="diamond" />
                                                <Scatter name="Losers" data={charts.durationData.filter(d => d.Result === 'Loss')} fill="var(--loss-color)" shape="circle" />
                                                <Scatter name="Break Even" data={charts.durationData.filter(d => d.Result === 'Break Even')} fill="var(--text-muted)" shape="square" />
                                            </ScatterChart>
                                        </ResponsiveContainer>
                                    </Card>
                                )}
                            </div>
                        </div>
                    ) : null}

                    <div>
                        {/* 3. TRADES LEDGER (Bottom) */}
                        <h3 style={{ marginBottom: '1rem' }}>Trade History</h3>
                        <Card padding="none" style={{ overflow: 'hidden' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                                            <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Date</th>
                                            <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Pair</th>
                                            <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Dir</th>
                                            <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Lots</th>
                                            <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Strat</th>
                                            <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Duration</th>
                                            <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>RR</th>
                                            <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Net PnL</th>
                                            <th style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Link</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trades && trades.length > 0 ? (
                                            trades.map((trade) => (
                                                <tr key={trade.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span>{format(new Date(trade.openDate), 'MMM dd, yyyy')}</span>
                                                            <span className="text-muted" style={{ fontSize: '0.85rem' }}>{format(new Date(trade.openDate), 'HH:mm')}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{trade.pair}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            padding: '0.25rem 0.5rem',
                                                            borderRadius: 'var(--radius-sm)',
                                                            fontSize: '0.85rem',
                                                            background: trade.direction === 'Buy' ? 'var(--win-bg)' : 'var(--loss-bg)',
                                                            color: trade.direction === 'Buy' ? 'var(--win-color)' : 'var(--loss-color)'
                                                        }}>
                                                            {trade.direction}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>{trade.lots}</td>
                                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{trade.strategy}</td>
                                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                                        {trade.duration < 60 ? `${trade.duration}m` : `${Math.floor(trade.duration / 60)}h ${trade.duration % 60}m`}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>{trade.rr > 0 ? trade.rr : '-'}</td>
                                                    <td style={{ padding: '1rem', fontWeight: 600, color: trade.netPnl > 0 ? 'var(--win-color)' : trade.netPnl < 0 ? 'var(--loss-color)' : 'var(--text-secondary)' }}>
                                                        {trade.netPnl > 0 ? '+' : ''}${trade.netPnl.toFixed(2)}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        {trade.tvLink ? (
                                                            <a href={trade.tvLink} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center' }}>
                                                                <ExternalLink size={16} />
                                                            </a>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
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
                        </Card>
                    </div>

                    <AddTradeModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                    />
                </div>
            )
            }
        </div >
    );
};
