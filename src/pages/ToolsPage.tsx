import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import { LotSizeCalculator } from '../components/tools/LotSizeCalculator';
import { RiskCalculator } from '../components/tools/RiskCalculator';
import { PropFirmCalculator } from '../components/tools/PropFirmCalculator';

type ToolTab = 'Lot Size' | 'Risk & Drawdown' | 'Prop Firm';

export const ToolsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ToolTab>('Lot Size');

    const tabs: ToolTab[] = ['Lot Size', 'Risk & Drawdown', 'Prop Firm'];

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <div style={{ marginBottom: '2rem', marginTop: '0.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)', padding: '0.45rem', borderRadius: '8px', display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px var(--accent-glow)' }}>
                        <Calculator size={18} color="#fff" />
                    </div>
                    <h1 style={{ margin: 0, fontSize: '1.65rem' }}>Trading Tools</h1>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Advanced calculators for risk management and prop firm challenges</p>
            </div>

            <div className="tab-bar" style={{ marginBottom: '1.5rem' }}>
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`tab-item ${activeTab === tab ? 'active' : ''}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div style={{ animation: 'fadeIn 0.3s ease' }}>
                {activeTab === 'Lot Size' && <LotSizeCalculator />}
                {activeTab === 'Risk & Drawdown' && <RiskCalculator />}
                {activeTab === 'Prop Firm' && <PropFirmCalculator />}
            </div>
        </div>
    );
};
