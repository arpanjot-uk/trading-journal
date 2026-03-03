import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Target, TrendingUp, DollarSign } from 'lucide-react';

export const PropFirmCalculator: React.FC = () => {
    const [winRate, setWinRate] = useState<string>('50');
    const [rrRatio, setRrRatio] = useState<string>('1.5');
    const [fee, setFee] = useState<string>('500');
    const [profitTarget, setProfitTarget] = useState<string>('8');
    const [maxDrawdown, setMaxDrawdown] = useState<string>('10');
    const [riskPerTrade, setRiskPerTrade] = useState<string>('1');

    const result = useMemo(() => {
        const wr = parseFloat(winRate) / 100;
        const rr = parseFloat(rrRatio);
        const f = parseFloat(fee);
        const targetPct = parseFloat(profitTarget);
        const ddPct = parseFloat(maxDrawdown);
        const riskPct = parseFloat(riskPerTrade);

        if ([wr, rr, f, targetPct, ddPct, riskPct].some(isNaN) || riskPct <= 0 || wr <= 0 || wr >= 1 || targetPct <= 0 || ddPct <= 0) {
            return null;
        }

        const SIMULATIONS = 1500;
        const MAX_TRADES = 200; // Cap a challenge at 200 trades
        let passes = 0;
        let totalTradesInPasses = 0;

        for (let i = 0; i < SIMULATIONS; i++) {
            let balance = 100; // start at 100%
            let peakEquity = 100;
            const targetBalance = 100 + targetPct;
            let trades = 0;

            while (trades < MAX_TRADES) {
                trades++;
                const isWin = Math.random() < wr;

                if (isWin) {
                    balance += riskPct * rr;
                } else {
                    balance -= riskPct;
                }

                if (balance > peakEquity) peakEquity = balance;

                // Simple simulated Initial Drawdown logic
                if (balance <= 100 - ddPct) {
                    break; // Failed due to drawdown
                }

                if (balance >= targetBalance) {
                    passes++;
                    totalTradesInPasses += trades;
                    break;
                }
            }
        }

        const passRate = passes / SIMULATIONS;
        const avgTradesToPass = passes > 0 ? Math.round(totalTradesInPasses / passes) : 0;
        const expectedCost = passRate > 0 ? f / passRate : Number.POSITIVE_INFINITY;
        const attemptsToPass = passRate > 0 ? Math.ceil(1 / passRate) : Number.POSITIVE_INFINITY;

        return {
            passRate: passRate * 100,
            avgTradesToPass,
            expectedCost,
            attemptsToPass,
        };

    }, [winRate, rrRatio, fee, profitTarget, maxDrawdown, riskPerTrade]);

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <Card style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                        <Target size={20} className="text-secondary" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Prop Firm Simulator</h2>
                        <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>Monte Carlo simulation to estimate your probability of passing a challenge.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <Input label="Win Rate (%)" type="number" value={winRate} onChange={e => setWinRate(e.target.value)} placeholder="50" />
                    <Input label="Risk/Reward Ratio (1:X)" type="number" value={rrRatio} onChange={e => setRrRatio(e.target.value)} placeholder="1.5" step="0.1" />
                    <Input label="Challenge Fee ($)" type="number" value={fee} onChange={e => setFee(e.target.value)} placeholder="500" />
                    <Input label="Profit Target (%)" type="number" value={profitTarget} onChange={e => setProfitTarget(e.target.value)} placeholder="8" />
                    <Input label="Max Drawdown (%)" type="number" value={maxDrawdown} onChange={e => setMaxDrawdown(e.target.value)} placeholder="10" />
                    <Input label="Risk per Trade (%)" type="number" value={riskPerTrade} onChange={e => setRiskPerTrade(e.target.value)} placeholder="1" step="0.1" />
                </div>

                {result ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>

                        <div style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                            <span className="text-secondary" style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.75rem' }}>Statstical Pass Rate</span>
                            <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="100" height="100" viewBox="0 0 100 100" style={{ position: 'absolute', top: 0, left: 0 }}>
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--bg-secondary)" strokeWidth="8" />
                                    <circle cx="50" cy="50" r="45" fill="none"
                                        stroke={result.passRate > 50 ? 'var(--win-color)' : result.passRate > 20 ? '#EAB308' : 'var(--loss-color)'}
                                        strokeWidth="8"
                                        strokeDasharray={`${(result.passRate / 100) * 282.7} 282.7`}
                                        strokeDashoffset="0" transform="rotate(-90 50 50)" strokeLinecap="round" />
                                </svg>
                                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                    {result.passRate >= 99.5 ? '>99' : result.passRate < 0.5 ? '<1' : result.passRate.toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <DollarSign size={16} className="text-accent" />
                                <span className="text-secondary" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Expected Real Cost</span>
                            </div>
                            <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {result.expectedCost === Number.POSITIVE_INFINITY ? 'Infinite' : `$${result.expectedCost.toFixed(0)}`}
                            </span>
                            <span className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                Based on {result.attemptsToPass === Number.POSITIVE_INFINITY ? 'endless' : result.attemptsToPass} expected attempts
                            </span>
                        </div>

                        <div style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <TrendingUp size={16} className="text-secondary" />
                                <span className="text-secondary" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Trades to Pass</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                <span style={{ fontSize: '2rem', fontWeight: 700 }}>{result.avgTradesToPass}</span>
                                <span className="text-muted" style={{ fontSize: '0.85rem' }}>avg trades</span>
                            </div>
                            <span className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                For successful challenge attempts only
                            </span>
                        </div>

                    </div>
                ) : (
                    <div style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Enter valid numbers above to see the simulation results.
                    </div>
                )}
            </Card>
        </div>
    );
};
