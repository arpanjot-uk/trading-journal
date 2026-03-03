import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Input, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import { Calculator, AlertTriangle } from 'lucide-react';

const ASSET_TYPES = [
    { value: 'forex_usd', label: 'Forex (USD Quote - $10/pip)', multiplier: 10 },
    { value: 'forex_jpy', label: 'Forex (JPY Quote - ~$6.7/pip)', multiplier: 6.7 },
    { value: 'mnq', label: 'MNQ (Micro Nasdaq - $2/pt)', multiplier: 2 },
    { value: 'nq', label: 'NQ (Nasdaq - $20/pt)', multiplier: 20 },
    { value: 'mes', label: 'MES (Micro S&P - $5/pt)', multiplier: 5 },
    { value: 'es', label: 'ES (S&P 500 - $50/pt)', multiplier: 50 },
    { value: 'mcl', label: 'MCL (Micro Crude - $10/pt)', multiplier: 10 },
    { value: 'cl', label: 'CL (Crude Oil - $1000/pt)', multiplier: 1000 },
    { value: 'xau', label: 'XAU/USD (Gold - $10/pt)', multiplier: 10 },
    { value: 'stocks', label: 'Stocks / Crypto (1 unit)', multiplier: 1 },
];

export const LotSizeCalculator: React.FC = () => {
    const [balance, setBalance] = useState<string>('10000');
    const [riskPct, setRiskPct] = useState<string>('1');
    const [stopLoss, setStopLoss] = useState<string>('15');
    const [assetClass, setAssetClass] = useState<string>('forex_usd');

    const result = useMemo(() => {
        const bal = parseFloat(balance);
        const rPct = parseFloat(riskPct);
        const sl = parseFloat(stopLoss);

        if (isNaN(bal) || isNaN(rPct) || isNaN(sl) || bal <= 0 || rPct <= 0 || sl <= 0) {
            return null;
        }

        const riskAmount = bal * (rPct / 100);
        const asset = ASSET_TYPES.find(a => a.value === assetClass);
        const multiplier = asset ? asset.multiplier : 1;

        // Risk Amount = LotSize * StopLoss * Multiplier
        // LotSize = Risk Amount / (StopLoss * Multiplier)
        const lossPerUnit = sl * multiplier;
        const size = riskAmount / lossPerUnit;

        return {
            riskAmount,
            size,
            isFractional: assetClass !== 'stocks' && !assetClass.startsWith('forex'),
        };
    }, [balance, riskPct, stopLoss, assetClass]);

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Card style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                        <Calculator size={20} className="text-accent" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Lot Size Calculator</h2>
                        <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>Calculate exact position sizes to manage risk precisely.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <Input
                        label="Account Balance ($)"
                        type="number"
                        value={balance}
                        onChange={e => setBalance(e.target.value)}
                        placeholder="10000"
                        min="0"
                        step="100"
                    />
                    <Input
                        label="Risk per Trade (%)"
                        type="number"
                        value={riskPct}
                        onChange={e => setRiskPct(e.target.value)}
                        placeholder="1.0"
                        min="0.1"
                        step="0.1"
                    />
                    <Input
                        label="Stop Loss (Pips/Points/Cents)"
                        type="number"
                        value={stopLoss}
                        onChange={e => setStopLoss(e.target.value)}
                        placeholder="15"
                        min="0.1"
                        step="0.1"
                    />
                    <Select
                        label="Asset Class"
                        value={assetClass}
                        onChange={e => setAssetClass(e.target.value)}
                        options={ASSET_TYPES}
                    />
                </div>

                {result ? (
                    <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <span className="text-secondary" style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Recommended Position Size</span>
                                <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-primary)', lineHeight: 1 }}>
                                    {result.size.toFixed(result.isFractional ? 2 : 2)}
                                </span>
                                <span className="text-muted" style={{ fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                                    {assetClass.startsWith('forex') ? 'Lots' : assetClass === 'stocks' ? 'Shares/Coins' : 'Contracts'}
                                </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span className="text-secondary" style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Total Risk Amount</span>
                                <span style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--loss-color)' }}>
                                    ${result.riskAmount.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {result.isFractional && result.size % 1 !== 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#EAB308', background: 'rgba(234, 179, 8, 0.1)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                                <AlertTriangle size={14} />
                                <span>Futures contracts cannot be traded fractionally. Round down to {Math.floor(result.size)} contracts to stay strictly under your risk limit.</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Enter valid numbers above to see your recommended position size.
                    </div>
                )}
            </Card>
        </div>
    );
};
