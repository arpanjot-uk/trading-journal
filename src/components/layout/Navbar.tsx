import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Settings, Moon, Sun } from 'lucide-react';
import { SettingsModal } from './SettingsModal';

export const Navbar: React.FC = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [theme, setTheme] = useState('dark');

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

    return (
        <nav className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, marginBottom: '2rem' }}>
            <div className="container flex-between" style={{ height: '70px' }}>
                <Link to="/" className="flex-center" style={{ gap: '0.75rem', color: 'var(--text-primary)' }}>
                    <div style={{ background: 'var(--accent-primary)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                        <LineChart size={24} color="#fff" />
                    </div>
                    <h2 className="text-gradient">TradeJournal</h2>
                </Link>
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
