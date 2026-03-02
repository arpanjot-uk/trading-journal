import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { JournalView } from './pages/JournalView';
import { CalendarPage } from './pages/CalendarPage';

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/log" element={<JournalView />} />
        <Route path="/calendar" element={<CalendarPage />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
