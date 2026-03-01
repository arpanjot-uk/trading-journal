import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { ArrowLeft, Plus, ExternalLink } from 'lucide-react';
import { db } from '../db/db';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AddTradeModal } from '../components/AddTradeModal';
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

                <Button icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
                    Add Entry
                </Button>
            </div>

            {/* 2. DASHBOARD DASHBOARD (Chart top, Metrics below) */}
            {stats && charts && (
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
                                <Card>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                            <div className="flex-between"><span className="text-secondary">Average Win:</span> <span>{formatMoney(stats.avgWin)}</span></div>
                                            <div className="flex-between"><span className="text-secondary">Average Loss:</span> <span>{formatMoney(stats.avgLoss)}</span></div>
                                            <div className="flex-between"><span className="text-secondary">Lots Traded:</span> <span>{stats.totalLots.toFixed(2)}</span></div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                            <div className="flex-between"><span className="text-secondary">Gross Profit:</span> <span className="text-win">{formatMoney(stats.totalGrossPnl > 0 ? stats.totalGrossPnl : 0)}</span></div>
                                            <div className="flex-between"><span className="text-secondary">Gross Loss:</span> <span className="text-loss">{formatMoney(stats.totalGrossPnl < 0 ? stats.totalGrossPnl : 0)}</span></div>
                                        </div>
                                    </div>
                                </Card>
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
                                        {trades?.map((trade) => (
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
                                        ))}

                                    </tbody>
                                </table>
                            </div>
                        </Card>

                    </div> {/* End of .dashboard-grid */}
                </div>
            )}

            {!stats || !charts || stats.totalTrades === 0 ? (
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
                                    <tr>
                                        <td colSpan={9} style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            No trades logged yet. Click "Add Entry" to get started.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            ) : null}

            <AddTradeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};
