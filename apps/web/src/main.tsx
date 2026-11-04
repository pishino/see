import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '@see/tokens/tokens.css';
import './styles/base.css';
import './components/components.css';
import { readAppearance, setAppearance } from './lib/appearance';

setAppearance(readAppearance());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
