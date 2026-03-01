import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Home } from './pages/Home';
import { JournalView } from './pages/JournalView';

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/journal/:id" element={<JournalView />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
