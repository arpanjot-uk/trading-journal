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
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <main className="container" style={{ flex: 1, paddingBottom: '3rem' }}>
                {children}
            </main>
        </div>
    );
};
