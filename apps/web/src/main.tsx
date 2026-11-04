import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '@see/tokens/tokens.css';
import './styles/base.css';
import './components/components.css';
import { applySavedSettings } from './data/settings';

applySavedSettings();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
