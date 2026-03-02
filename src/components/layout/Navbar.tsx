import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LineChart, Settings, Moon, Sun, BookOpen, LayoutDashboard, Calendar, Plus } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { AddTradeModal } from '../AddTradeModal';
import { useJournalContext } from '../../context/JournalContext';

export const Navbar: React.FC = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
    const [theme, setTheme] = useState('dark');
    const location = useLocation();
    const { activeJournalId } = useJournalContext();

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const navLinks = [
        { path: '/', label: 'Journals', icon: <BookOpen size={18} /> },
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { path: '/calendar', label: 'Calendar', icon: <Calendar size={18} /> },
    ];

    return (
        <nav className="glass-panel" style={{
            width: '260px',
            minWidth: '260px',
            borderRadius: 0,
            borderTop: 0,
            borderBottom: 0,
            borderLeft: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            padding: '2rem 1.5rem',
            position: 'sticky',
            top: 0
        }}>
            <Link to="/" className="flex-center" style={{ gap: '0.75rem', color: 'var(--text-primary)', marginBottom: '3rem', justifyContent: 'flex-start' }}>
                <div style={{ background: 'var(--accent-primary)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                    <LineChart size={24} color="#fff" />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>TradeJournal</h2>
            </Link>

            {activeJournalId ? (
                <button
                    className="flex-center hover-effect"
                    style={{
                        background: 'var(--accent-primary)',
                        color: 'white',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        gap: '0.5rem',
                        fontWeight: 600,
                        marginBottom: '2rem',
                        display: 'flex',
                        border: 'none',
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'var(--transition-fast)',
                        boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.4)',
                    }}
                    onClick={() => setIsAddTradeOpen(true)}
                >
                    <Plus size={20} />
                    <span>Add Trade</span>
                </button>
            ) : null}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                {navLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                background: isActive ? 'var(--card-bg-hover)' : 'transparent',
                                border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                                fontWeight: isActive ? 600 : 500,
                                transition: 'all var(--transition-fast)'
                            }}
                            onMouseOver={e => !isActive && (e.currentTarget.style.color = 'var(--text-primary)')}
                            onMouseOut={e => !isActive && (e.currentTarget.style.color = 'var(--text-secondary)')}
                        >
                            {link.icon}
                            <span>{link.label}</span>
                        </Link>
                    );
                })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', color: 'var(--text-secondary)', borderRadius: 'var(--radius-md)', transition: 'var(--transition-fast)', textAlign: 'left', width: '100%' }}
                    onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--card-bg-hover)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                    onClick={toggleTheme}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', color: 'var(--text-secondary)', borderRadius: 'var(--radius-md)', transition: 'var(--transition-fast)', textAlign: 'left', width: '100%' }}
                    onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--card-bg-hover)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                    onClick={() => setIsSettingsOpen(true)}
                >
                    <Settings size={20} />
                    <span>Settings</span>
                </button>
            </div>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <AddTradeModal isOpen={isAddTradeOpen} onClose={() => setIsAddTradeOpen(false)} />
        </nav>
    );
};
