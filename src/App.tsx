import { Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AppLayout } from './components/layout/AppLayout';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { JournalView } from './pages/JournalView';
import { CalendarPage } from './pages/CalendarPage';
import { EmotionDashboard } from './pages/EmotionDashboard';
import { StrategyAnalysis } from './pages/StrategyAnalysis';
import { ToolsPage } from './pages/ToolsPage';

function App() {
  return (
    <>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/log" element={<JournalView />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/strategy" element={<StrategyAnalysis />} />
          <Route path="/emotions" element={<EmotionDashboard />} />
          <Route path="/tools" element={<ToolsPage />} />
        </Routes>
      </AppLayout>
      <Analytics />
    </>
  );
}

export default App;
