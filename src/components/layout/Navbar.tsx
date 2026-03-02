import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LineChart, Settings, Moon, Sun, BookOpen, LayoutDashboard, Calendar, FileSpreadsheet } from 'lucide-react';
import { SettingsModal } from './SettingsModal';

export const Navbar: React.FC = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [theme, setTheme] = useState('dark');
    const location = useLocation();

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
        { path: '/log', label: 'Trade Log', icon: <FileSpreadsheet size={18} /> },
        { path: '/calendar', label: 'Calendar', icon: <Calendar size={18} /> },
    ];

    return (
        <nav className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, marginBottom: '2rem' }}>
            <div className="container flex-between" style={{ height: '70px' }}>
                <Link to="/" className="flex-center" style={{ gap: '0.75rem', color: 'var(--text-primary)' }}>
                    <div style={{ background: 'var(--accent-primary)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                        <LineChart size={24} color="#fff" />
                    </div>
                    <h2 className="text-gradient hover-effect" style={{ display: 'none' }}>TradeJournal</h2>
                </Link>

                <div className="flex-center" style={{ gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
                    {navLinks.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: 'var(--radius-round)',
                                    color: isActive ? '#fff' : 'var(--text-secondary)',
                                    background: isActive ? 'var(--accent-primary)' : 'transparent',
                                    fontWeight: 500,
                                    transition: 'var(--transition-fast)'
                                }}
                            >
                                {link.icon}
                                <span>{link.label}</span>
                            </Link>
                        );
                    })}
                </div>

                <div className="flex-center" style={{ gap: '1rem' }}>
                    <button
                        className="flex-center"
                        style={{ color: 'var(--text-secondary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', transition: 'var(--transition-fast)' }}
                        onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                        onClick={toggleTheme}
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button
                        className="flex-center"
                        style={{ color: 'var(--text-secondary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', transition: 'var(--transition-fast)' }}
                        onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                        onClick={() => setIsSettingsOpen(true)}
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </nav>
    );
};
