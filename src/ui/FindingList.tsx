import { useEffect, useRef } from 'react';
import { LEGIT_CONTEXT, RULES } from '../engine/rules';
import { stepCopy } from '../engine/playbooks';
import type { Finding, PlaybookId } from '../engine/types';
import { lowerFirst } from '../lib/text';

interface Props {
  findings: Finding[];
  playbook: PlaybookId | null;
  selectedRule: string | null;
  /** Bumped each time a mark is activated, so re-selecting the same card still scrolls. */
  selectTick: number;
  onShowInMessage: (ruleId: string) => void;
}

interface Group {
  ruleId: string;
  title: string;
  why: string;
  step: number;
  weight: number;
  quotes: string[];
}

function groupByRule(findings: Finding[]): Group[] {
  const map = new Map<string, Group>();
  for (const f of findings) {
    const g = map.get(f.ruleId);
    if (g) {
      if (!g.quotes.includes(f.quote)) g.quotes.push(f.quote);
    } else {
      map.set(f.ruleId, { ruleId: f.ruleId, title: f.title, why: f.why, step: f.step, weight: f.weight, quotes: [f.quote] });
    }
  }
  return [...map.values()].sort((a, b) => a.step - b.step);
}

export function FindingList({ findings, playbook, selectedRule, selectTick, onShowInMessage }: Props) {
  const active = groupByRule(findings.filter((f) => !f.dampened));
  const softened = groupByRule(findings.filter((f) => f.dampened));
  const refs = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    if (!selectedRule || selectTick === 0) return;
    const el = refs.current.get(selectedRule);
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    el.focus({ preventScroll: true });
  }, [selectedRule, selectTick]);

  return (
    <section className="findings" aria-labelledby="findings-title">
      <h2 id="findings-title" className="section-title">
        {active.length === 0 ? 'What Tipoff looked for' : 'Why we flagged this'}
      </h2>
      {active.length === 0 ? (
        <p className="empty-note">No phrases matched Tipoff’s job-scam rules.</p>
      ) : (
        <ul className="cards" data-testid="finding-cards">
          {active.map((g) => {
            const step = stepCopy(g.step as 1, playbook);
            const selected = g.ruleId === selectedRule;
            return (
              <li
                key={g.ruleId}
                id={`card-${g.ruleId}`}
                className={`card card--${g.weight >= 3 ? 'high' : 'medium'}${selected ? ' is-selected' : ''}`}
                tabIndex={-1}
                aria-current={selected ? 'true' : undefined}
                ref={(el) => {
                  if (el) refs.current.set(g.ruleId, el);
                  else refs.current.delete(g.ruleId);
                }}
                data-rule={g.ruleId}
              >
                <p className="card__meta">
                  <span className="card__step">
                    Step {g.step} · {step.label}
                  </span>
                  <span className={`card__strength card__strength--${g.weight >= 3 ? 'high' : 'medium'}`}>{g.weight >= 3 ? 'Strong sign' : g.weight === 2 ? 'Clear sign' : 'Weak sign'}</span>
                </p>
                <h3 className="card__title">{g.title}</h3>
                <ul className="card__quotes">
                  {g.quotes.slice(0, 3).map((q) => (
                    <li key={q}>
                      <q>{q}</q>
                    </li>
                  ))}
                </ul>
                <p className="card__why">{g.why}</p>
                <button type="button" className="link-button card__show" onClick={() => onShowInMessage(g.ruleId)}>
                  Show in message
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {softened.length > 0 && (
        <details className="softened">
          <summary>
            Also noticed, but normal in this context ({softened.length})
          </summary>
          <ul>
            {softened.map((g) => {
              const rule = RULES.find((r) => r.id === g.ruleId);
              const by = LEGIT_CONTEXT.filter((c) => rule?.dampenedBy?.includes(c.id)).map((c) => lowerFirst(c.title));
              return (
                <li key={g.ruleId}>
                  <strong>{g.title}</strong>: <q>{g.quotes[0]}</q>. Softened because the message also {by.length ? `shows: ${by.join(' or ')}` : 'shows normal hiring steps'}.
                </li>
              );
            })}
          </ul>
        </details>
      )}
    </section>
  );
}
