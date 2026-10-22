import { useEffect, useRef, useState } from 'react';
import { CheckPage } from './CheckPage';
import { HowItWorksPage } from './HowItWorksPage';

type Route = { page: 'check' | 'how'; section: string | null };

function parseHash(hash: string): Route {
  const [, page, section] = hash.replace(/^#/, '').split('/');
  return { page: page === 'how-it-works' ? 'how' : 'check', section: section || null };
}

export function App() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);

  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.title = route.page === 'how' ? 'How it works · Tipoff' : 'Tipoff · See a job scam’s next move';
    if (route.section) {
      const el = document.getElementById(route.section);
      if (el) {
        el.scrollIntoView({ block: 'start' });
        el.querySelector<HTMLElement>('h2')?.setAttribute('tabindex', '-1');
        el.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
      }
    } else if (!first.current) {
      window.scrollTo(0, 0);
      mainRef.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    }
    first.current = false;
  }, [route]);

  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.querySelector<HTMLElement>('h1')?.focus(); }}>
        Skip to content
      </a>
      <header className="topbar">
        <div className="topbar__inner">
          <a href="#/" className="wordmark" aria-label="Tipoff, home">
            <span className="wordmark__mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h10M4 12h7M4 18h12" />
                <path d="m16 9 4 3-4 3" />
              </svg>
            </span>
            Tipoff
          </a>
          <nav aria-label="Main" className="nav">
            <a href="#/" aria-current={route.page === 'check' ? 'page' : undefined}>
              Check a message
            </a>
            <a href="#/how-it-works" aria-current={route.page === 'how' ? 'page' : undefined}>
              How it works
            </a>
          </nav>
        </div>
      </header>
      <main id="main" ref={mainRef} className="main">
        {route.page === 'how' ? <HowItWorksPage /> : <CheckPage />}
      </main>
      <footer className="footer">
        <div className="footer__inner">
          <p>
            <strong>Tipoff spots patterns. It can’t guarantee a message is safe or a scam.</strong> Verify any job through the company’s official website before you share personal details or money.
          </p>
          <p className="fine">
            Open source (MIT). Not affiliated with the FTC or any employer named in examples. Report job scams at{' '}
            <a href="https://reportfraud.ftc.gov" target="_blank" rel="noopener noreferrer">
              ReportFraud.ftc.gov
            </a>
            .
          </p>
        </div>
      </footer>
    </>
  );
}
