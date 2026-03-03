import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addMonths, subMonths } from 'date-fns';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, ScatterChart, Scatter, ZAxis, LineChart, Line,
    Legend, Cell
} from 'recharts';
import {
    BookOpen, ChevronLeft, ChevronRight, Heart, TrendingUp, TrendingDown,
    AlertTriangle, CheckCircle2, Brain, Smile, Activity, Zap, Frown, SmilePlus,
    Meh, Angry
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useJournalContext } from '../context/JournalContext';
import { useEmotionMetrics } from '../hooks/useEmotionMetrics';
import { SEO } from '../components/SEO';

// --- Helpers ---
const MOOD_COLORS: Record<number, string> = {
    1: '#EF4444', 2: '#F97316', 3: '#EAB308', 4: '#84CC16', 5: '#22C55E'
};

const MOOD_ICONS: Record<number, React.ReactNode> = {
    1: <Angry size={14} />, 2: <Frown size={14} />, 3: <Meh size={14} />,
    4: <Smile size={14} />, 5: <SmilePlus size={14} />
};

const MOOD_LABELS: Record<number, string> = {
    1: 'Terrible', 2: 'Bad', 3: 'Neutral', 4: 'Good', 5: 'Excellent'
};

const getMoodColor = (score: number | null) => {
    if (!score) return 'transparent';
    return MOOD_COLORS[score] ?? '#888';
};

