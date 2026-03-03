import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Calculator, ShieldCheck, ArrowRight, Activity, Crosshair, Github } from 'lucide-react';
import { SEO } from '../components/SEO';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
            overflowX: 'hidden'
        }}>
            <SEO
                title="ArpanTrade | Master Your Trades, Control Your Emotions"
                description="A powerful, 100% free trading journal and toolset. Track performance, analyze strategies, and utilize free trading calculators to gain your edge."
            />

            {/* Navigation / Header */}
            <header style={{
                padding: '1.5rem 2.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)',
                background: 'rgba(var(--bg-primary-rgb), 0.8)',
                backdropFilter: 'blur(12px)',
                position: 'fixed',
                width: '100%',
                top: 0,
                zIndex: 50,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #4f7cf6, #7c3aed)',
                        padding: '0.5rem',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(79,124,246,0.4)',
                    }}>
                        <TrendingUp size={20} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>ArpanTrade</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Performance Analytics</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/tools')}
                        style={{
                            padding: '0.6rem 1.25rem',
                            borderRadius: '8px',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.borderColor = 'var(--text-primary)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                    >
                        Free Tools
                    </button>
                    <button
                        onClick={() => navigate('/journal')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1.5rem',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, var(--accent-primary), #6366f1)',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px var(--accent-glow)',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px var(--accent-glow)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 4px 14px var(--accent-glow)';
                        }}
                    >
                        Go to Journal <ArrowRight size={16} />
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section style={{
                padding: '12rem 2.5rem 8rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Glows */}
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(79,124,246,0.15) 0%, rgba(124,58,237,0.05) 50%, transparent 70%)',
                    zIndex: 0,
                    pointerEvents: 'none'
                }}></div>

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.4rem 1rem',
                            borderRadius: '20px',
                            background: 'rgba(79,124,246,0.1)',
                            color: 'var(--accent-primary)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            border: '1px solid rgba(79,124,246,0.2)'
                        }}>
                            <ShieldCheck size={14} />
                            100% Free & Local
                        </div>
                        <a href="https://github.com/Arpanjot0Singh/trading-journal" target="_blank" rel="noopener noreferrer" style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.4rem 1rem',
                            borderRadius: '20px',
                            background: 'rgba(124,58,237,0.1)',
                            color: '#7c3aed',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            border: '1px solid rgba(124,58,237,0.2)',
                            textDecoration: 'none'
                        }}>
                            <Github size={14} />
                            Open Source
                        </a>
                    </div>
                    <h1 style={{
                        fontSize: '4.5rem',
                        fontWeight: 800,
                        letterSpacing: '-0.04em',
                        lineHeight: 1.1,
                        marginBottom: '1.5rem',
                        background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        Master your trades.<br />
                        <span style={{
                            background: 'linear-gradient(135deg, #4f7cf6, #7c3aed)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>Control your emotions.</span>
                    </h1>
                    <p style={{
                        fontSize: '1.25rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        marginBottom: '3rem',
                        maxWidth: '600px',
                        margin: '0 auto 3rem'
                    }}>
                        The professional-grade trading journal with built-in strategy analysis, emotional tracking, and risk management tools. <strong>Completely free.</strong>
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button
                            onClick={() => navigate('/journal')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '1rem 2rem',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, var(--accent-primary), #6366f1)',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 8px 25px var(--accent-glow)',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 12px 30px var(--accent-glow)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '0 8px 25px var(--accent-glow)';
                            }}
                        >
                            Start Journaling <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section style={{
                padding: '6rem 2.5rem',
                background: 'var(--bg-secondary)',
                borderTop: '1px solid var(--border-color)',
                position: 'relative',
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
                            Everything a professional needs.
                        </h2>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                            We provide deep analytics and free calculators to keep your edge sharp.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        {/* Feature 1 */}
                        <div style={{
                            padding: '2.5rem',
                            background: 'var(--card-bg)',
                            borderRadius: '16px',
                            border: '1px solid var(--card-border)',
                            boxShadow: 'var(--card-shadow-sm)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            cursor: 'default',
                        }}
                            onMouseOver={e => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = 'var(--card-shadow-md)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = 'var(--card-shadow-sm)';
                            }}>
                            <div style={{
                                width: '50px', height: '50px', borderRadius: '12px',
                                background: 'rgba(79, 124, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
                            }}>
                                <Activity size={24} color="#4f7cf6" />
                            </div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem' }}>Advanced Journaling</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                Log trades with deep tagging, strategy selection, and emotional states. Visualize your equity curve in real-time.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div style={{
                            padding: '2.5rem',
                            background: 'var(--card-bg)',
                            borderRadius: '16px',
                            border: '1px solid var(--card-border)',
                            boxShadow: 'var(--card-shadow-sm)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            cursor: 'default',
                        }}
                            onMouseOver={e => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = 'var(--card-shadow-md)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = 'var(--card-shadow-sm)';
                            }}>
                            <div style={{
                                width: '50px', height: '50px', borderRadius: '12px',
                                background: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
                            }}>
                                <Crosshair size={24} color="#7c3aed" />
                            </div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem' }}>Performance Strategies</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                Track individual setups. See win rates, Profit Factor, and average R-multiple broken down by every strategy you test.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div style={{
                            padding: '2.5rem',
                            background: 'var(--card-bg)',
                            borderRadius: '16px',
                            border: '1px solid var(--card-border)',
                            boxShadow: 'var(--card-shadow-sm)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            cursor: 'default',
                        }}
                            onMouseOver={e => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = 'var(--card-shadow-md)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = 'var(--card-shadow-sm)';
                            }}>
                            <div style={{
                                width: '50px', height: '50px', borderRadius: '12px',
                                background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
                            }}>
                                <Calculator size={24} color="#10b981" />
                            </div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem' }}>Free Trading Tools</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                Access completely free calculators including Prop Firm Passing logic, Risk of Ruin, and dynamic Position Sizing.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section style={{
                padding: '8rem 2.5rem',
                textAlign: 'center',
                background: 'var(--bg-primary)',
            }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '1.5rem', lineHeight: 1.1 }}>
                        Ready to elevate your trading?
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                        No hidden subscriptions. No limited features. Keep absolute privacy with our local-first application.
                    </p>
                    <button
                        onClick={() => navigate('/journal')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '1rem 2.5rem',
                            borderRadius: '12px',
                            background: 'var(--text-primary)',
                            color: 'var(--bg-primary)',
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                        }}
                    >
                        Launch App
                    </button>
                </div>
            </section>

            {/* Simple Footer */}
            <footer style={{
                padding: '2rem 2.5rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                color: 'var(--text-muted)',
                fontSize: '0.85rem'
            }}>
                <div>&copy; {new Date().getFullYear()} ArpanTrade. All rights reserved.</div>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <span style={{ cursor: 'pointer' }} onClick={() => navigate('/journal')}>Journal</span>
                    <span style={{ cursor: 'pointer' }} onClick={() => navigate('/tools')}>Tools</span>
                </div>
            </footer>
        </div>
    );
};
