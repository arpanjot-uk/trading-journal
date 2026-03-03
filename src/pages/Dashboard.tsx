import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, Wallet, Target, Info, TrendingUp, TrendingDown,
    Clock, ArrowUpRight, Shield, Zap, Trophy, AlertTriangle
} from 'lucide-react';
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Legend, ScatterChart, Scatter, ZAxis,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    AreaChart, Area, ReferenceLine
} from 'recharts';
import { useMetrics } from '../hooks/useMetrics';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useJournalContext } from '../context/JournalContext';

type Tab = 'Advanced' | 'Trades' | 'Strategies' | 'Hourly' | 'Daily' | 'Duration' | 'Drawdown';
type DateRange = 'all' | 'month' | 'week';

// ---- Tooltip explanation for Radar axes ----
const SCORE_DESCRIPTIONS: Record<string, string> = {
    'Win %': 'Your win rate out of all trades (higher is better)',
    'Profit factor': 'Gross profit ÷ gross loss. Target ≥ 1.5',
    'Avg win/loss': 'Average winning trade ÷ average losing trade. Target ≥ 1.5×',
    'Recovery': 'Account gain % ÷ max drawdown. Shows how efficiently you recover losses',
    'Drawdown': 'Penalty for high max drawdown. 25% drawdown = score 0',
    'Consistency': 'Penalty for loss streaks. Every streak trade costs 5 points',
};

// ---- Small stat card component ----
const StatCard: React.FC<{
    label: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
    icon: React.ReactNode;
    iconBg: string;
    valueColor?: string;
}> = ({ label, value, sub, icon, iconBg, valueColor }) => (
    <Card style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="flex-between">
            <span className="text-secondary" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{label}</span>
            <div style={{ background: iconBg, padding: '0.3rem', borderRadius: 'var(--radius-sm)', display: 'flex' }}>{icon}</div>
        </div>
        <span style={{ fontSize: '1.65rem', fontWeight: 700, color: valueColor ?? 'var(--text-primary)', lineHeight: 1 }}>
            {value}
        </span>
        {sub && <span className="text-muted" style={{ fontSize: '0.72rem' }}>{sub}</span>}
    </Card>
);

