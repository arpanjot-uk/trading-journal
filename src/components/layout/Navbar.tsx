import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { db } from '../../db/db';
import { LineChart, Settings, Moon, Sun, BookOpen, LayoutDashboard, Calendar, Plus, Activity } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { AddTradeModal } from '../AddTradeModal';
import { DailyMoodModal } from '../DailyMoodModal';
import { useJournalContext } from '../../context/JournalContext';

export const Navbar: React.FC = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
    const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
    const [theme, setTheme] = useState('dark'); // B5 fix: default matches CSS :root (dark)
    const location = useLocation();
    const { activeJournalId } = useJournalContext();

    const todayDateStr = format(new Date(), 'yyyy-MM-dd');
    const hasLoggedToday = useLiveQuery(async () => {
        if (!activeJournalId) return true;
        const todayMood = await db.dailyMoods.where({ journalId: activeJournalId, date: todayDateStr }).first();
        return !!todayMood;
    }, [activeJournalId, todayDateStr]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const navLinks = [
        { path: '/', label: 'Journals', icon: <BookOpen size={16} /> },
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
        { path: '/calendar', label: 'Calendar', icon: <Calendar size={16} /> },
    ];

    const navItemBase: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.55rem 0.75rem',
        borderRadius: 'var(--radius-md)',
        fontWeight: 500,
        fontSize: '0.875rem',
        transition: 'all var(--transition-fast)',
        width: '100%',
    };

    return (
        <nav style={{
            width: '240px',
            minWidth: '240px',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            padding: '1.5rem 1rem',
            position: 'sticky',
            top: 0,
            transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
        }}>
            {/* Logo */}
            <Link to="/" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                color: 'var(--text-primary)',
                marginBottom: '2rem',
                padding: '0 0.25rem',
                textDecoration: 'none',
            }}>
                <div style={{
                    background: 'var(--accent-primary)',
                    padding: '0.45rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <LineChart size={18} color="#fff" />
                </div>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Arpan Journal</span>
            </Link>

            {/* CTA Buttons */}
            {activeJournalId ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => setIsAddTradeOpen(true)}
                        style={{
                            ...navItemBase,
                            background: 'var(--accent-primary)',
                            color: '#fff',
                            fontWeight: 600,
                            justifyContent: 'center',
                            border: 'none',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--accent-hover)'}
                        onMouseOut={e => e.currentTarget.style.background = 'var(--accent-primary)'}
                    >
                        <Plus size={16} />
                        <span>Add Trade</span>
                    </button>
                    {!hasLoggedToday && (
                        <button
                            onClick={() => setIsMoodModalOpen(true)}
                            style={{
                                ...navItemBase,
                                background: 'transparent',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-color)',
                                justifyContent: 'center',
                                fontWeight: 500,
                            }}
                            onMouseOver={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                            onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                        >
                            <Activity size={16} />
                            <span>Log Mood</span>
                        </button>
                    )}
                </div>
            ) : null}

            {/* Nav label */}
            <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', padding: '0 0.5rem', marginBottom: '0.5rem' }}>
                Navigate
            </span>

            {/* Nav Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                {navLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            style={{
                                ...navItemBase,
                                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                                borderLeft: isActive ? `2px solid var(--accent-primary)` : '2px solid transparent',
                                paddingLeft: '0.625rem',
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

            {/* Footer actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                    style={{ ...navItemBase, color: 'var(--text-secondary)', border: 'none' }}
                    onMouseOver={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                    onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                    onClick={toggleTheme}
                >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button
                    style={{ ...navItemBase, color: 'var(--text-secondary)', border: 'none' }}
                    onMouseOver={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                    onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                    onClick={() => setIsSettingsOpen(true)}
                >
                    <Settings size={16} />
                    <span>Settings</span>
                </button>
            </div>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <AddTradeModal isOpen={isAddTradeOpen} onClose={() => setIsAddTradeOpen(false)} />
            {activeJournalId && (
                <DailyMoodModal
                    isOpen={isMoodModalOpen}
                    onClose={() => setIsMoodModalOpen(false)}
                    journalId={activeJournalId}
                />
            )}
        </nav>
    );
};
