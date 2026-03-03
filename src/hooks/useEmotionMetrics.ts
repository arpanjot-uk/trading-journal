import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, parseISO, startOfWeek } from 'date-fns';
import { db } from '../db/db';

export interface MoodPerfPoint {
    date: string;
    moodScore: number;
    dayPnl: number;
    energyLevel: number;
    stressLevel: number;
}

export interface EmotionTraitPoint {
    trait: string;
    Win: number;
    Loss: number;
    'Break Even': number;
}

export interface LifestyleStatRow {
    label: string;
    category: string;
    winRate: number;
    trades: number;
}

export interface WeeklyPoint {
    weekLabel: string;
    avgMood: number;
    netPnl: number;
}

export interface CalendarDay {
    date: string; // YYYY-MM-DD
    dayOfMonth: number;
    hasMoodLog: boolean;
    moodScore: number | null;
    hadTrades: boolean;
    dayPnl: number;
    isMissedLog: boolean; // had trades but no mood log
    isCurrentMonth: boolean;
}

export interface WeeklyCalendarRow {
    days: CalendarDay[];
    weekPnl: number;
    avgMood: number | null;
}

export interface EmotionKPIs {
    avgMood: number;
    logRate: number; // % of trade days with a mood log
    avgPnlGoodMood: number; // mood >= 4
    avgPnlBadMood: number;  // mood <= 2
    totalDaysLogged: number;
    totalTradingDays: number;
    avgEmotionFomo: number;
    avgEmotionPatience: number;
    avgEmotionDiscipline: number;
    avgEmotionConfidence: number;
}

