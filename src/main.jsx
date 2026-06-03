import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { applyTheme, applyColorMode } from './engine/applyTheme.js';
import { getState } from './engine/store.js';
import './index.css';

applyTheme();
const applyMode = () => applyColorMode(getState().settings?.theme ?? 'auto');
applyMode();
// 'auto' (napszak) módban az idő átléphet 7/19 órát, amíg nyitva van az app —
// visszatéréskor / fókuszáláskor újraértékeljük.
window.addEventListener('visibilitychange', applyMode);
window.addEventListener('focus', applyMode);

// Sikeres boot után töröljük a stale-chunk recovery flag-et, hogy egy
// későbbi deploy mismatch újra auto-recoverable legyen ugyanebben a tabben.
try { sessionStorage.removeItem('tome:reloaded-after-stale-chunk'); } catch {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
