import React, { useEffect } from 'react';
import { Navbar } from './Navbar';
import { initializeSettings } from '../../db/db';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useEffect(() => {
        // Ensure default settings exist on app load
        initializeSettings().catch(console.error);

        // Load custom theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row' }}>
            <Navbar />
            <main style={{ flex: 1, padding: '2rem 4rem', height: '100vh', overflowY: 'auto' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};