export const useEmotionMetrics = (journalId: number, calendarYear: number, calendarMonth: number) => {
    const trades = useLiveQuery(
        () => db.trades.where('journalId').equals(journalId).sortBy('openDate'),
        [journalId]
    );
    const moods = useLiveQuery(
        () => db.dailyMoods.where('journalId').equals(journalId).toArray(),
        [journalId]
    );

    return useMemo(() => {
        if (!trades || !moods) return { loading: true };

        // --- Index moods by date ---
        const moodByDate = new Map<string, { moodScore: number; energyLevel: number; stressLevel: number; sleepHours: number; dietScore: string; caffeineIntake: string; exercised: boolean }>();
        moods.forEach(m => moodByDate.set(m.date, m));

        // --- Group trades by date ---
        const tradesByDate = new Map<string, { pnl: number; count: number; wins: number; fomoSum: number; patienceSum: number; disciplineSum: number; confidenceSum: number; emotionCount: number }>();
        let totalFomo = 0, totalPatience = 0, totalDiscipline = 0, totalConfidence = 0, emotionCount = 0;

        trades.forEach(t => {
            const dateKey = t.openDate.slice(0, 10);
            if (!tradesByDate.has(dateKey)) {
                tradesByDate.set(dateKey, { pnl: 0, count: 0, wins: 0, fomoSum: 0, patienceSum: 0, disciplineSum: 0, confidenceSum: 0, emotionCount: 0 });
            }
            const td = tradesByDate.get(dateKey)!;
            td.pnl += t.netPnl;
            td.count++;
            if (t.result === 'Win') td.wins++;

            const e = t.notes?.emotion;
            if (e && (e.fomo !== undefined || e.patience !== undefined || e.discipline !== undefined || e.confidence !== undefined)) {
                const fomo = e.fomo ?? 0;
                const patience = e.patience ?? 0;
                const discipline = e.discipline ?? 0;
                const confidence = e.confidence ?? 0;
                td.fomoSum += fomo;
                td.patienceSum += patience;
                td.disciplineSum += discipline;
                td.confidenceSum += confidence;
                td.emotionCount++;
                totalFomo += fomo;
                totalPatience += patience;
                totalDiscipline += discipline;
                totalConfidence += confidence;
                emotionCount++;
            }
        });

        // --- Mood vs PnL scatter data ---
        const moodPerfData: MoodPerfPoint[] = [];
        moodByDate.forEach((mood, date) => {
            const td = tradesByDate.get(date);
            if (td) {
                moodPerfData.push({
                    date,
                    moodScore: mood.moodScore,
                    dayPnl: td.pnl,
                    energyLevel: mood.energyLevel,
                    stressLevel: mood.stressLevel,
                });
            }
        });
        moodPerfData.sort((a, b) => a.date.localeCompare(b.date));

        // --- Emotion traits grouped by trade result ---
        const traitsByResult = {
            Win: { fomo: 0, patience: 0, discipline: 0, confidence: 0, count: 0 },
            Loss: { fomo: 0, patience: 0, discipline: 0, confidence: 0, count: 0 },
            'Break Even': { fomo: 0, patience: 0, discipline: 0, confidence: 0, count: 0 },
        };
        trades.forEach(t => {
            const e = t.notes?.emotion;
            if (!e) return;
            const r = t.result as 'Win' | 'Loss' | 'Break Even';
            const bucket = traitsByResult[r];
            if (!bucket) return;
            if (e.fomo !== undefined) { bucket.fomo += e.fomo; bucket.count++; }
            if (e.patience !== undefined) bucket.patience += e.patience;
            if (e.discipline !== undefined) bucket.discipline += e.discipline;
            if (e.confidence !== undefined) bucket.confidence += e.confidence;
        });

        const avg = (sum: number, count: number) => count > 0 ? +(sum / count).toFixed(2) : 0;

        const emotionTraitData: EmotionTraitPoint[] = ['FOMO', 'Patience', 'Discipline', 'Confidence'].map(trait => {
            const key = trait.toLowerCase() as 'fomo' | 'patience' | 'discipline' | 'confidence';
            return {
                trait,
                Win: avg(traitsByResult.Win[key], traitsByResult.Win.count),
                Loss: avg(traitsByResult.Loss[key], traitsByResult.Loss.count),
                'Break Even': avg(traitsByResult['Break Even'][key], traitsByResult['Break Even'].count),
            };
        });

        // --- Lifestyle stats ---
        const lifestyleStats: LifestyleStatRow[] = [];

        const buildLifestyleStat = (
            label: string,
            category: string,
            filterFn: (m: ReturnType<typeof moodByDate.get>) => boolean
        ) => {
            let wins = 0, total = 0;
            moodByDate.forEach((mood, date) => {
                const td = tradesByDate.get(date);
                if (!td) return;
                if (filterFn(mood)) {
                    total += td.count;
                    wins += td.wins;
                }
            });
            lifestyleStats.push({
                label,
                category,
                winRate: total > 0 ? +(wins / total * 100).toFixed(1) : 0,
                trades: total
            });
        };

        buildLifestyleStat('Exercised', 'exercise', m => !!m?.exercised);
        buildLifestyleStat('No Exercise', 'exercise', m => !m?.exercised);
        buildLifestyleStat('Clean Diet', 'diet', m => m?.dietScore === 'Clean');
        buildLifestyleStat('Junk Food', 'diet', m => m?.dietScore === 'Heavy Junk' || m?.dietScore === 'Moderate Junk');
        buildLifestyleStat('>7h Sleep', 'sleep', m => (m?.sleepHours ?? 0) >= 7);
        buildLifestyleStat('<7h Sleep', 'sleep', m => (m?.sleepHours ?? 0) < 7);
        buildLifestyleStat('Low Stress (≤40)', 'stress', m => (m?.stressLevel ?? 50) <= 40);
        buildLifestyleStat('High Stress (>60)', 'stress', m => (m?.stressLevel ?? 50) > 60);

        // --- Weekly trend data ---
        const weeklyMap = new Map<string, { moodSum: number; moodCount: number; pnl: number; weekStart: string }>();
        moodByDate.forEach((mood, date) => {
            const parsed = parseISO(date);
            const ws = format(startOfWeek(parsed, { weekStartsOn: 1 }), 'yyyy-MM-dd');
            if (!weeklyMap.has(ws)) weeklyMap.set(ws, { moodSum: 0, moodCount: 0, pnl: 0, weekStart: ws });
            const w = weeklyMap.get(ws)!;
            w.moodSum += mood.moodScore;
            w.moodCount++;
        });
        tradesByDate.forEach((td, date) => {
            const parsed = parseISO(date);
            const ws = format(startOfWeek(parsed, { weekStartsOn: 1 }), 'yyyy-MM-dd');
            if (!weeklyMap.has(ws)) weeklyMap.set(ws, { moodSum: 0, moodCount: 0, pnl: 0, weekStart: ws });
            weeklyMap.get(ws)!.pnl += td.pnl;
        });

        const weeklyTrendData: WeeklyPoint[] = Array.from(weeklyMap.values())
            .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
            .map(w => ({
                weekLabel: format(parseISO(w.weekStart), 'MMM d'),
                avgMood: w.moodCount > 0 ? +(w.moodSum / w.moodCount).toFixed(2) : 0,
                netPnl: +w.pnl.toFixed(2)
            }));

        // --- Calendar data for selected month ---
        const firstDay = new Date(calendarYear, calendarMonth, 1);
        const lastDay = new Date(calendarYear, calendarMonth + 1, 0);

        // Pad start: weekday of first day (0=Sun)
        const startPad = (firstDay.getDay() + 6) % 7; // Mon-start
        const calDays: CalendarDay[] = [];

        // Previous month padding
        for (let i = startPad - 1; i >= 0; i--) {
            const d = new Date(calendarYear, calendarMonth, -i);
            const dateStr = format(d, 'yyyy-MM-dd');
            calDays.push({
                date: dateStr, dayOfMonth: d.getDate(), hasMoodLog: false, moodScore: null,
                hadTrades: false, dayPnl: 0, isMissedLog: false, isCurrentMonth: false
            });
        }

        // Current month days
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const d = new Date(calendarYear, calendarMonth, day);
            const dateStr = format(d, 'yyyy-MM-dd');
            const mood = moodByDate.get(dateStr);
            const td = tradesByDate.get(dateStr);
            calDays.push({
                date: dateStr,
                dayOfMonth: day,
                hasMoodLog: !!mood,
                moodScore: mood ? mood.moodScore : null,
                hadTrades: !!td,
                dayPnl: td ? td.pnl : 0,
                isMissedLog: !!td && !mood,
                isCurrentMonth: true
            });
        }

        // Next month padding to complete 6 rows
        const endPad = 42 - calDays.length;
        for (let i = 1; i <= endPad; i++) {
            const d = new Date(calendarYear, calendarMonth + 1, i);
            const dateStr = format(d, 'yyyy-MM-dd');
            calDays.push({
                date: dateStr, dayOfMonth: i, hasMoodLog: false, moodScore: null,
                hadTrades: false, dayPnl: 0, isMissedLog: false, isCurrentMonth: false
            });
        }

        // Build weekly rows
        const calendarWeeks: WeeklyCalendarRow[] = [];
        for (let w = 0; w < 6; w++) {
            const days = calDays.slice(w * 7, w * 7 + 7);
            const currentDays = days.filter(d => d.isCurrentMonth);
            const weekPnl = currentDays.reduce((sum, d) => sum + d.dayPnl, 0);
            const moodDays = currentDays.filter(d => d.moodScore !== null);
            const avgMood = moodDays.length > 0 ? moodDays.reduce((s, d) => s + (d.moodScore ?? 0), 0) / moodDays.length : null;
            calendarWeeks.push({ days, weekPnl, avgMood });
        }

        // --- KPIs ---
        const tradingDates = Array.from(tradesByDate.keys());
        const loggedTradingDays = tradingDates.filter(d => moodByDate.has(d)).length;

        let goodMoodPnl = 0, goodMoodDays = 0, badMoodPnl = 0, badMoodDays = 0;
        moodByDate.forEach((mood, date) => {
            const td = tradesByDate.get(date);
            if (!td) return;
            if (mood.moodScore >= 4) { goodMoodPnl += td.pnl; goodMoodDays++; }
            if (mood.moodScore <= 2) { badMoodPnl += td.pnl; badMoodDays++; }
        });

        const totalMoodSum = Array.from(moodByDate.values()).reduce((s, m) => s + m.moodScore, 0);
        const avgMoodOverall = moodByDate.size > 0 ? totalMoodSum / moodByDate.size : 0;

        const kpis: EmotionKPIs = {
            avgMood: +avgMoodOverall.toFixed(2),
            logRate: tradingDates.length > 0 ? +(loggedTradingDays / tradingDates.length * 100).toFixed(1) : 0,
            avgPnlGoodMood: goodMoodDays > 0 ? +(goodMoodPnl / goodMoodDays).toFixed(2) : 0,
            avgPnlBadMood: badMoodDays > 0 ? +(badMoodPnl / badMoodDays).toFixed(2) : 0,
            totalDaysLogged: moodByDate.size,
            totalTradingDays: tradingDates.length,
            avgEmotionFomo: avg(totalFomo, emotionCount),
            avgEmotionPatience: avg(totalPatience, emotionCount),
            avgEmotionDiscipline: avg(totalDiscipline, emotionCount),
            avgEmotionConfidence: avg(totalConfidence, emotionCount),
        };

        return {
            loading: false,
            kpis,
            moodPerfData,
            emotionTraitData,
            lifestyleStats,
            weeklyTrendData,
            calendarWeeks,
        };
    }, [trades, moods, calendarYear, calendarMonth]);
};
