import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { db } from '../../db/db';
import {
    TrendingUp, Settings, Moon, Sun, BookOpen, LayoutDashboard,
    Calendar, Plus, Activity, Heart, ChevronRight, BarChart2
} from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { AddTradeModal } from '../AddTradeModal';
import { DailyMoodModal } from '../DailyMoodModal';
import { useJournalContext } from '../../context/JournalContext';

export const Navbar: React.FC = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
    const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
    const [theme, setTheme] = useState('dark');
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
        { path: '/', label: 'Journals', icon: <BookOpen size={15} />, exact: true },
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
        { path: '/calendar', label: 'Calendar', icon: <Calendar size={15} /> },
        { path: '/strategy', label: 'Strategies', icon: <BarChart2 size={15} /> },
        { path: '/emotions', label: 'Emotions', icon: <Heart size={15} /> },
    ];

    return (
        <nav style={{
            width: '220px',
            minWidth: '220px',
            background: 'var(--sidebar-bg)',
            borderRight: '1px solid var(--sidebar-border)',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            padding: '1.25rem 0.875rem',
            position: 'sticky',
            top: 0,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            transition: 'background-color var(--transition-normal)',
        }}>
            {/* Logo */}
            <Link to="/" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                color: 'var(--text-primary)',
                marginBottom: '1.75rem',
                padding: '0.25rem 0.375rem',
                textDecoration: 'none',
                borderRadius: 'var(--radius-sm)',
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #4f7cf6, #7c3aed)',
                    padding: '0.45rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(79,124,246,0.35)',
                }}>
                    <TrendingUp size={16} color="#fff" />
                </div>
                <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1 }}>TradeJournal</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: 1 }}>Performance Analytics</div>
                </div>
            </Link>

            {/* CTA Buttons */}
            {activeJournalId && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => setIsAddTradeOpen(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.45rem',
                            padding: '0.6rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'linear-gradient(135deg, var(--accent-primary), #6366f1)',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            border: 'none',
                            width: '100%',
                            boxShadow: '0 4px 14px var(--accent-glow)',
                            transition: 'all var(--transition-fast)',
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
                        <Plus size={14} />
                        <span>Add Trade</span>
                    </button>
                    {!hasLoggedToday && (
                        <button
                            onClick={() => setIsMoodModalOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.45rem',
                                padding: '0.55rem',
                                borderRadius: 'var(--radius-md)',
                                background: 'transparent',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-color)',
                                fontWeight: 500,
                                fontSize: '0.82rem',
                                width: '100%',
                                transition: 'all var(--transition-fast)',
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                e.currentTarget.style.color = 'var(--accent-primary)';
                                e.currentTarget.style.background = 'var(--accent-glow)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                                e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            <Activity size={13} />
                            <span>Log Mood</span>
                        </button>
                    )}
                </div>
            )}

            {/* Section label */}
            <div style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--text-muted)',
                padding: '0 0.5rem',
                marginBottom: '0.375rem',
            }}>
                Navigation
            </div>

            {/* Nav Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', flex: 1 }}>
                {navLinks.map((link) => {
                    const isActive = link.exact
                        ? location.pathname === link.path
                        : location.pathname.startsWith(link.path) && link.path !== '/';
                    const isActiveExact = location.pathname === link.path;
                    const active = link.exact ? isActiveExact : isActive;

                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.55rem',
                                padding: '0.55rem 0.625rem',
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: active ? 600 : 500,
                                fontSize: '0.85rem',
                                color: active ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                                background: active ? 'var(--accent-glow)' : 'transparent',
                                border: active ? '1px solid rgba(79,124,246,0.2)' : '1px solid transparent',
                                transition: 'all var(--transition-fast)',
                                textDecoration: 'none',
                                width: '100%',
                            }}
                            onMouseOver={e => {
                                if (!active) {
                                    e.currentTarget.style.color = 'var(--text-primary)';
                                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                                }
                            }}
                            onMouseOut={e => {
                                if (!active) {
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                    e.currentTarget.style.background = 'transparent';
                                }
                            }}
                        >
                            <span style={{ opacity: active ? 1 : 0.7, display: 'flex' }}>{link.icon}</span>
                            <span style={{ flex: 1 }}>{link.label}</span>
                            {active && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
                        </Link>
                    );
                })}
            </div>

            {/* Footer actions */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.125rem',
                paddingTop: '0.875rem',
                borderTop: '1px solid var(--border-color)',
            }}>
                {[
                    {
                        icon: theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />,
                        label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
                        onClick: toggleTheme,
                    },
                    {
                        icon: <Settings size={14} />,
                        label: 'Settings',
                        onClick: () => setIsSettingsOpen(true),
                    }
                ].map(item => (
                    <button
                        key={item.label}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.55rem',
                            padding: '0.5rem 0.625rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.82rem',
                            fontWeight: 500,
                            color: 'var(--text-muted)',
                            border: 'none',
                            width: '100%',
                            textAlign: 'left',
                            transition: 'all var(--transition-fast)',
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.color = 'var(--text-primary)';
                            e.currentTarget.style.background = 'var(--bg-tertiary)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.color = 'var(--text-muted)';
                            e.currentTarget.style.background = 'transparent';
                        }}
                        onClick={item.onClick}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
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
