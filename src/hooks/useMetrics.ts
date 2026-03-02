import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, parseISO, getDay, getHours } from 'date-fns';
import { db } from '../db/db';

export const useMetrics = (journalId: number) => {
    const journal = useLiveQuery(() => db.journals.get(journalId), [journalId]);
    const trades = useLiveQuery(() => db.trades.where('journalId').equals(journalId).sortBy('openDate'), [journalId]);

    return useMemo(() => {
        if (!journal || !trades) return { loading: true, journal: null, stats: null, charts: null };

        const startingBalance = journal.startingBalance;
        let balance = startingBalance;
        let highestBalance = startingBalance;
        let maxDrawdown = 0;

        let totalWon = 0;
        let totalLost = 0;
        let totalPnl = 0;
        let totalGrossPnl = 0;
        let totalLots = 0;

        let grossProfit = 0;
        let grossLoss = 0;

        const pairsMap = new Map<string, { trades: number, pnl: number, hw: number, sw: number, hwTotal: number, swTotal: number, pips: number }>();

        // Chart Data Arrays
        const growthData: { date: string, equity: number, profit: number }[] = [];
        const hourlyMap = new Array(24).fill(0).map((_, h) => ({ hour: `${h}`, Winners: 0, Losers: 0 }));
        const dailyMap = new Array(7).fill(0).map((_, d) => ({ day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d], Winners: 0, Losers: 0 }));
        const durationData: { Duration: number, Growth: number, Result: string }[] = [];

        // Advanced Stats Variables
        let bestTrade = Number.NEGATIVE_INFINITY;
        let worstTrade = Number.POSITIVE_INFINITY;

        let currentConsecutiveWins = 0;
        let maxConsecutiveWins = 0;
        let currentConsecutiveLosses = 0;
        let maxConsecutiveLosses = 0;
        let maxConsecutiveProfit = 0; // Total profit during max win streak
        let maxConsecutiveLoss = 0; // Total loss during max loss streak
        let currentStreakProfit = 0;
        let currentStreakLoss = 0;

        let longTrades = 0;
        let shortTrades = 0;
        let longWon = 0;
        let shortWon = 0;

        let totalDuration = 0;

        // Add initial balance to growth chart
        if (trades.length > 0) {
            growthData.push({ date: 'Start', equity: balance, profit: 0 });
            bestTrade = trades[0].netPnl;
            worstTrade = trades[0].netPnl;
        } else {
            bestTrade = 0;
            worstTrade = 0;
        }

        trades.forEach((t) => {
            // Basic Stats
            balance += t.netPnl;
            totalPnl += t.netPnl;
            totalGrossPnl += t.pnl;
            totalLots += t.lots;

            // Drawdown calculation
            if (balance > highestBalance) highestBalance = balance;
            const currentDrawdown = ((highestBalance - balance) / highestBalance) * 100;
            if (currentDrawdown > maxDrawdown) maxDrawdown = currentDrawdown;

            if (t.result === 'Win') {
                totalWon++;
                grossProfit += t.netPnl;
            } else if (t.result === 'Loss') {
                totalLost++;
                grossLoss += Math.abs(t.netPnl);
            }

            // Advanced Metrics Logic
            if (t.netPnl > bestTrade) bestTrade = t.netPnl;
            if (t.netPnl < worstTrade) worstTrade = t.netPnl;
            totalDuration += t.duration;

            if (t.direction === 'Buy') {
                longTrades++;
                if (t.result === 'Win') longWon++;
            } else if (t.direction === 'Sell') {
                shortTrades++;
                if (t.result === 'Win') shortWon++;
            }

            // Streak Logic (must be sequential by date, assuming trades are sorted ascending)
            if (t.result === 'Win') {
                currentConsecutiveWins++;
                currentStreakProfit += t.netPnl;

                // Break loss streak
                if (currentConsecutiveLosses > maxConsecutiveLosses) {
                    maxConsecutiveLosses = currentConsecutiveLosses;
                    maxConsecutiveLoss = currentStreakLoss;
                }
                currentConsecutiveLosses = 0;
                currentStreakLoss = 0;

            } else if (t.result === 'Loss') {
                currentConsecutiveLosses++;
                currentStreakLoss += t.netPnl;

                // Break win streak
                if (currentConsecutiveWins > maxConsecutiveWins) {
                    maxConsecutiveWins = currentConsecutiveWins;
                    maxConsecutiveProfit = currentStreakProfit;
                }
                currentConsecutiveWins = 0;
                currentStreakProfit = 0;
            } else {
                // Break both streaks on break even
                if (currentConsecutiveWins > maxConsecutiveWins) {
                    maxConsecutiveWins = currentConsecutiveWins;
                    maxConsecutiveProfit = currentStreakProfit;
                }
                if (currentConsecutiveLosses > maxConsecutiveLosses) {
                    maxConsecutiveLosses = currentConsecutiveLosses;
                    maxConsecutiveLoss = currentStreakLoss;
                }
                currentConsecutiveWins = 0;
                currentStreakProfit = 0;
                currentConsecutiveLosses = 0;
                currentStreakLoss = 0;
            }

            // Pair Map
            if (!pairsMap.has(t.pair)) pairsMap.set(t.pair, { trades: 0, pnl: 0, hw: 0, sw: 0, hwTotal: 0, swTotal: 0, pips: 0 });
            const pData = pairsMap.get(t.pair)!;
            pData.trades++;
            pData.pnl += t.netPnl;
            if (t.direction === 'Buy') {
                pData.hwTotal++;
                if (t.result === 'Win') pData.hw++;
            } else {
                pData.swTotal++;
                if (t.result === 'Win') pData.sw++;
            }
            pData.pips += (t.result === 'Win' ? t.tp : -t.sl); // approximation

            // Date parsing for charts
            const d = parseISO(t.openDate);

            // Hourly Map
            const h = getHours(d);
            if (t.result === 'Win') hourlyMap[h].Winners++;
            else if (t.result === 'Loss') hourlyMap[h].Losers++;

            // Daily Map
            const day = getDay(d);
            if (t.result === 'Win') dailyMap[day].Winners++;
            else if (t.result === 'Loss') dailyMap[day].Losers++;

            // Duration Data (convert growth strictly relative to starting balance for simple metric)
            durationData.push({
                Duration: t.duration,
                Growth: +(t.netPnl / startingBalance).toFixed(4),
                Result: t.result
            });

            // Growth Data
            growthData.push({
                date: format(d, 'MMM dd'),
                equity: balance,
                profit: t.netPnl
            });
        });

        // Final Streak check
        if (currentConsecutiveWins > maxConsecutiveWins) {
            maxConsecutiveWins = currentConsecutiveWins;
            maxConsecutiveProfit = currentStreakProfit;
        }
        if (currentConsecutiveLosses > maxConsecutiveLosses) {
            maxConsecutiveLosses = currentConsecutiveLosses;
            maxConsecutiveLoss = currentStreakLoss;
        }

        const totalTrades = trades.length;
        const winRate = totalTrades ? (totalWon / totalTrades) * 100 : 0;
        const lossRate = totalTrades ? (totalLost / totalTrades) * 100 : 0;
        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0);
        const avgWin = totalWon ? grossProfit / totalWon : 0;
        const avgLoss = totalLost ? grossLoss / totalLost : 0;
        const expectancy = (winRate / 100 * avgWin) - ((1 - winRate / 100) * avgLoss);
        const avgDuration = totalTrades ? totalDuration / totalTrades : 0;

        const gain = ((balance - startingBalance) / startingBalance) * 100;

        // Compute Scores for Radar Chart (0-100 scale)
        const scoreWinPct = winRate;
        const scoreProfitFactor = Math.min(100, (profitFactor / 3) * 100);
        const scoreAvgWinLoss = Math.min(100, ((avgWin / (avgLoss || 1)) / 3) * 100);
        const scoreRecoveryFactor = Math.min(100, (totalPnl > 0 && maxDrawdown > 0 ? (gain / maxDrawdown) * 20 : totalPnl > 0 ? 100 : 0));
        const scoreMaxDrawdown = Math.max(0, 100 - (maxDrawdown * 4)); // 25% drawdown = 0 score
        const scoreConsistency = Math.max(0, 100 - (maxConsecutiveLosses * 5));

        const scoreOverview = (scoreWinPct + scoreProfitFactor + scoreAvgWinLoss + scoreRecoveryFactor + scoreMaxDrawdown + scoreConsistency) / 6;

        const scoreData = [
            { subject: 'Win %', A: scoreWinPct },
            { subject: 'Profit factor', A: scoreProfitFactor },
            { subject: 'Avg win/loss', A: scoreAvgWinLoss },
            { subject: 'Recovery factor', A: scoreRecoveryFactor },
            { subject: 'Max drawdown', A: scoreMaxDrawdown },
            { subject: 'Consistency', A: scoreConsistency },
        ];

        return {
            loading: false,
            journal,
            stats: {
                totalTrades,
                totalWon,
                totalLost,
                winRate,
                lossRate,
                profitFactor,
                avgWin,
                avgLoss,
                expectancy,
                avgDuration,
                totalLots,
                balance,
                startingBalance,
                gain,
                maxDrawdown,
                totalPnl,
                totalGrossPnl,
                grossProfit,
                grossLoss,
                bestTrade,
                worstTrade,
                maxConsecutiveWins,
                maxConsecutiveLosses,
                maxConsecutiveProfit,
                maxConsecutiveLoss,
                longTrades,
                shortTrades,
                longWon,
                shortWon,
                scoreOverview
            },
            charts: {
                growthData,
                hourlyMap,
                dailyMap,
                durationData,
                pairsData: Array.from(pairsMap.entries()).map(([currency, data]) => ({ currency, ...data })),
                scoreData
            }
        };
    }, [journal, trades]);
};
