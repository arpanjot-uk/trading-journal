import { Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { HelmetProvider } from 'react-helmet-async';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { Journals } from './pages/Journals';
import { Dashboard } from './pages/Dashboard';
import { JournalView } from './pages/JournalView';
import { CalendarPage } from './pages/CalendarPage';
import { EmotionDashboard } from './pages/EmotionDashboard';
import { StrategyAnalysis } from './pages/StrategyAnalysis';
import { ToolsPage } from './pages/ToolsPage';

function App() {
  return (
    <HelmetProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/journal" element={<Journals />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/log" element={<JournalView />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/strategy" element={<StrategyAnalysis />} />
          <Route path="/emotions" element={<EmotionDashboard />} />
          <Route path="/tools" element={<ToolsPage />} />
        </Routes>
      </AppLayout>
      <Analytics />
    </HelmetProvider>
  );
}

export default App;
