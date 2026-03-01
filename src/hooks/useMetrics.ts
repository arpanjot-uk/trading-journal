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

        // Add initial balance to growth chart
        if (trades.length > 0) {
            growthData.push({ date: 'Start', equity: balance, profit: 0 });
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

        const totalTrades = trades.length;
        const winRate = totalTrades ? (totalWon / totalTrades) * 100 : 0;
        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0);
        const avgWin = totalWon ? grossProfit / totalWon : 0;
        const avgLoss = totalLost ? grossLoss / totalLost : 0;
        const expectancy = (winRate / 100 * avgWin) - ((1 - winRate / 100) * avgLoss);

        const gain = ((balance - startingBalance) / startingBalance) * 100;

        return {
            loading: false,
            journal,
            stats: {
                totalTrades,
                totalWon,
                totalLost,
                winRate,
                profitFactor,
                avgWin,
                avgLoss,
                expectancy,
                totalLots,
                balance,
                startingBalance,
                gain,
                maxDrawdown,
                totalPnl,
                totalGrossPnl,
            },
            charts: {
                growthData,
                hourlyMap,
                dailyMap,
                durationData,
                pairsData: Array.from(pairsMap.entries()).map(([currency, data]) => ({ currency, ...data }))
            }
        };
    }, [journal, trades]);
};
