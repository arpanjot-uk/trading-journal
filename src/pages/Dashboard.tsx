import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Legend, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { useMetrics } from '../hooks/useMetrics';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useJournalContext } from '../context/JournalContext';

type Tab = 'Advanced' | 'Trades' | 'Hourly' | 'Daily' | 'Duration';

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { activeJournalId } = useJournalContext();
    const journalId = activeJournalId || 0;

    const { loading, journal, stats, charts } = useMetrics(journalId);
    const [activeTab, setActiveTab] = useState<Tab>('Advanced');

    if (!activeJournalId) {
        return (
            <div className="flex-center" style={{ minHeight: '50vh', flexDirection: 'column', gap: '1rem' }}>
                <BookOpen size={48} className="text-muted" />
                <h2 className="text-secondary">No Journal Selected</h2>
                <p className="text-muted">Please select a journal from the Journals page to view its dashboard.</p>
                <Button onClick={() => navigate('/')}>Go to Journals</Button>
            </div>
        );
    }

    if (loading || !journal || !stats || !charts) {
        return <div className="container flex-center" style={{ minHeight: '50vh' }}>Crunching numbers...</div>;
    }

    const formatMoney = (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatPct = (val: number) => `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;

    return (
        <div>
            <div className="flex-between" style={{ marginBottom: '2rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/journal/${journal.id}`)} style={{ padding: '0.4rem' }}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h1 style={{ margin: 0, fontSize: '2rem' }}>Metrics: {journal.name}</h1>
                </div>
            </div>

            {/* OVERVIEW SECTION (ALWAYS VISIBLE) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 3fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <Card style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Info / Stats</h3>
                    <div className="flex-between">
                        <span className="text-secondary">Gain:</span>
                        <span style={{ fontWeight: 600, color: stats.gain >= 0 ? 'var(--win-color)' : 'var(--loss-color)' }}>{formatPct(stats.gain)}</span>
                    </div>
                    <div className="flex-between">
                        <span className="text-secondary">Drawdown:</span>
                        <span style={{ fontWeight: 600 }}>{stats.maxDrawdown.toFixed(2)}%</span>
                    </div>
                    <div className="flex-between">
                        <span className="text-secondary">Balance:</span>
                        <span style={{ fontWeight: 600 }}>{formatMoney(stats.balance)}</span>
                    </div>
                    <div className="flex-between">
                        <span className="text-secondary">Profit:</span>
                        <span style={{ fontWeight: 600, color: stats.totalPnl >= 0 ? 'var(--win-color)' : 'var(--loss-color)' }}>{formatMoney(stats.totalPnl)}</span>
                    </div>
                    <div className="flex-between" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        <span className="text-secondary">Trades:</span>
                        <span style={{ fontWeight: 600 }}>{stats.totalTrades}</span>
                    </div>
                </Card>

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

            {/* TABS */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
                {(['Advanced', 'Trades', 'Hourly', 'Daily', 'Duration'] as Tab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.5rem 1rem',
                            fontWeight: 500,
                            color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                            borderBottom: activeTab === tab ? '2px solid var(--accent-primary)' : '2px solid transparent',
                            transition: 'var(--transition-fast)'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* ADVANCED STATISTICS TAB */}
            {activeTab === 'Advanced' && (
                <Card>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div className="flex-between"><span className="text-secondary">Trades:</span> <span>{stats.totalTrades}</span></div>
                            <div className="flex-between"><span className="text-secondary">Profitability:</span> <span style={{ color: stats.winRate >= 50 ? 'var(--win-color)' : 'var(--loss-color)' }}>{stats.winRate.toFixed(2)}%</span></div>
                            <div className="flex-between"><span className="text-secondary">Average Win:</span> <span>{formatMoney(stats.avgWin)}</span></div>
                            <div className="flex-between"><span className="text-secondary">Average Loss:</span> <span>{formatMoney(stats.avgLoss)}</span></div>
                            <div className="flex-between"><span className="text-secondary">Lots:</span> <span>{stats.totalLots.toFixed(2)}</span></div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div className="flex-between"><span className="text-secondary">Longs Won:</span> <span>-</span></div>
                            <div className="flex-between"><span className="text-secondary">Shorts Won:</span> <span>-</span></div>
                            <div className="flex-between"><span className="text-secondary">Best Trade ($):</span> <span>-</span></div>
                            <div className="flex-between"><span className="text-secondary">Worst Trade ($):</span> <span>-</span></div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div className="flex-between"><span className="text-secondary">Profit Factor:</span> <span>{stats.profitFactor.toFixed(2)}</span></div>
                            <div className="flex-between"><span className="text-secondary">Expectancy:</span> <span>{formatMoney(stats.expectancy)}</span></div>
                            <div className="flex-between"><span className="text-secondary">Gross Profit:</span> <span className="text-win">{formatMoney(stats.totalGrossPnl > 0 ? stats.totalGrossPnl : 0)}</span></div>
                            <div className="flex-between"><span className="text-secondary">Gross Loss:</span> <span className="text-loss">{formatMoney(stats.totalGrossPnl < 0 ? stats.totalGrossPnl : 0)}</span></div>
                        </div>
                    </div>
                </Card>
            )}

            {/* TRADES / SUMMARY TAB */}
            {activeTab === 'Trades' && (
                <Card padding="none" style={{ overflow: 'hidden' }}>
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
                            {/* Separate scatter series by Result to get different colors */}
                            <Scatter name="Winners" data={charts.durationData.filter(d => d.Result === 'Win')} fill="var(--win-color)" shape="diamond" />
                            <Scatter name="Losers" data={charts.durationData.filter(d => d.Result === 'Loss')} fill="var(--loss-color)" shape="circle" />
                            <Scatter name="Break Even" data={charts.durationData.filter(d => d.Result === 'Break Even')} fill="var(--text-muted)" shape="square" />
                        </ScatterChart>
                    </ResponsiveContainer>
                </Card>
            )}

        </div>
    );
};
