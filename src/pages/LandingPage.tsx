import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Calculator, ShieldCheck, ArrowRight, Activity, Github, PieChart, Target, Clock, Crosshair } from 'lucide-react';
import { SEO } from '../components/SEO';

// --- Custom Hooks ---
function useScrollReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return { ref, isVisible };
}

// --- Components ---
const Reveal: React.FC<{ children: React.ReactNode; delay?: number; direction?: 'up' | 'left' | 'right' }> = ({ children, delay = 0, direction = 'up' }) => {
    const { ref, isVisible } = useScrollReveal();
    const getTransform = () => {
        switch (direction) {
            case 'up': return 'translateY(30px)';
            case 'left': return 'translateX(-40px)';
            case 'right': return 'translateX(40px)';
            default: return 'translateY(30px)';
        }
    };

    return (
        <div
            ref={ref}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'none' : getTransform(),
                transition: `all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}ms`,
            }}
        >
            {children}
        </div>
    );
};

// --- Mockup Placeholder Component ---
const UIMockupPlaceholder: React.FC<{ type: 'dashboard' | 'strategy' | 'tools' }> = ({ type }) => {
    // Generate different stylized blocks based on the type
    return (
        <div style={{
            width: '100%',
            height: '100%',
            minHeight: '400px',
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 20px 40px -10px rgba(15, 22, 60, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            {/* Fake Browser/App Header */}
            <div style={{
                height: '40px',
                background: '#f8fafc',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 1rem',
                gap: '0.5rem'
            }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', opacity: 0.8 }}>

                {type === 'dashboard' && (
                    <>
                        {/* Top Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} style={{ height: '80px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #e2e8f0' }} />
                            ))}
                        </div>
                        {/* Main Chart Area */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', flex: 1 }}>
                            <div style={{ borderRadius: '12px', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrendingUp size={48} color="#94a3b8" />
                            </div>
                            <div style={{ borderRadius: '12px', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Target size={48} color="#94a3b8" />
                            </div>
                        </div>
                    </>
                )}

                {type === 'strategy' && (
                    <>
                        <div style={{ height: '40px', width: '200px', borderRadius: '6px', background: '#f1f5f9' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flex: 1 }}>
                            <div style={{ borderRadius: '12px', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <PieChart size={48} color="#94a3b8" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} style={{ height: '50px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #e2e8f0' }} />
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {type === 'tools' && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', flex: 1 }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{ borderRadius: '12px', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Calculator size={48} color="#94a3b8" />
                                </div>
                            ))}
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};

// --- Main Page Component ---
export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    // Force light mode CSS variables for this page specifically
    const lightModeStyle = {
        '--lm-bg-primary': '#ffffff',
        '--lm-bg-secondary': '#f8fafc',
        '--lm-text-primary': '#0f172a',
        '--lm-text-secondary': '#475569',
        '--lm-text-muted': '#94a3b8',
        '--lm-accent-primary': '#3b82f6',
        '--lm-accent-glow': 'rgba(59, 130, 246, 0.15)',
        '--lm-border': '#e2e8f0',
        minHeight: '100vh',
        background: 'var(--lm-bg-primary)',
        color: 'var(--lm-text-primary)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        overflowX: 'hidden' as const
    };

    return (
        <div style={lightModeStyle}>
            <SEO
                title="ArpanTrade | Master Your Trades, Control Your Emotions"
                description="A powerful, 100% free trading journal and toolset. Track performance, analyze strategies, and utilize free calculators."
            />

            {/* Global Keyframes for Dynamic Animations (Subtle Light Mode variations) */}
            <style>
                {`
                @keyframes float-light {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                @keyframes pulse-soft {
                    0% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.02); }
                    100% { opacity: 0.3; transform: scale(1); }
                }
                .hero-image-container {
                    animation: float-light 8s ease-in-out infinite;
                }
                .glass-card-light {
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(0, 0, 0, 0.05);
                    box-shadow: 0 12px 36px rgba(15, 22, 60, 0.08);
                }
                .text-gradient-dark {
                    background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .button-primary-light {
                    background: #3b82f6;
                    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
                    transition: all 0.25s ease;
                }
                .button-primary-light:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
                    background: #2563eb;
                }
                .button-outline-light {
                    background: transparent;
                    border: 1px solid #cbd5e1;
                    color: #334155;
                    transition: all 0.25s ease;
                }
                .button-outline-light:hover {
                    background: #f1f5f9;
                    border-color: #94a3b8;
                    color: #0f172a;
                }
                `}
            </style>

            {/* Navigation / Header */}
            <header style={{
                padding: '1.25rem 2.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--lm-border)',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                position: 'fixed',
                width: '100%',
                top: 0,
                zIndex: 50,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        background: '#3b82f6',
                        padding: '0.5rem',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)',
                    }}>
                        <TrendingUp size={20} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: '#0f172a' }}>ArpanTrade</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/tools')}
                        className="button-outline-light"
                        style={{
                            padding: '0.6rem 1.25rem',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                        }}
                    >
                        Free Tools
                    </button>
                    <button
                        onClick={() => navigate('/journal')}
                        className="button-primary-light"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1.5rem',
                            borderRadius: '8px',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        Enter App <ArrowRight size={16} />
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section style={{
                minHeight: '90vh',
                padding: '10rem 2.5rem 5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                background: 'radial-gradient(ellipse at top, #f8fafc 0%, #ffffff 100%)'
            }}>

                {/* Background Blobs (Light mode subtle shapes) */}
                <div style={{
                    position: 'absolute',
                    top: '10%',
                    right: '10%',
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 60%)',
                    zIndex: 0,
                    pointerEvents: 'none',
                }}></div>
                <div style={{
                    position: 'absolute',
                    bottom: '10%',
                    left: '5%',
                    width: '500px',
                    height: '500px',
                    background: 'radial-gradient(circle, rgba(16,185,129,0.03) 0%, transparent 60%)',
                    zIndex: 0,
                    pointerEvents: 'none',
                }}></div>

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <Reveal delay={100}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: '20px', background: '#f1f5f9', color: '#475569', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                            <ShieldCheck size={14} color="#10b981" />
                            Local-First & 100% Free
                        </div>
                    </Reveal>

                    <Reveal delay={200}>
                        <h1 style={{
                            fontSize: 'clamp(3rem, 6vw, 5.5rem)',
                            fontWeight: 800,
                            letterSpacing: '-0.04em',
                            lineHeight: 1.1,
                            marginBottom: '1.5rem',
                            maxWidth: '900px'
                        }} className="text-gradient-dark">
                            The analytical edge for <br />
                            <span style={{ color: '#3b82f6' }}>serious traders.</span>
                        </h1>
                    </Reveal>

                    <Reveal delay={300}>
                        <p style={{
                            fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
                            color: 'var(--lm-text-secondary)',
                            lineHeight: 1.6,
                            marginBottom: '3rem',
                            maxWidth: '650px',
                        }}>
                            Track every setup, identify your most profitable strategies, and measure emotional performance completely privately. No subscriptions.
                        </p>
                    </Reveal>

                    <Reveal delay={400}>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={() => navigate('/journal')}
                                className="button-primary-light"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '1rem 2.5rem', borderRadius: '12px',
                                    color: '#fff', fontWeight: 700, fontSize: '1.1rem',
                                    border: 'none', cursor: 'pointer',
                                }}
                            >
                                Start Journaling
                            </button>
                            <a href="https://github.com/Arpanjot0Singh/trading-journal" target="_blank" rel="noopener noreferrer" className="button-outline-light" style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '1rem 2rem', borderRadius: '12px',
                                fontWeight: 600, fontSize: '1.1rem',
                                textDecoration: 'none',
                            }}>
                                <Github size={20} /> View Source
                            </a>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* Showcase 1: Dashboard Analytics */}
            <section style={{ padding: '8rem 2.5rem', background: '#ffffff', borderTop: '1px solid var(--lm-border)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '4rem', alignItems: 'center' }}>
                    <Reveal direction="left">
                        <div className="hero-image-container glass-card-light" style={{ padding: '1rem', borderRadius: '24px' }}>
                            {/* Stylized Placeholder for Dashboard */}
                            <UIMockupPlaceholder type="dashboard" />
                        </div>
                    </Reveal>
                    <Reveal direction="right" delay={200}>
                        <div>
                            <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '12px', background: '#eff6ff', marginBottom: '1.5rem', border: '1px solid #dbeafe' }}>
                                <Activity size={28} color="#3b82f6" />
                            </div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.1, color: '#0f172a' }}>
                                The Command Center.
                            </h2>
                            <p style={{ fontSize: '1.1rem', color: 'var(--lm-text-secondary)', lineHeight: 1.7, marginBottom: '2rem' }}>
                                Instantly know where your account stands. ArpanTrade's highly interactive dashboard visualizes your entire trading history in real-time without relying on external servers.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ background: '#f1f5f9', padding: '0.5rem', borderRadius: '8px', height: 'fit-content' }}><TrendingUp size={20} color="#475569" /></div>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', color: '#0f172a' }}>Dynamic Equity Curves</h4>
                                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--lm-text-muted)' }}>Interactive charts mapping your account growth alongside daily PnL bar charts, filterable by month or week.</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ background: '#f1f5f9', padding: '0.5rem', borderRadius: '8px', height: 'fit-content' }}><Target size={20} color="#475569" /></div>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', color: '#0f172a' }}>Radar Performance Score</h4>
                                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--lm-text-muted)' }}>A comprehensive 1-100 score analyzing your Win Rate, Profit Factor, Consistency, and Drawdown penalty on a singular radar chart.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* Showcase 2: Strat & Analytics */}
            <section style={{ padding: '8rem 2.5rem', background: '#f8fafc', borderTop: '1px solid var(--lm-border)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '4rem', alignItems: 'center' }}>
                    <Reveal direction="left">
                        <div style={{ order: 2 }}> {/* Visual order flex magic */}
                            <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '12px', background: '#f5f3ff', marginBottom: '1.5rem', border: '1px solid #ede9fe' }}>
                                <Crosshair size={28} color="#8b5cf6" />
                            </div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.1, color: '#0f172a' }}>
                                Strategy Intelligence.
                            </h2>
                            <p style={{ fontSize: '1.1rem', color: 'var(--lm-text-secondary)', lineHeight: 1.7, marginBottom: '2rem' }}>
                                Stop guessing which setups work. Let raw data identify your highest-probability edges and highlight the setups draining your account.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '0.5rem', borderRadius: '8px', height: 'fit-content' }}><PieChart size={20} color="#8b5cf6" /></div>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', color: '#0f172a' }}>Comparative Strategy Tables</h4>
                                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--lm-text-muted)' }}>Compare side-by-side win percentages, P&L totals, Profit Factors, and Average R:R across every tagged strategy in your journal.</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '0.5rem', borderRadius: '8px', height: 'fit-content' }}><Clock size={20} color="#8b5cf6" /></div>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', color: '#0f172a' }}>Deep Temporal Analytics</h4>
                                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--lm-text-muted)' }}>View precise UI histograms detailing your most profitable execution hours (UTC), best days of the week, and trade-duration scatter distributions.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                    <Reveal direction="right" delay={200}>
                        <div className="hero-image-container glass-card-light" style={{ padding: '1rem', borderRadius: '24px', order: 1 }}>
                            {/* Stylized Placeholder for Strategy */}
                            <UIMockupPlaceholder type="strategy" />
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* Showcase 3: Tools */}
            <section style={{ padding: '8rem 2.5rem', background: '#ffffff', borderTop: '1px solid var(--lm-border)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '4rem', alignItems: 'center' }}>
                    <Reveal direction="left">
                        <div className="hero-image-container glass-card-light" style={{ padding: '1rem', borderRadius: '24px' }}>
                            {/* Stylized Placeholder for Tools */}
                            <UIMockupPlaceholder type="tools" />
                        </div>
                    </Reveal>
                    <Reveal direction="right" delay={200}>
                        <div>
                            <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '12px', background: '#ecfdf5', marginBottom: '1.5rem', border: '1px solid #d1fae5' }}>
                                <Calculator size={28} color="#10b981" />
                            </div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.1, color: '#0f172a' }}>
                                Execution Utilities.
                            </h2>
                            <p style={{ fontSize: '1.1rem', color: 'var(--lm-text-secondary)', lineHeight: 1.7, marginBottom: '2rem' }}>
                                A suite of completely free calculators built into the platform to ensure perfect sizing, strict risk management, and prop firm success.
                            </p>

                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[
                                    { text: "Prop Firm passing simulators (Profit goals vs Max Drawdown)", icon: <Target size={18} color="#10b981" /> },
                                    { text: "Dynamic Lot Size calculators across varied asset classes", icon: <TrendingUp size={18} color="#10b981" /> },
                                    { text: "Advanced Risk of Ruin probability modeling", icon: <ShieldCheck size={18} color="#10b981" /> },
                                ].map((item, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', fontSize: '1rem', color: 'var(--lm-text-secondary)' }}>
                                        <div style={{ background: '#f1f5f9', padding: '0.4rem', borderRadius: '6px', flexShrink: 0 }}>{item.icon}</div>
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* Footer CTA */}
            <section style={{
                padding: '8rem 2.5rem',
                textAlign: 'center',
                background: '#f8fafc',
                borderTop: '1px solid var(--lm-border)',
                position: 'relative'
            }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <Reveal>
                        <h2 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '1.5rem', lineHeight: 1.1, color: '#0f172a' }}>
                            Elevate your journaling.
                        </h2>
                        <p style={{ color: 'var(--lm-text-secondary)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                            Absolute local privacy. No locked features. A complete analytics suite designed for strict performance improvement.
                        </p>
                        <button
                            onClick={() => navigate('/journal')}
                            className="button-primary-light"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1.2rem 3rem',
                                borderRadius: '12px',
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            Open Local App
                        </button>
                    </Reveal>
                </div>
            </section>

            {/* Minimal Footer */}
            <footer style={{
                padding: '2.5rem 2.5rem',
                borderTop: '1px solid var(--lm-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'var(--lm-text-muted)',
                fontSize: '0.9rem',
                background: '#ffffff'
            }}>
                <div>&copy; {new Date().getFullYear()} ArpanTrade. Engineered for performance.</div>
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <span style={{ cursor: 'pointer', fontWeight: 500 }} onClick={() => navigate('/journal')}>Journal</span>
                    <span style={{ cursor: 'pointer', fontWeight: 500 }} onClick={() => navigate('/strategy')}>Strategies</span>
                    <span style={{ cursor: 'pointer', fontWeight: 500 }} onClick={() => navigate('/tools')}>Calculators</span>
                </div>
            </footer>
        </div>
    );
};
