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

        let grossProfit = 0;  // sum of netPnl on wins (for win avg)
        let grossLoss = 0;    // sum of abs(t.pnl) on losses — true gross loss
        let netLoss = 0;      // sum of abs(t.netPnl) on losses — for expectancy

        const pairsMap = new Map<string, { trades: number, pnl: number, hw: number, sw: number, hwTotal: number, swTotal: number, pips: number }>();
        const strategiesMap = new Map<string, { trades: number, pnl: number, won: number, grossProfit: number, netLoss: number, rrSum: number }>();

        // Aggregate equity by calendar day (prevents per-trade noise in growth chart)
        const dailyEquityMap = new Map<string, { date: string, rawDate: string, equity: number, profit: number }>();
        const hourlyMap = new Array(24).fill(0).map((_, h) => ({ hour: `${h}:00`, Winners: 0, Losers: 0 }));
        const dailyMap = new Array(7).fill(0).map((_, d) => ({ day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d], Winners: 0, Losers: 0 }));
        const durationData: { Duration: number, Growth: number, Result: string }[] = [];

        // Advanced Stats Variables
        let bestTrade = Number.NEGATIVE_INFINITY;
        let worstTrade = Number.POSITIVE_INFINITY;

        let currentConsecutiveWins = 0;
        let maxConsecutiveWins = 0;
        let currentConsecutiveLosses = 0;
        let maxConsecutiveLosses = 0;
        let maxConsecutiveProfit = 0;
        let maxConsecutiveLoss = 0;
        let currentStreakProfit = 0;
        let currentStreakLoss = 0;

        let longTrades = 0;
        let shortTrades = 0;
        let longWon = 0;
        let shortWon = 0;

        let totalDuration = 0;

        if (trades.length === 0) {
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
                // Use gross pnl for grossProfit so Profit Factor = gross/gross
                grossProfit += t.pnl > 0 ? t.pnl : t.netPnl;
            } else if (t.result === 'Loss') {
                totalLost++;
                // Use gross pnl (absolute) when available, fall back to netPnl
                grossLoss += t.pnl < 0 ? Math.abs(t.pnl) : Math.abs(t.netPnl);
                netLoss += Math.abs(t.netPnl);
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

            // Streak Logic (trades sorted ascending by openDate)
            if (t.result === 'Win') {
                currentConsecutiveWins++;
                currentStreakProfit += t.netPnl;
                if (currentConsecutiveLosses > maxConsecutiveLosses) {
                    maxConsecutiveLosses = currentConsecutiveLosses;
                    maxConsecutiveLoss = Math.abs(currentStreakLoss);
                }
                currentConsecutiveLosses = 0;
                currentStreakLoss = 0;
            } else if (t.result === 'Loss') {
                currentConsecutiveLosses++;
                currentStreakLoss += t.netPnl;
                if (currentConsecutiveWins > maxConsecutiveWins) {
                    maxConsecutiveWins = currentConsecutiveWins;
                    maxConsecutiveProfit = currentStreakProfit;
                }
                currentConsecutiveWins = 0;
                currentStreakProfit = 0;
            } else {
                // Break Even — resets both streaks
                if (currentConsecutiveWins > maxConsecutiveWins) {
                    maxConsecutiveWins = currentConsecutiveWins;
                    maxConsecutiveProfit = currentStreakProfit;
                }
                if (currentConsecutiveLosses > maxConsecutiveLosses) {
                    maxConsecutiveLosses = currentConsecutiveLosses;
                    maxConsecutiveLoss = Math.abs(currentStreakLoss);
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
            pData.pips += (t.result === 'Win' ? t.tp : -t.sl);

            // Strategy Map (new — per-strategy breakdown)
            if (!strategiesMap.has(t.strategy)) strategiesMap.set(t.strategy, { trades: 0, pnl: 0, won: 0, grossProfit: 0, netLoss: 0, rrSum: 0 });
            const sData = strategiesMap.get(t.strategy)!;
            sData.trades++;
            sData.pnl += t.netPnl;
            sData.rrSum += t.rr;
            if (t.result === 'Win') { sData.won++; sData.grossProfit += t.pnl > 0 ? t.pnl : t.netPnl; }
            if (t.result === 'Loss') sData.netLoss += Math.abs(t.netPnl);

            // Date parsing for charts
            const d = parseISO(t.openDate);
            const dateKey = format(d, 'MMM dd');

            // Aggregate equity by day — only store the final equity for each day
            const existing = dailyEquityMap.get(dateKey);
            if (existing) {
                existing.equity = balance;
                existing.profit += t.netPnl;
            } else {
                dailyEquityMap.set(dateKey, { date: dateKey, rawDate: format(d, 'yyyy-MM-dd'), equity: balance, profit: t.netPnl });
            }

            // Hourly Map
            const h = getHours(d);
            if (t.result === 'Win') hourlyMap[h].Winners++;
            else if (t.result === 'Loss') hourlyMap[h].Losers++;

            // Daily Map
            const day = getDay(d);
            if (t.result === 'Win') dailyMap[day].Winners++;
            else if (t.result === 'Loss') dailyMap[day].Losers++;

            // Duration Data
            durationData.push({
                Duration: t.duration,
                Growth: +(t.netPnl / startingBalance).toFixed(4),
                Result: t.result
            });
        });

        // Final Streak check
        if (currentConsecutiveWins > maxConsecutiveWins) {
            maxConsecutiveWins = currentConsecutiveWins;
            maxConsecutiveProfit = currentStreakProfit;
        }
        if (currentConsecutiveLosses > maxConsecutiveLosses) {
            maxConsecutiveLosses = currentConsecutiveLosses;
            maxConsecutiveLoss = Math.abs(currentStreakLoss);
        }

        const totalTrades = trades.length;
        const winRate = totalTrades ? (totalWon / totalTrades) * 100 : 0;
        const lossRate = totalTrades ? (totalLost / totalTrades) * 100 : 0;
        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0);
        const avgWin = totalWon ? grossProfit / totalWon : 0;
        const avgLoss = totalLost ? netLoss / totalLost : 0;
        const expectancy = (winRate / 100 * avgWin) - ((1 - winRate / 100) * avgLoss);
        const avgDuration = totalTrades ? totalDuration / totalTrades : 0;

        const gain = ((balance - startingBalance) / startingBalance) * 100;
        const hasEnoughData = totalTrades >= 10;

        // Compute Scores for Radar Chart (0-100 scale)
        const scoreWinPct = winRate;
        const scoreProfitFactor = Math.min(100, (profitFactor / 3) * 100);
        const scoreAvgWinLoss = Math.min(100, ((avgWin / (avgLoss || 1)) / 3) * 100);
        const scoreRecoveryFactor = Math.min(100, (totalPnl > 0 && maxDrawdown > 0 ? (gain / maxDrawdown) * 20 : totalPnl > 0 ? 100 : 0));
        const scoreMaxDrawdown = Math.max(0, 100 - (maxDrawdown * 4));
        const scoreConsistency = Math.max(0, 100 - (maxConsecutiveLosses * 5));

        const scoreOverview = (scoreWinPct + scoreProfitFactor + scoreAvgWinLoss + scoreRecoveryFactor + scoreMaxDrawdown + scoreConsistency) / 6;

        const scoreData = [
            { subject: 'Win %', A: scoreWinPct, description: 'Percentage of winning trades' },
            { subject: 'Profit factor', A: scoreProfitFactor, description: 'Gross profit ÷ gross loss (capped at 3.0 → 100%)' },
            { subject: 'Avg win/loss', A: scoreAvgWinLoss, description: 'Average win ÷ average loss (capped at 3× → 100%)' },
            { subject: 'Recovery', A: scoreRecoveryFactor, description: 'Account gain% normalised against max drawdown' },
            { subject: 'Drawdown', A: scoreMaxDrawdown, description: 'Max drawdown penalty: 25%+ drawdown = score 0' },
            { subject: 'Consistency', A: scoreConsistency, description: 'Loss streak penalty: 5 pts per streak trade' },
        ];

        // Build growth data from aggregated daily map
        const growthData: { date: string, rawDate: string, equity: number, profit: number }[] = [];
        if (trades.length > 0) growthData.push({ date: 'Start', rawDate: trades[0].openDate.slice(0, 10), equity: startingBalance, profit: 0 });
        growthData.push(...Array.from(dailyEquityMap.values()));

        // Strategy performance data
        const strategiesData = Array.from(strategiesMap.entries()).map(([name, data]) => ({
            name,
            trades: data.trades,
            winRate: data.trades > 0 ? +((data.won / data.trades) * 100).toFixed(1) : 0,
            pnl: +data.pnl.toFixed(2),
            profitFactor: data.netLoss > 0 ? +(data.grossProfit / data.netLoss).toFixed(2) : (data.grossProfit > 0 ? 999 : 0),
            avgRr: data.trades > 0 ? +(data.rrSum / data.trades).toFixed(2) : 0,
        }));

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
                netLoss,
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
                scoreOverview,
                hasEnoughData,
            },
            charts: {
                growthData,
                hourlyMap,
                dailyMap,
                durationData,
                pairsData: Array.from(pairsMap.entries()).map(([currency, data]) => ({ currency, ...data })),
                scoreData,
                strategiesData,
            }
        };
    }, [journal, trades]);
};
