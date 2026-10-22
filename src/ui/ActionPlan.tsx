import { useRef, useState } from 'react';
import type { Report } from '../engine/types';
import { IconCheck, IconCopy, IconExternal } from './icons';

export function ActionPlan({ report }: { report: Report }) {
  return (
    <section className="plan" aria-labelledby="plan-title" data-testid="action-plan">
      <h2 id="plan-title" className="section-title">
        What to do now
      </h2>
      <ol className="plan__list">
        {report.plan.map((item) => (
          <li key={item.text}>
            <span>{item.text}</span>
            {item.link && (
              <a className="plan__link" href={item.link.href} target="_blank" rel="noopener noreferrer">
                {item.link.label}
                <IconExternal width={16} height={16} />
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

type CopyState = 'idle' | 'copied' | 'manual';

export function ReplyTemplate({ report }: { report: Report }) {
  const [state, setState] = useState<CopyState>('idle');
  const textRef = useRef<HTMLPreElement>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(report.reply);
      setState('copied');
      window.setTimeout(() => setState('idle'), 2000);
    } catch {
      // Clipboard blocked: select the text so the person can copy it themselves.
      const el = textRef.current;
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      setState('manual');
    }
  }

  return (
    <section className="reply" aria-labelledby="reply-title" data-testid="reply">
      <h2 id="reply-title" className="section-title">
        Ask them to verify
      </h2>
      <p className="reply__intro">A polite reply a real recruiter can answer easily, and a scammer usually can’t.</p>
      <pre className="reply__text" ref={textRef} tabIndex={0} aria-label="Reply text">
        {report.reply}
      </pre>
      <div className="reply__actions">
        <button type="button" className="button button--primary" onClick={copy}>
          {state === 'copied' ? <IconCheck width={20} height={20} /> : <IconCopy width={20} height={20} />}
          {state === 'copied' ? 'Copied' : 'Copy reply'}
        </button>
        <span className="reply__status" role="status" aria-live="polite">
          {state === 'copied' ? 'Reply copied to your clipboard.' : state === 'manual' ? 'Copying isn’t allowed here. The text is selected: press and hold, or use Ctrl/⌘+C.' : ''}
        </span>
      </div>
    </section>
  );
}
