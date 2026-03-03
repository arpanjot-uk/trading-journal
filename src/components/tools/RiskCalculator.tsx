import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { ShieldAlert, AlertTriangle, Info } from 'lucide-react';

export const RiskCalculator: React.FC = () => {
    const [balance, setBalance] = useState<string>('10000');
    const [maxDrawdown, setMaxDrawdown] = useState<string>('100'); // Default to 100% (personal account)
    const [riskPct, setRiskPct] = useState<string>('2');
    const [tradesToConsider, setTradesToConsider] = useState<string>('100');

    const result = useMemo(() => {
        const bal = parseFloat(balance);
        const md = parseFloat(maxDrawdown);
        const rPct = parseFloat(riskPct);
        const nTrades = parseInt(tradesToConsider, 10);

        if (isNaN(bal) || isNaN(md) || isNaN(rPct) || isNaN(nTrades) || rPct <= 0 || md <= 0) {
            return null;
        }

        const riskAmount = bal * (rPct / 100);

        // Simple linear calculation: e.g., 100% drawdown / 2% risk = 50 trades
        const consecutiveLosses = Math.floor(md / rPct);

        // Generate probability table for different win rates (30%, 40%, 50%, 60%, 70%)
        const winRates = [30, 40, 50, 60, 70];

        const probabilities = winRates.map(wr => {
            const pLoss = 1 - (wr / 100);
            // Probability of streak of length k in n trades.
            // Simplified approximation for rare events:
            // Expected number of such streaks = (n - k + 1) * p^k * (1-p) for interior streaks
            // This is a complex Markov chain problem, but a common approximation for P(at least 1 streak of k in n) is:
            // 1 - exp(- (n-k+1) * pLoss^k * (1 - pLoss) )

            const k = consecutiveLosses;
            const n = nTrades;

            let probStreak = 0;
            if (k > n) {
                probStreak = 0;
            } else if (pLoss === 1) {
                probStreak = 100;
            } else {
                // Approximate formula
                const pStreak = (n - k + 1) * Math.pow(pLoss, k) * (1 - pLoss);
                probStreak = (1 - Math.exp(-pStreak)) * 100;
            }

            return {
                winRate: wr,
                probability: probStreak
            };
        });

        return {
            riskAmount,
            consecutiveLosses,
            probabilities,
            nTrades
        };

    }, [balance, maxDrawdown, riskPct, tradesToConsider]);

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Card style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                        <ShieldAlert size={20} className="text-secondary" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Risk of Ruin Calculator</h2>
                        <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>Calculate how many losses will blow your account or fail a challenge.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <Input
                        label="Account Balance ($)"
                        type="number"
                        value={balance}
                        onChange={e => setBalance(e.target.value)}
                        placeholder="10000"
                    />
                    <Input
                        label={
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Max Drawdown Limit (%)
                                <span title="100% for personal accounts, e.g., 10% for prop firm challenges"><Info size={12} color="var(--text-muted)" /></span>
                            </span>
                        }
                        type="number"
                        value={maxDrawdown}
                        onChange={e => setMaxDrawdown(e.target.value)}
                        placeholder="100"
                    />
                    <Input
                        label="Risk per Trade (%)"
                        type="number"
                        value={riskPct}
                        onChange={e => setRiskPct(e.target.value)}
                        placeholder="2"
                    />
                    <Input
                        label="Trades to Simulate"
                        type="number"
                        value={tradesToConsider}
                        onChange={e => setTradesToConsider(e.target.value)}
                        placeholder="100"
                    />
                </div>

                {result ? (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                <span className="text-secondary" style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.5rem' }}>Risk Amount per Trade</span>
                                <span style={{ fontSize: '2rem', fontWeight: 700 }}>${result.riskAmount.toFixed(2)}</span>
                            </div>
                            <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <span style={{ color: 'var(--loss-color)', fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Losses to Blow Limit</span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--loss-color)' }}>{result.consecutiveLosses}</span>
                                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>trades</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                Probability of Ruin within {result.nTrades} Trades
                            </h3>
                            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                                Chance of hitting {result.consecutiveLosses} consecutive losses based on your historic win rate.
                            </p>

                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {result.probabilities.map(p => {
                                    const isHighRisk = p.probability > 10;
                                    const isMediumRisk = p.probability > 1 && p.probability <= 10;

                                    let barColor = 'var(--win-color)';
                                    if (isHighRisk) barColor = 'var(--loss-color)';
                                    else if (isMediumRisk) barColor = '#EAB308';

                                    return (
                                        <div key={p.winRate} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                                            <div style={{ width: '80px', fontWeight: 600 }}>{p.winRate}% Win</div>
                                            <div style={{ flex: 1, background: 'var(--bg-tertiary)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${Math.min(100, Math.max(1, p.probability))}%`, height: '100%', background: barColor, transition: 'width 0.5s' }} />
                                            </div>
                                            <div style={{ width: '60px', textAlign: 'right', fontWeight: 700, color: barColor }}>
                                                {p.probability < 0.01 && p.probability > 0 ? '<0.01%' : `${p.probability.toFixed(2)}%`}
                                            </div>
                                            <div style={{ width: '20px' }}>
                                                {isHighRisk && <AlertTriangle size={14} color="var(--loss-color)" />}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                        </div>
                    </>
                ) : (
                    <div style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Enter valid numbers above to see your risk calculation.
                    </div>
                )}
            </Card>
        </div>
    );
};
