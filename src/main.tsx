import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/atkinson-hyperlegible-next/wght.css';
import '@fontsource-variable/source-serif-4/opsz.css';
import '@fontsource-variable/atkinson-hyperlegible-mono/wght.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import { App } from './ui/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
