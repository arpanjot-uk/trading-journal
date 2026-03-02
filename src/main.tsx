import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { JournalProvider } from './context/JournalContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <JournalProvider>
        <App />
      </JournalProvider>
    </BrowserRouter>
  </StrictMode>,
);
