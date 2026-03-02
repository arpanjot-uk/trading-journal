import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Wallet, Target, Info } from 'lucide-react';
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Legend, ScatterChart, Scatter, ZAxis, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
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

            {/* OVERVIEW SECTION (METRICS ROW) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {/* 1. Net P&L */}
                <Card style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                    <div className="flex-between">
                        <span className="text-secondary" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Net P&L</span>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.3rem', borderRadius: 'var(--radius-sm)', color: 'var(--accent-primary)' }}>
                            <Wallet size={14} />
                        </div>
                    </div>
                    <span style={{ fontSize: '1.75rem', fontWeight: 700, color: stats.totalPnl >= 0 ? 'var(--win-color)' : 'var(--loss-color)' }}>
                        {formatMoney(stats.totalPnl)}
                    </span>
                </Card>

                {/* 2. Trade Expectancy */}
                <Card style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                    <div className="flex-between">
                        <span className="text-secondary" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Trade expectancy</span>
                        <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.3rem', borderRadius: 'var(--radius-sm)', color: '#8B5CF6' }}>
                            <Target size={14} />
                        </div>
                    </div>
                    <span style={{ fontSize: '1.75rem', fontWeight: 700, color: stats.expectancy >= 0 ? 'var(--win-color)' : 'var(--loss-color)' }}>
                        {formatMoney(stats.expectancy)}
                    </span>
                </Card>

                {/* 3. Profit Factor */}
                <Card style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span className="text-secondary" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Profit factor</span>
                        <span style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.profitFactor.toFixed(2)}</span>
                    </div>
                    <svg width="48" height="48" viewBox="0 0 48 48">
                        <circle cx="24" cy="24" r="20" fill="none" stroke="var(--loss-color)" strokeWidth="4" />
                        <circle cx="24" cy="24" r="20" fill="none" stroke="var(--win-color)" strokeWidth="4"
                            strokeDasharray={`${(stats.grossProfit / (stats.grossProfit + stats.grossLoss + 0.001)) * 125.6} 125.6`}
                            strokeDashoffset="0" transform="rotate(-90 24 24)" strokeLinecap="round" />
                    </svg>
                </Card>

                {/* 4. Trade win % */}
                <Card style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span className="text-secondary" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Trade win %</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.winRate.toFixed(2)}%</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                        <svg width="60" height="30" viewBox="0 0 60 30" style={{ overflow: 'visible' }}>
                            <path d="M 5 30 A 25 25 0 0 1 55 30" fill="none" stroke="var(--loss-color)" strokeWidth="5" strokeLinecap="round" />
                            <path d="M 5 30 A 25 25 0 0 1 55 30" fill="none" stroke="var(--win-color)" strokeWidth="5" strokeLinecap="round"
                                strokeDasharray={`${(stats.winRate / 100) * 78.5} 78.5`} />
                        </svg>
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.6rem', fontWeight: 600 }}>
                            <span style={{ background: 'var(--win-bg)', color: 'var(--win-color)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{stats.totalWon}</span>
                            <span style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{stats.totalTrades - stats.totalWon - stats.totalLost}</span>
                            <span style={{ background: 'var(--loss-bg)', color: 'var(--loss-color)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{stats.totalLost}</span>
                        </div>
                    </div>
                </Card>

                {/* 5. Avg win/loss trade */}
                <Card style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                    <span className="text-secondary" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Avg win/loss trade</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{(stats.avgWin / (stats.avgLoss || 1)).toFixed(2)}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                            <div style={{ display: 'flex', width: '100%', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${(stats.avgWin / (stats.avgWin + stats.avgLoss + 0.001) * 100)}%`, background: 'var(--win-color)' }} />
                                <div style={{ width: `${(stats.avgLoss / (stats.avgWin + stats.avgLoss + 0.001) * 100)}%`, background: 'var(--loss-color)' }} />
                            </div>
                            <div className="flex-between" style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                                <span className="text-win">${stats.avgWin.toFixed(0)}</span>
                                <span className="text-loss">-${stats.avgLoss.toFixed(0)}</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* CHARTS ROW (GROWTH & PERFORMANCE SCORE) */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <Card style={{ height: '450px' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Growth Chart</h3>
                    <ResponsiveContainer width="100%" height="90%">
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

                <Card style={{ height: '450px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0 }}>Performance Score</h3>
                        <Info size={16} className="text-muted" />
                    </div>
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={charts.scoreData}>
                                <PolarGrid stroke="var(--border-color)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Score" dataKey="A" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.4} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Overall Score Bar */}
                    <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                            <span className="text-secondary" style={{ fontSize: '0.85rem' }}>Your Score</span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stats.scoreOverview.toFixed(2)}</span>
                        </div>
                        <div style={{ position: 'relative', width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                            {/* Gradient Background */}
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(90deg, var(--loss-color) 0%, #EAB308 50%, var(--win-color) 100%)', opacity: 0.8 }} />

                            {/* Mask overlay to block out unused portion */}
                            <div style={{ position: 'absolute', top: 0, right: 0, width: `${100 - Math.min(100, Math.max(0, stats.scoreOverview))}%`, height: '100%', background: 'var(--bg-tertiary)', transition: 'width 0.5s ease-out' }} />

                            {/* Indicator Tick */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: `calc(${Math.min(100, Math.max(0, stats.scoreOverview))}% - 2px)`,
                                width: '4px',
                                height: '100%',
                                background: '#fff',
                                borderRadius: '2px',
                                boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                                transition: 'left 0.5s ease-out'
                            }} />
                        </div>
                        <div className="flex-between text-muted" style={{ fontSize: '0.7rem', marginTop: '0.25rem', fontWeight: 600 }}>
                            <span>0</span>
                            <span>20</span>
                            <span>40</span>
                            <span>60</span>
                            <span>80</span>
                            <span>100</span>
                        </div>
                    </div>
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
