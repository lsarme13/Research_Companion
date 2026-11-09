import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles.css';

try {
  const cachedTheme = localStorage.getItem('rc:theme');
  if (cachedTheme === 'editorial' || cachedTheme === 'dark' || cachedTheme === 'neutral') {
    document.documentElement.setAttribute('data-theme', cachedTheme);
  }
} catch {
  // O tema padrão permanece aplicado.
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
