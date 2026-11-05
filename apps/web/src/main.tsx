import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '@see/tokens/tokens.css';
import './styles/base.css';
import './components/components.css';
import { applySavedSettings } from './data/settings';
import { isDesktopShell } from './lib/platform';

applySavedSettings();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

// offline: pages you have opened keep opening (not in dev, and not in the desktop shell, which ships its files)
if (import.meta.env.PROD && 'serviceWorker' in navigator && !isDesktopShell()) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
