import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/atkinson-hyperlegible-next/wght.css';
import '@fontsource-variable/source-serif-4/opsz.css';
import '@fontsource-variable/atkinson-hyperlegible-mono/wght.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import { App } from './ui/App';

// Privacy promise: no network requests after the page loads. Browsers fetch fonts lazily, so a
// font first needed by a result (the monospace sender notes, accented letters in a pasted
// message) would otherwise be downloaded mid-check. Load every face pasted text can use now.
// Source Serif is only used for the app's own headings, so its Latin subset is enough.
function loadFontsUpFront() {
  document.fonts.forEach((face) => {
    if (!face.family.includes('Source Serif')) face.load().catch(() => undefined);
  });
  document.fonts.load('1em "Source Serif 4 Variable"').catch(() => undefined);
}
if (document.readyState === 'complete') loadFontsUpFront();
else window.addEventListener('load', loadFontsUpFront, { once: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
