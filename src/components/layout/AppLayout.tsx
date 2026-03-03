import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { initializeSettings } from '../../db/db';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const isLandingPage = location.pathname === '/';

    useEffect(() => {
        // Ensure default settings exist on app load
        initializeSettings().catch(console.error);

        // Load custom theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    if (isLandingPage) {
        return (
            <div style={{ minHeight: '100vh', width: '100vw' }}>
                {children}
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row' }}>
            <Navbar />
            <main style={{ flex: 1, padding: '2rem 2.5rem', height: '100vh', overflowY: 'auto' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};
