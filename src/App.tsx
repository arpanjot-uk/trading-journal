import { Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AppLayout } from './components/layout/AppLayout';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { JournalView } from './pages/JournalView';
import { CalendarPage } from './pages/CalendarPage';
import { EmotionDashboard } from './pages/EmotionDashboard';

function App() {
  return (
    <>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/log" element={<JournalView />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/emotions" element={<EmotionDashboard />} />
        </Routes>
      </AppLayout>
      <Analytics />
    </>
  );
}

export default App;
