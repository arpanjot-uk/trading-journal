import React, { useState, useMemo } from 'react';
import {
    startOfMonth, endOfMonth, eachDayOfInterval, format,
    startOfWeek, endOfWeek, isSameMonth, isToday, addMonths, subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Trade } from '../db/db';
import { Card } from './ui/Card';

interface CalendarViewProps {
    trades: Trade[];
}

interface DailyStats {
    date: Date;
    trades: Trade[];
    netPnl: number;
    winCount: number;
    lossCount: number;
    beCount: number;
}

const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};

export const CalendarView: React.FC<CalendarViewProps> = ({ trades }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const startDate = startOfWeek(startOfMonth(currentDate));
    const endDate = endOfWeek(endOfMonth(currentDate));

    const daysInGrid = eachDayOfInterval({ start: startDate, end: endDate });

    // Precompute a map of date string (yyyy-MM-dd) to DailyStats
    const dailyStatsMap = useMemo(() => {
        const map = new Map<string, DailyStats>();

        trades.forEach(trade => {
            const dateStr = trade.openDate.split('T')[0];
            if (!map.has(dateStr)) {
                map.set(dateStr, {
                    date: new Date(dateStr),
                    trades: [],
                    netPnl: 0,
                    winCount: 0,
                    lossCount: 0,
                    beCount: 0
                });
            }

            const stats = map.get(dateStr)!;
            stats.trades.push(trade);
            stats.netPnl += trade.netPnl;

            if (trade.result === 'Win') stats.winCount++;
            else if (trade.result === 'Loss') stats.lossCount++;
            else stats.beCount++;
        });

        return map;
    }, [trades]);

    // Calculate weekly summary stats
    const weeklySummary = useMemo(() => {
        const weeks: { startTitle: string, pnl: number, daysActive: number, days: Date[] }[] = [];

        for (let i = 0; i < daysInGrid.length; i += 7) {
            const weekDays = daysInGrid.slice(i, i + 7);

            let weekPnl = 0;
            let activeDays = 0;

            weekDays.forEach(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const stats = dailyStatsMap.get(dateKey);
                if (stats && stats.trades.length > 0) {
                    weekPnl += stats.netPnl;
                    activeDays++;
                }
            });

            weeks.push({
                startTitle: `Week ${weeks.length + 1}`,
                pnl: weekPnl,
                daysActive: activeDays,
                days: weekDays
            });
        }
        return weeks;
    }, [daysInGrid, dailyStatsMap]);


    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const totalMonthPnl = useMemo(() => {
        let total = 0;
        daysInGrid.forEach(day => {
            if (isSameMonth(day, currentDate)) {
                const dateKey = format(day, 'yyyy-MM-dd');
                const stats = dailyStatsMap.get(dateKey);
                if (stats) total += stats.netPnl;
            }
        });
        return total;
    }, [daysInGrid, currentDate, dailyStatsMap]);

    const activeDaysInMonth = useMemo(() => {
        let days = 0;
        daysInGrid.forEach(day => {
            if (isSameMonth(day, currentDate)) {
                const dateKey = format(day, 'yyyy-MM-dd');
                const stats = dailyStatsMap.get(dateKey);
                if (stats && stats.trades.length > 0) days++;
            }
        });
        return days;
    }, [daysInGrid, currentDate, dailyStatsMap]);


    return (
        <div className="calendar-layout">
            <Card style={{ padding: '1.5rem', overflowX: 'auto' }}>
                {/* Header Controls */}
                <div className="flex-between" style={{ marginBottom: '1.5rem', minWidth: '800px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={prevMonth} className="glass-card flex-center" style={{ width: 36, height: 36 }}>
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={nextMonth} className="glass-card flex-center" style={{ width: 36, height: 36 }}>
                            <ChevronRight size={20} />
                        </button>
                        <h2 style={{ minWidth: '150px', marginLeft: '0.5rem' }}>{format(currentDate, 'MMMM yyyy')}</h2>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                            <span className="text-secondary" style={{ fontSize: '0.9rem', marginRight: '0.5rem' }}>Monthly Stats:</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: totalMonthPnl > 0 ? 'var(--win-color)' : totalMonthPnl < 0 ? 'var(--loss-color)' : 'var(--text-primary)' }}>
                                {totalMonthPnl > 0 ? '+' : ''}{formatMoney(totalMonthPnl)}
                            </span>
                        </div>
                        <div className="text-secondary" style={{ fontSize: '0.9rem' }}>
                            {activeDaysInMonth} active days
                        </div>
                    </div>
                </div>

                {/* Calendar Grid Header (Mon, Tue, Wed...) */}
                <div className="calendar-header" style={{ minWidth: '800px' }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d}>{d}</div>
                    ))}
                    <div style={{ color: 'var(--text-primary)', textAlign: 'center' }}>Weekly Digest</div>
                </div>

                {/* Calendar Grid Body */}
                <div className="calendar-grid" style={{ minWidth: '800px' }}>
                    {weeklySummary.map((week) => (
                        <React.Fragment key={week.startTitle}>
                            {week.days.map(day => {
                                const dateKey = format(day, 'yyyy-MM-dd');
                                const stats = dailyStatsMap.get(dateKey);
                                const isCurrentMonth = isSameMonth(day, currentDate);
                                const isTodayDate = isToday(day);

                                let cellClass = 'calendar-cell';
                                if (!isCurrentMonth) cellClass += ' empty text-muted';
                                else if (stats && stats.trades.length > 0) {
                                    if (stats.netPnl > 0) cellClass += ' win-day';
                                    else if (stats.netPnl < 0) cellClass += ' loss-day';
                                    else cellClass += ' neutral-day';
                                }

                                if (isTodayDate) cellClass += ' active';

                                return (
                                    <div key={dateKey} className={cellClass} style={{ opacity: isCurrentMonth ? 1 : 0.4 }}>
                                        <div style={{ textAlign: 'right', fontWeight: isTodayDate ? 700 : 400, color: isTodayDate ? 'var(--accent-primary)' : 'inherit', marginBottom: '0.5rem' }}>
                                            {format(day, 'd')}
                                        </div>

                                        {stats && stats.trades.length > 0 && isCurrentMonth && (
                                            <div style={{ marginTop: 'auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: stats.netPnl > 0 ? 'var(--win-color)' : stats.netPnl < 0 ? 'var(--loss-color)' : 'inherit' }}>
                                                    {formatMoney(stats.netPnl)}
                                                </div>
                                                <div className="text-secondary" style={{ fontSize: '0.8rem' }}>
                                                    {stats.trades.length} {stats.trades.length === 1 ? 'trade' : 'trades'}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {((stats.winCount / stats.trades.length) * 100).toFixed(1)}% Win
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Weekly Digest Cell for this row */}
                            <div className="calendar-cell" style={{ background: 'var(--bg-secondary)', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }}>
                                <div className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}>{week.startTitle}</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: week.pnl > 0 ? 'var(--win-color)' : week.pnl < 0 ? 'var(--loss-color)' : 'var(--text-primary)' }}>
                                    {week.pnl > 0 ? '+' : ''}{formatMoney(week.pnl)}
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                                    {week.daysActive} {week.daysActive === 1 ? 'day' : 'days'} active
                                </div>
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </Card>
        </div>
    );
};