// ---- Custom radar tooltip ----
const RadarTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const { subject, A, description } = payload[0]?.payload ?? {};
    return (
        <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.8rem', fontSize: '0.8rem', maxWidth: 220
        }}>
            <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>{subject}: {A?.toFixed(1)}</div>
            <div className="text-muted" style={{ lineHeight: 1.4 }}>{description ?? SCORE_DESCRIPTIONS[subject]}</div>
        </div>
    );
};

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { activeJournalId } = useJournalContext();
    const journalId = activeJournalId || 0;

    const { loading, journal, stats, charts } = useMetrics(journalId);
    const [activeTab, setActiveTab] = useState<Tab>('Advanced');
    const [dateRange, setDateRange] = useState<DateRange>('all');
    const [showScoreInfo, setShowScoreInfo] = useState(false);

    // ---- Date range filtered growth data ----
    const filteredGrowthData = useMemo(() => {
        if (!charts?.growthData) return [];
        if (dateRange === 'all') return charts.growthData;
        const now = new Date();
        const cutoff = dateRange === 'week'
            ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
            : new Date(now.getFullYear(), now.getMonth(), 1);
        // Use ISO cutoff string for reliable comparison against rawDate
        const cutoffISO = cutoff.toISOString().slice(0, 10);
        const startPoint = charts.growthData[0]; // always include the 'Start' baseline
        const filtered = charts.growthData.filter(d => d.rawDate >= cutoffISO);
        // Always prepend Start point so the chart has a baseline
        if (filtered.length > 0 && startPoint && startPoint.date === 'Start') {
            return [startPoint, ...filtered];
        }
        return filtered.length > 0 ? filtered : charts.growthData;
    }, [charts?.growthData, dateRange]);

    // ---- Drawdown curve data ----
    const drawdownData = useMemo(() => {
        if (!charts?.growthData || !stats) return [];
        let peak = stats.startingBalance;
        return charts.growthData.map(d => {
            if (d.equity > peak) peak = d.equity;
            const dd = peak > 0 ? -((peak - d.equity) / peak) * 100 : 0;
            return { date: d.date, drawdown: +dd.toFixed(2) };
        });
    }, [charts?.growthData, stats]);

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
        return <div className="container flex-center" style={{ minHeight: '50vh' }}>Crunching numbers…</div>;
    }

    const fmt$ = (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fmtPct = (val: number) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;

    const tabs: Tab[] = ['Advanced', 'Trades', 'Strategies', 'Hourly', 'Daily', 'Duration', 'Drawdown'];

    return (
        <div>
            {/* ── HEADER ── */}
            <div style={{ marginBottom: '2rem', marginTop: '0.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)', padding: '0.45rem', borderRadius: '8px', display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px var(--accent-glow)' }}>
                        <BookOpen size={18} color="#fff" />
                    </div>
                    <h1 style={{ margin: 0, fontSize: '1.65rem' }}>{journal.name}</h1>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Performance analytics and trade statistics</p>
            </div>

            {/* ── OVERVIEW STAT CARDS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>

                {/* Net P&L */}
                <StatCard
                    label="Net P&L"
                    value={fmt$(stats.totalPnl)}
                    sub={`Started at ${fmt$(stats.startingBalance)}`}
                    icon={<Wallet size={14} color="var(--accent-primary)" />}
                    iconBg="rgba(59,130,246,0.12)"
                    valueColor={stats.totalPnl >= 0 ? 'var(--win-color)' : 'var(--loss-color)'}
                />

                {/* Account Balance */}
                <StatCard
                    label="Account Balance"
                    value={fmt$(stats.balance)}
                    sub={
                        <span style={{ color: stats.gain >= 0 ? 'var(--win-color)' : 'var(--loss-color)', fontWeight: 600 }}>
                            {stats.gain >= 0 ? <TrendingUp size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} /> : <TrendingDown size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} />}
                            {fmtPct(stats.gain)} on capital
                        </span>
                    }
                    icon={<ArrowUpRight size={14} color={stats.gain >= 0 ? 'var(--win-color)' : 'var(--loss-color)'} />}
                    iconBg={stats.gain >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'}
                    valueColor="var(--text-primary)"
                />

                {/* Trade Expectancy */}
                <StatCard
                    label="Trade Expectancy"
                    value={fmt$(stats.expectancy)}
                    sub="Expected $ per trade"
                    icon={<Target size={14} color="#8B5CF6" />}
                    iconBg="rgba(139,92,246,0.12)"
                    valueColor={stats.expectancy >= 0 ? 'var(--win-color)' : 'var(--loss-color)'}
                />

                {/* Profit Factor */}
                <Card style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span className="text-secondary" style={{ fontSize: '0.82rem', fontWeight: 500 }}>Profit Factor</span>
                        <span style={{ fontSize: '1.65rem', fontWeight: 700 }}>{stats.profitFactor >= 999 ? '∞' : stats.profitFactor.toFixed(2)}</span>
                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>Target ≥ 1.5</span>
                    </div>
                    <svg width="48" height="48" viewBox="0 0 48 48">
                        <circle cx="24" cy="24" r="20" fill="none" stroke="var(--loss-color)" strokeWidth="4" />
                        <circle cx="24" cy="24" r="20" fill="none" stroke="var(--win-color)" strokeWidth="4"
                            strokeDasharray={`${(stats.grossProfit / (stats.grossProfit + stats.grossLoss + 0.001)) * 125.6} 125.6`}
                            strokeDashoffset="0" transform="rotate(-90 24 24)" strokeLinecap="round" />
                    </svg>
                </Card>

                {/* Win Rate */}
                <Card style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span className="text-secondary" style={{ fontSize: '0.82rem', fontWeight: 500 }}>Win Rate</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.winRate.toFixed(1)}%</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                        <svg width="60" height="30" viewBox="0 0 60 30" style={{ overflow: 'visible' }}>
                            <path d="M 5 30 A 25 25 0 0 1 55 30" fill="none" stroke="var(--loss-color)" strokeWidth="5" strokeLinecap="round" />
                            <path d="M 5 30 A 25 25 0 0 1 55 30" fill="none" stroke="var(--win-color)" strokeWidth="5" strokeLinecap="round"
                                strokeDasharray={`${(stats.winRate / 100) * 78.5} 78.5`} />
                        </svg>
                        <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.6rem', fontWeight: 600 }}>
                            <span style={{ background: 'var(--win-bg)', color: 'var(--win-color)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{stats.totalWon}W</span>
                            <span style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{stats.totalTrades - stats.totalWon - stats.totalLost}BE</span>
                            <span style={{ background: 'var(--loss-bg)', color: 'var(--loss-color)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{stats.totalLost}L</span>
                        </div>
                    </div>
                </Card>

                {/* Max Drawdown */}
                <StatCard
                    label="Max Drawdown"
                    value={`${stats.maxDrawdown.toFixed(2)}%`}
                    sub={`${stats.maxConsecutiveLosses} worst loss streak`}
                    icon={<Shield size={14} color={stats.maxDrawdown > 20 ? 'var(--loss-color)' : stats.maxDrawdown > 10 ? '#EAB308' : 'var(--win-color)'} />}
                    iconBg={stats.maxDrawdown > 20 ? 'rgba(239,68,68,0.12)' : 'rgba(234,179,8,0.12)'}
                    valueColor={stats.maxDrawdown > 20 ? 'var(--loss-color)' : stats.maxDrawdown > 10 ? '#EAB308' : 'var(--win-color)'}
                />

                {/* Avg Duration */}
                <StatCard
                    label="Avg Duration"
                    value={stats.avgDuration < 60
                        ? `${Math.round(stats.avgDuration)}m`
                        : `${Math.floor(stats.avgDuration / 60)}h ${Math.round(stats.avgDuration % 60)}m`}
                    sub={`${stats.totalTrades} trades total`}
                    icon={<Clock size={14} color="#F59E0B" />}
                    iconBg="rgba(245,158,11,0.12)"
                />
            </div>

            {/* ── DATE RANGE FILTER ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span className="text-muted" style={{ fontSize: '0.78rem', fontWeight: 500 }}>Growth chart:</span>
                {(['all', 'month', 'week'] as DateRange[]).map(r => (
                    <button
                        key={r}
                        onClick={() => setDateRange(r)}
                        style={{
                            padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600,
                            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            background: dateRange === r ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                            color: dateRange === r ? '#fff' : 'var(--text-secondary)',
                            border: '1px solid ' + (dateRange === r ? 'var(--accent-primary)' : 'var(--border-color)'),
                            transition: 'all 0.15s'
                        }}
                    >
                        {r === 'all' ? 'All Time' : r === 'month' ? 'This Month' : 'This Week'}
                    </button>
                ))}
            </div>

            {/* ── CHARTS ROW (GROWTH & PERFORMANCE SCORE) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <Card style={{ height: '420px' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Equity Curve</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <ComposedChart data={filteredGrowthData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} />
                            <YAxis yAxisId="left" stroke="var(--text-secondary)" fontSize={11} tickFormatter={(v) => `$${v}`} domain={['auto', 'auto']} />
                            <YAxis yAxisId="right" orientation="right" stroke="var(--text-secondary)" fontSize={11} />
                            <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} formatter={(val: any, name: string | undefined) => [typeof val === 'number' ? `$${val.toFixed(2)}` : val, name ?? '']} />
                            <Bar yAxisId="right" dataKey="profit" name="Daily PnL" fill="var(--neutral-color)" opacity={0.45} />
                            <Line yAxisId="left" type="monotone" dataKey="equity" name="Equity" stroke="var(--accent-primary)" strokeWidth={2.5} dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </Card>

                <Card style={{ height: '420px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0 }}>Performance Score</h3>
                        <button
                            onClick={() => setShowScoreInfo(s => !s)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                            title="How is this calculated?"
                        >
                            <Info size={16} />
                        </button>
                    </div>

                    {showScoreInfo && !stats.hasEnoughData && (
                        <div style={{ fontSize: '0.75rem', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <AlertTriangle size={12} color="#EAB308" />
                            <span className="text-muted">Score needs ≥10 trades to be meaningful ({stats.totalTrades} so far)</span>
                        </div>
                    )}

                    {!stats.hasEnoughData && !showScoreInfo && (
                        <div style={{ fontSize: '0.72rem', color: '#EAB308', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <AlertTriangle size={11} /> {stats.totalTrades}/10 trades for reliable score
                        </div>
                    )}

                    <div style={{ flex: 1, minHeight: 0 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={charts.scoreData}>
                                <PolarGrid stroke="var(--border-color)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Score" dataKey="A" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.4} />
                                <RechartsTooltip content={<RadarTooltip />} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Overall Score Bar */}
                    <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                        <div className="flex-between" style={{ marginBottom: '0.4rem' }}>
                            <span className="text-secondary" style={{ fontSize: '0.82rem' }}>Overall Score</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{stats.scoreOverview.toFixed(1)}<span className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 400 }}>/100</span></span>
                        </div>
                        <div style={{ position: 'relative', width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(90deg, var(--loss-color) 0%, #EAB308 50%, var(--win-color) 100%)', opacity: 0.85 }} />
                            <div style={{ position: 'absolute', top: 0, right: 0, width: `${100 - Math.min(100, Math.max(0, stats.scoreOverview))}%`, height: '100%', background: 'var(--bg-tertiary)', transition: 'width 0.5s ease-out' }} />
                            <div style={{ position: 'absolute', top: 0, left: `calc(${Math.min(100, Math.max(0, stats.scoreOverview))}% - 2px)`, width: '4px', height: '100%', background: '#fff', borderRadius: '2px', boxShadow: '0 0 4px rgba(0,0,0,0.5)', transition: 'left 0.5s ease-out' }} />
                        </div>
                        <div className="flex-between text-muted" style={{ fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600 }}>
                            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* ── TABS ── */}
            <div className="tab-bar" style={{ marginBottom: '1rem' }}>
                {tabs.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-item ${activeTab === tab ? 'active' : ''}`}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* ── ADVANCED TAB ── */}
            {activeTab === 'Advanced' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Card>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div className="flex-between"><span className="text-secondary">Trades:</span><span>{stats.totalTrades}</span></div>
                                <div className="flex-between"><span className="text-secondary">Win Rate:</span><span style={{ color: stats.winRate >= 50 ? 'var(--win-color)' : 'var(--loss-color)' }}>{stats.winRate.toFixed(2)}%</span></div>
                                <div className="flex-between"><span className="text-secondary">Avg Win:</span><span className="text-win">{fmt$(stats.avgWin)}</span></div>
                                <div className="flex-between"><span className="text-secondary">Avg Loss:</span><span className="text-loss">{fmt$(stats.avgLoss)}</span></div>
                                <div className="flex-between"><span className="text-secondary">Total Lots:</span><span>{stats.totalLots.toFixed(2)}</span></div>
                                <div className="flex-between"><span className="text-secondary">Avg Duration:</span><span>{stats.avgDuration < 60 ? `${Math.round(stats.avgDuration)}m` : `${Math.floor(stats.avgDuration / 60)}h ${Math.round(stats.avgDuration % 60)}m`}</span></div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div className="flex-between"><span className="text-secondary">Longs Won:</span><span>{stats.longWon}/{stats.longTrades}</span></div>
                                <div className="flex-between"><span className="text-secondary">Shorts Won:</span><span>{stats.shortWon}/{stats.shortTrades}</span></div>
                                <div className="flex-between"><span className="text-secondary">Best Trade:</span><span className="text-win">{fmt$(stats.bestTrade === Number.NEGATIVE_INFINITY ? 0 : stats.bestTrade)}</span></div>
                                <div className="flex-between"><span className="text-secondary">Worst Trade:</span><span className="text-loss">{fmt$(stats.worstTrade === Number.POSITIVE_INFINITY ? 0 : stats.worstTrade)}</span></div>
                                <div className="flex-between"><span className="text-secondary">Max Drawdown:</span><span style={{ color: stats.maxDrawdown > 15 ? 'var(--loss-color)' : 'var(--text-primary)' }}>{stats.maxDrawdown.toFixed(2)}%</span></div>
                                <div className="flex-between"><span className="text-secondary">Account Gain:</span><span style={{ color: stats.gain >= 0 ? 'var(--win-color)' : 'var(--loss-color)' }}>{fmtPct(stats.gain)}</span></div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div className="flex-between"><span className="text-secondary">Profit Factor:</span><span>{stats.profitFactor >= 999 ? '∞' : stats.profitFactor.toFixed(2)}</span></div>
                                <div className="flex-between"><span className="text-secondary">Expectancy:</span><span>{fmt$(stats.expectancy)}</span></div>
                                <div className="flex-between"><span className="text-secondary">Gross Profit:</span><span className="text-win">{fmt$(stats.grossProfit)}</span></div>
                                <div className="flex-between"><span className="text-secondary">Net Loss:</span><span className="text-loss">-{fmt$(stats.netLoss)}</span></div>
                            </div>
                        </div>
                    </Card>

                    {/* Streak Summary */}
                    <Card>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <Trophy size={16} className="text-muted" />
                            <h3 style={{ margin: 0 }}>Streak Summary</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div style={{ padding: '1rem', background: 'rgba(34,197,94,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(34,197,94,0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                    <Zap size={14} color="var(--win-color)" />
                                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--win-color)' }}>Best Win Streak</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--win-color)' }}>{stats.maxConsecutiveWins}</span>
                                    <span className="text-secondary" style={{ fontSize: '0.8rem' }}>consecutive wins</span>
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>
                                    +{fmt$(stats.maxConsecutiveProfit)} during streak
                                </div>
                            </div>
                            <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                    <AlertTriangle size={14} color="var(--loss-color)" />
                                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--loss-color)' }}>Worst Loss Streak</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--loss-color)' }}>{stats.maxConsecutiveLosses}</span>
                                    <span className="text-secondary" style={{ fontSize: '0.8rem' }}>consecutive losses</span>
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>
                                    -{fmt$(stats.maxConsecutiveLoss)} during streak
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* ── TRADES / PAIRS TAB ── */}
            {activeTab === 'Trades' && (
                <Card padding="none" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                                {['Currency', 'Trades', 'Pips (est.)', 'P&L ($)', 'Won (%)'].map(h => (
                                    <th key={h} style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{h}</th>
                                ))}
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
                                        <td style={{ padding: '1rem', color: p.pnl >= 0 ? 'var(--win-color)' : 'var(--loss-color)' }}>{fmt$(p.pnl)}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', background: winPct >= 50 ? 'var(--win-bg)' : 'var(--loss-bg)', color: winPct >= 50 ? 'var(--win-color)' : 'var(--loss-color)' }}>
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

            {/* ── STRATEGIES TAB ── */}
            {activeTab === 'Strategies' && (
                <Card padding="none" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                                {['Strategy', 'Trades', 'Win %', 'P&L ($)', 'Profit Factor', 'Avg R:R'].map(h => (
                                    <th key={h} style={{ padding: '1rem', fontWeight: 500, color: 'var(--text-secondary)', textAlign: h === 'Strategy' ? 'left' : 'center' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {charts.strategiesData.length > 0 ? (
                                [...charts.strategiesData].sort((a, b) => b.pnl - a.pnl).map(s => (
                                    <tr key={s.name} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'left' }}>{s.name}</td>
                                        <td style={{ padding: '1rem' }}>{s.trades}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', background: s.winRate >= 50 ? 'var(--win-bg)' : 'var(--loss-bg)', color: s.winRate >= 50 ? 'var(--win-color)' : 'var(--loss-color)', fontWeight: 600 }}>
                                                {s.winRate}%
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: s.pnl >= 0 ? 'var(--win-color)' : 'var(--loss-color)', fontWeight: 600 }}>{fmt$(s.pnl)}</td>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>{s.profitFactor >= 999 ? '∞' : s.profitFactor}</td>
                                        <td style={{ padding: '1rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{s.avgRr > 0 ? s.avgRr : '—'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={6} style={{ padding: '2rem' }} className="text-muted">No strategy data yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </Card>
            )}

            {/* ── HOURLY TAB ── */}
            {activeTab === 'Hourly' && (
                <Card style={{ height: '480px' }}>
                    <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Winners vs. Losers by Hour (UTC)</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={charts.hourlyMap}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="hour" stroke="var(--text-secondary)" fontSize={10} />
                            <YAxis stroke="var(--text-secondary)" />
                            <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }} />
                            <Legend />
                            <Bar dataKey="Winners" stackId="a" fill="var(--win-color)" />
                            <Bar dataKey="Losers" stackId="a" fill="var(--loss-color)" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            )}

            {/* ── DAILY TAB ── */}
            {activeTab === 'Daily' && (
                <Card style={{ height: '480px' }}>
                    <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Winners vs. Losers by Day of Week</h3>
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

            {/* ── DURATION TAB ── */}
            {activeTab === 'Duration' && (
                <Card style={{ height: '480px' }}>
                    <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Duration vs PnL %</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="Duration" type="number" name="Duration (min)" stroke="var(--text-secondary)" domain={['dataMin', 'dataMax']} />
                            <YAxis dataKey="Growth" type="number" name="PnL %" stroke="var(--text-secondary)" tickFormatter={(v) => `${(v * 100).toFixed(2)}%`} />
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

            {/* ── DRAWDOWN TAB ── */}
            {activeTab === 'Drawdown' && (
                <Card style={{ height: '480px' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>Drawdown Curve</h3>
                    <p className="text-muted" style={{ fontSize: '0.78rem', margin: '0 0 1rem' }}>
                        How far below peak equity your account fell at each point. Max: <span style={{ color: 'var(--loss-color)', fontWeight: 700 }}>{stats.maxDrawdown.toFixed(2)}%</span>
                    </p>
                    <ResponsiveContainer width="100%" height="85%">
                        <AreaChart data={drawdownData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} />
                            <YAxis stroke="var(--text-secondary)" fontSize={11} tickFormatter={(v) => `${v.toFixed(1)}%`} domain={['dataMin', 0]} />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                                formatter={(val: any) => [`${Number(val).toFixed(2)}%`, 'Drawdown']}
                            />
                            <ReferenceLine y={0} stroke="var(--border-color)" strokeDasharray="4 4" />
                            <defs>
                                <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="drawdown" stroke="#EF4444" strokeWidth={2} fill="url(#ddGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>
            )}
        </div>
    );
};