const formatMoney = (v: number) =>
    `${v >= 0 ? '+' : ''}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const tooltipStyle = {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: '0.8rem'
};

// ---- Custom Tooltip for Scatter ----
const ScatterTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
        <div style={{ ...tooltipStyle, padding: '0.6rem 0.8rem' }}>
            <div><b>{d.date}</b></div>
            <div style={{ color: getMoodColor(d.moodScore) }}>Mood: {MOOD_LABELS[d.moodScore] ?? d.moodScore}</div>
            <div style={{ color: d.dayPnl >= 0 ? 'var(--win-color)' : 'var(--loss-color)' }}>Day PnL: {formatMoney(d.dayPnl)}</div>
            <div className="text-muted">Energy: {d.energyLevel} | Stress: {d.stressLevel}</div>
        </div>
    );
};

// ---- KPI Card ----
interface KpiCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    iconBg: string;
    valueColor?: string;
    trend?: 'up' | 'down' | 'neutral';
}
const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, icon, iconBg, valueColor, trend }) => (
    <Card style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div className="flex-between">
            <span className="text-secondary" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{title}</span>
            <div style={{ background: iconBg, padding: '0.35rem', borderRadius: 'var(--radius-sm)', display: 'flex' }}>
                {icon}
            </div>
        </div>
        <div>
            <span style={{ fontSize: '1.6rem', fontWeight: 700, color: valueColor ?? 'var(--text-primary)', display: 'block' }}>
                {value}
            </span>
            {subtitle && <span className="text-muted" style={{ fontSize: '0.75rem' }}>{subtitle}</span>}
        </div>
        {trend && (
            <div style={{ color: trend === 'up' ? 'var(--win-color)' : trend === 'down' ? 'var(--loss-color)' : 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : null}
            </div>
        )}
    </Card>
);

// ---- Lifestyle Bar ----
interface LifestyleBarProps { label: string; winRate: number; trades: number; color: string; };
const LifestyleBar: React.FC<LifestyleBarProps> = ({ label, winRate, trades, color }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div className="flex-between" style={{ fontSize: '0.82rem' }}>
            <span className="text-secondary">{label}</span>
            <span style={{ fontWeight: 700, color }}>{winRate > 0 ? `${winRate}%` : '—'} <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.7rem' }}>({trades} trades)</span></span>
        </div>
        <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${winRate}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
        </div>
    </div>
);

// ---- Main Page ----
export const EmotionDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { activeJournalId } = useJournalContext();
    const journalId = activeJournalId || 0;

    const now = new Date();
    const [calDate, setCalDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
    const calYear = calDate.getFullYear();
    const calMonth = calDate.getMonth();

    const data = useEmotionMetrics(journalId, calYear, calMonth);

    if (!activeJournalId) {
        return (
            <div className="flex-center" style={{ minHeight: '50vh', flexDirection: 'column', gap: '1rem' }}>
                <BookOpen size={48} className="text-muted" />
                <h2 className="text-secondary">No Journal Selected</h2>
                <p className="text-muted">Please select a journal from the Journals page first.</p>
                <Button onClick={() => navigate('/')}>Go to Journals</Button>
            </div>
        );
    }

    if (data.loading || !data.kpis) {
        return <div className="flex-center" style={{ minHeight: '50vh' }}>Analysing your emotions...</div>;
    }

    const { kpis, moodPerfData, emotionTraitData, lifestyleStats, weeklyTrendData, calendarWeeks } = data;

    const noData = moodPerfData.length === 0 && kpis.totalDaysLogged === 0;
    const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const lifestyleCategories = [
        { key: 'exercise', label: 'Exercise', color: '#22C55E' },
        { key: 'diet', label: 'Diet', color: '#F59E0B' },
        { key: 'sleep', label: 'Sleep', color: '#8B5CF6' },
        { key: 'stress', label: 'Stress', color: '#EF4444' },
    ];

    return (
        <div>
            <SEO title="Emotion Analytics | ArpanTrade" description="Understand how your emotions and lifestyle impact trading performance." />
            {/* ---- Header ---- */}
            <div style={{ marginBottom: '2rem', marginTop: '0.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', padding: '0.45rem', borderRadius: '8px', display: 'flex', boxShadow: '0 4px 12px rgba(139,92,246,0.25)' }}>
                        <Heart size={18} color="#fff" />
                    </div>
                    <h1 style={{ margin: 0, fontSize: '1.65rem' }}>Emotion Analytics</h1>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Understand how your emotions and lifestyle impact trading performance</p>
            </div>

            {noData ? (
                <Card style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <Brain size={48} className="text-muted" />
                    <h3 style={{ margin: 0 }}>No emotion data yet</h3>
                    <p className="text-muted">Start logging your daily mood using the <b>Log Mood</b> button in the sidebar. Add emotion scores when logging trades to unlock insights.</p>
                </Card>
            ) : (
                <>
                    {/* ---- KPI Cards ---- */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <KpiCard
                            title="Avg Daily Mood"
                            value={`${kpis.avgMood} / 5`}
                            subtitle={MOOD_LABELS[Math.round(kpis.avgMood)] ?? ''}
                            icon={<Smile size={14} style={{ color: getMoodColor(Math.round(kpis.avgMood)) }} />}
                            iconBg={`${getMoodColor(Math.round(kpis.avgMood))}22`}
                            valueColor={getMoodColor(Math.round(kpis.avgMood))}
                        />
                        <KpiCard
                            title="Mood Log Rate"
                            value={`${kpis.logRate}%`}
                            subtitle={`${kpis.totalDaysLogged} of ${kpis.totalTradingDays} trading days`}
                            icon={<CheckCircle2 size={14} color="#22C55E" />}
                            iconBg="rgba(34,197,94,0.12)"
                            valueColor={kpis.logRate >= 70 ? 'var(--win-color)' : kpis.logRate >= 40 ? '#EAB308' : 'var(--loss-color)'}
                        />
                        <KpiCard
                            title="Good Mood Days PnL"
                            value={formatMoney(kpis.avgPnlGoodMood)}
                            subtitle="Avg PnL when mood ≥ 4"
                            icon={<SmilePlus size={14} color="#22C55E" />}
                            iconBg="rgba(34,197,94,0.12)"
                            valueColor={kpis.avgPnlGoodMood >= 0 ? 'var(--win-color)' : 'var(--loss-color)'}
                            trend={kpis.avgPnlGoodMood >= 0 ? 'up' : 'down'}
                        />
                        <KpiCard
                            title="Bad Mood Days PnL"
                            value={formatMoney(kpis.avgPnlBadMood)}
                            subtitle="Avg PnL when mood ≤ 2"
                            icon={<Frown size={14} color="#EF4444" />}
                            iconBg="rgba(239,68,68,0.12)"
                            valueColor={kpis.avgPnlBadMood >= 0 ? 'var(--win-color)' : 'var(--loss-color)'}
                            trend={kpis.avgPnlBadMood >= 0 ? 'up' : 'down'}
                        />
                    </div>

                    {/* ---- Emotion Trait Breakdown + Mood vs PnL ---- */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                        {/* Trait Breakdown */}
                        <Card style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <Brain size={16} className="text-muted" />
                                <h3 style={{ margin: 0 }}>Emotion Traits by Trade Result</h3>
                            </div>
                            <p className="text-muted" style={{ fontSize: '0.78rem', margin: '0 0 0.75rem' }}>Avg score per trait (0–10) split by win/loss outcome</p>
                            <div style={{ flex: 1 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={emotionTraitData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                                        <XAxis dataKey="trait" stroke="var(--text-secondary)" fontSize={11} />
                                        <YAxis domain={[0, 10]} stroke="var(--text-secondary)" fontSize={11} />
                                        <RechartsTooltip contentStyle={tooltipStyle} />
                                        <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                                        <Bar dataKey="Win" fill="#22C55E" radius={[3, 3, 0, 0]} />
                                        <Bar dataKey="Loss" fill="#EF4444" radius={[3, 3, 0, 0]} />
                                        <Bar dataKey="Break Even" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Mood vs PnL Scatter */}
                        <Card style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <Activity size={16} className="text-muted" />
                                <h3 style={{ margin: 0 }}>Daily Mood vs P&amp;L</h3>
                            </div>
                            <p className="text-muted" style={{ fontSize: '0.78rem', margin: '0 0 0.75rem' }}>Each dot = a trading day you logged your mood</p>
                            <div style={{ flex: 1 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                                        <XAxis
                                            type="number" dataKey="moodScore" name="Mood"
                                            domain={[0.5, 5.5]} ticks={[1, 2, 3, 4, 5]}
                                            tickFormatter={v => MOOD_LABELS[v] ?? v}
                                            stroke="var(--text-secondary)" fontSize={10}
                                        />
                                        <YAxis
                                            type="number" dataKey="dayPnl" name="Day PnL"
                                            tickFormatter={v => `$${v}`}
                                            stroke="var(--text-secondary)" fontSize={11}
                                        />
                                        <ZAxis range={[60, 60]} />
                                        <RechartsTooltip content={<ScatterTooltip />} />
                                        <Scatter data={moodPerfData} shape="circle">
                                            {moodPerfData.map((entry, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={entry.dayPnl >= 0 ? '#22C55E' : '#EF4444'}
                                                    fillOpacity={0.75}
                                                    stroke={getMoodColor(entry.moodScore)}
                                                    strokeWidth={2}
                                                />
                                            ))}
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    {/* ---- Lifestyle Impact + Weekly Trend ---- */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                        {/* Lifestyle Panel */}
                        <Card style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Zap size={16} className="text-muted" />
                                <h3 style={{ margin: 0 }}>Lifestyle Impact on Win Rate</h3>
                            </div>
                            {lifestyleCategories.map(cat => {
                                const rows = lifestyleStats.filter(r => r.category === cat.key);
                                return (
                                    <div key={cat.key}>
                                        <h4 style={{ margin: '0 0 0.6rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>{cat.label}</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {rows.map(r => (
                                                <LifestyleBar key={r.label} label={r.label} winRate={r.winRate} trades={r.trades} color={cat.color} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </Card>

                        {/* Weekly Trend */}
                        <Card style={{ height: '420px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <TrendingUp size={16} className="text-muted" />
                                <h3 style={{ margin: 0 }}>Weekly Mood &amp; PnL Trend</h3>
                            </div>
                            <p className="text-muted" style={{ fontSize: '0.78rem', margin: '0 0 0.75rem' }}>Avg mood score vs net weekly P&amp;L per week</p>
                            <div style={{ flex: 1 }}>
                                {weeklyTrendData.length < 2 ? (
                                    <div className="flex-center" style={{ height: '100%', flexDirection: 'column', gap: '0.5rem' }}>
                                        <TrendingUp size={32} className="text-muted" />
                                        <p className="text-muted" style={{ fontSize: '0.85rem' }}>Need at least 2 weeks of data</p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={weeklyTrendData} margin={{ top: 4, right: 24, bottom: 4, left: -8 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                                            <XAxis dataKey="weekLabel" stroke="var(--text-secondary)" fontSize={11} />
                                            <YAxis yAxisId="left" stroke="#8B5CF6" fontSize={11} domain={[0, 5]} tickFormatter={v => `${v}`} />
                                            <YAxis yAxisId="right" orientation="right" stroke="var(--text-secondary)" fontSize={11} tickFormatter={v => `$${v}`} />
                                            <RechartsTooltip contentStyle={tooltipStyle} />
                                            <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                                            <Line yAxisId="left" type="monotone" dataKey="avgMood" name="Avg Mood" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 4, fill: '#8B5CF6' }} />
                                            <Line yAxisId="right" type="monotone" dataKey="netPnl" name="Net PnL ($)" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 4, fill: '#22C55E' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* ---- Emotion Calendar ---- */}
                    <Card style={{ marginBottom: '2rem' }}>
                        {/* Calendar Header */}
                        <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <h3 style={{ margin: 0 }}>Emotion Calendar</h3>
                                <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    {format(calDate, 'MMMM yyyy')}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setCalDate(subMonths(calDate, 1))}
                                    style={{ display: 'flex', alignItems: 'center', padding: '0.35rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => setCalDate(addMonths(calDate, 1))}
                                    style={{ display: 'flex', alignItems: 'center', padding: '0.35rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <span key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: MOOD_COLORS[s], display: 'inline-block' }} />
                                    {MOOD_LABELS[s]}
                                </span>
                            ))}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <AlertTriangle size={10} color="#F59E0B" /> Missed log
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <span style={{ fontSize: '0.7rem' }}>📊</span> Traded
                            </span>
                        </div>

                        {/* Day headers + weekly summary col */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr) 120px', gap: '2px', marginBottom: '2px' }}>
                            {weekDayLabels.map(d => (
                                <div key={d} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', padding: '0.3rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
                            ))}
                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', padding: '0.3rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Week</div>
                        </div>

                        {/* Calendar Rows */}
                        {calendarWeeks.map((week, wi) => (
                            <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr) 120px', gap: '2px', marginBottom: '2px' }}>
                                {week.days.map((day, di) => {
                                    const moodColor = getMoodColor(day.moodScore);
                                    const isToday = day.date === format(new Date(), 'yyyy-MM-dd');
                                    return (
                                        <div key={di} style={{
                                            minHeight: '68px',
                                            padding: '0.4rem',
                                            borderRadius: 'var(--radius-sm)',
                                            background: !day.isCurrentMonth ? 'transparent' :
                                                day.hasMoodLog ? `${moodColor}0D` : 'var(--bg-tertiary)',
                                            border: isToday ? '1.5px solid var(--accent-primary)' :
                                                day.isMissedLog ? '1.5px solid #F59E0B44' :
                                                    '1.5px solid transparent',
                                            opacity: day.isCurrentMonth ? 1 : 0.25,
                                            display: 'flex', flexDirection: 'column', gap: '0.3rem',
                                            position: 'relative'
                                        }}>
                                            {/* Day number + mood dot */}
                                            <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                                                <span style={{
                                                    fontSize: '0.8rem', fontWeight: isToday ? 700 : 500,
                                                    color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)'
                                                }}>{day.dayOfMonth}</span>
                                                {day.hasMoodLog && day.moodScore && (
                                                    <span style={{ color: moodColor, display: 'flex', alignItems: 'center' }} title={MOOD_LABELS[day.moodScore]}>
                                                        {MOOD_ICONS[day.moodScore]}
                                                    </span>
                                                )}
                                                {day.isMissedLog && (
                                                    <span title="Traded but no mood log!"><AlertTriangle size={12} color="#F59E0B" /></span>
                                                )}
                                            </div>

                                            {/* Mood score text */}
                                            {day.hasMoodLog && day.moodScore && (
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: moodColor }} />
                                            )}

                                            {/* Trade indicator */}
                                            {day.hadTrades && (
                                                <div style={{ marginTop: 'auto', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                    <span>📊</span>
                                                    <span style={{ color: day.dayPnl >= 0 ? 'var(--win-color)' : 'var(--loss-color)', fontWeight: 600 }}>
                                                        {day.dayPnl >= 0 ? '+' : ''}{day.dayPnl.toFixed(0)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Weekly Summary Cell */}
                                <div style={{
                                    minHeight: '68px',
                                    padding: '0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.25rem'
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>W{wi + 1}</div>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: week.weekPnl >= 0 ? 'var(--win-color)' : 'var(--loss-color)' }}>
                                        {week.weekPnl !== 0 ? (week.weekPnl >= 0 ? '+' : '') + week.weekPnl.toFixed(0) : '—'}
                                    </div>
                                    {week.avgMood !== null && (
                                        <div style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem', color: getMoodColor(Math.round(week.avgMood)) }}>
                                            <span>😊</span>{week.avgMood.toFixed(1)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </Card>

                    {/* ---- Trade Emotion KPI Row ---- */}
                    <Card style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                            <Brain size={16} className="text-muted" />
                            <h3 style={{ margin: 0 }}>Overall Trade Emotion Averages</h3>
                            <span className="text-muted" style={{ fontSize: '0.78rem' }}>(from per-trade emotion scores, scale 0–10)</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                            {[
                                { label: 'FOMO', value: kpis.avgEmotionFomo, low: 'Low impulsiveness', high: 'High impulsiveness', goodIsLow: true },
                                { label: 'Patience', value: kpis.avgEmotionPatience, low: 'Low patience', high: 'High patience', goodIsLow: false },
                                { label: 'Discipline', value: kpis.avgEmotionDiscipline, low: 'Low discipline', high: 'High discipline', goodIsLow: false },
                                { label: 'Confidence', value: kpis.avgEmotionConfidence, low: 'Low confidence', high: 'High confidence', goodIsLow: false },
                            ].map(({ label, value, goodIsLow }) => {
                                const pct = value * 10;
                                const isGood = goodIsLow ? value <= 5 : value >= 6;
                                const color = isGood ? 'var(--win-color)' : value === 0 ? 'var(--text-muted)' : '#EAB308';
                                return (
                                    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                        <div className="flex-between">
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{label}</span>
                                            <span style={{ fontSize: '1rem', fontWeight: 700, color }}>{value > 0 ? `${value}/10` : '—'}</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                                        </div>
                                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                                            {value === 0 ? 'No data' : value <= 3 ? 'Low' : value <= 6 ? 'Moderate' : 'High'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
};
