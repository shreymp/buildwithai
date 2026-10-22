import type { Report } from '../engine/types';
import { IconBalance, IconLink } from './icons';

/** Sender and link notes from the inspector. */
export function InspectorNotes({ report }: { report: Report }) {
  if (report.inspector.length === 0) return null;
  return (
    <section className="notes" aria-labelledby="links-title" data-testid="inspector">
      <h2 id="links-title" className="section-title">
        <IconLink width={20} height={20} /> Senders and links
      </h2>
      <ul className="notes__list">
        {report.inspector.map((n) => (
          <li key={`${n.kind}-${n.value}`}>
            <strong>{n.title}</strong>
            <code className="notes__value">{n.value}</code>
            <span className="notes__why">{n.why}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Signals of a normal hiring process, shown for balance. */
export function LegitNotes({ report }: { report: Report }) {
  const unique = report.legitSignals.filter((s, i, all) => all.findIndex((x) => x.id === s.id) === i);
  if (unique.length === 0) return null;
  return (
    <section className="notes notes--legit" aria-labelledby="legit-title" data-testid="legit">
      <h2 id="legit-title" className="section-title">
        <IconBalance width={20} height={20} /> Signs of a normal hiring process
      </h2>
      <ul className="notes__list">
        {unique.map((s) => (
          <li key={s.id}>
            <strong>{s.title}</strong>
            <q className="notes__value">{s.quote}</q>
            <span className="notes__why">{s.why}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
