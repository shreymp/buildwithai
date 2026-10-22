import type { Finding, Message } from '../engine/types';

interface Cluster {
  start: number;
  end: number;
  findings: Finding[];
}

/** Merges overlapping findings so every character is wrapped by at most one mark. */
export function clusterFindings(findings: Finding[]): Cluster[] {
  const sorted = [...findings].sort((a, b) => a.start - b.start || b.end - a.end);
  const clusters: Cluster[] = [];
  for (const f of sorted) {
    const last = clusters[clusters.length - 1];
    if (last && f.start < last.end) {
      last.end = Math.max(last.end, f.end);
      last.findings.push(f);
    } else {
      clusters.push({ start: f.start, end: f.end, findings: [f] });
    }
  }
  return clusters;
}

interface Props {
  messages: Message[];
  findings: Finding[];
  selectedRule: string | null;
  onSelect: (ruleId: string) => void;
  /** Speakers that can be toggled between "them" and "me". */
  speakers: string[];
  meSpeakers: string[];
  onToggleMe: (speaker: string) => void;
}

export function MessageView({ messages, findings, selectedRule, onSelect, speakers, meSpeakers, onToggleMe }: Props) {
  const active = findings.filter((f) => !f.dampened);
  return (
    <section className="messages" aria-labelledby="messages-title">
      <div className="messages__head">
        <h2 id="messages-title" className="section-title">
          In the messages
        </h2>
        {active.length > 0 && (
          <p className="messages__hint">
            Tap a highlighted phrase to see why it was flagged. <span className="legend legend--high">Strong sign</span>{' '}
            <span className="legend legend--medium">Clear or weak sign</span>
          </p>
        )}
      </div>

      {speakers.length >= 2 && (
        <fieldset className="speakers">
          <legend className="speakers__legend">Tick the names that are you. Your own messages aren’t scored.</legend>
          <div className="speakers__list">
            {speakers.map((s) => (
              <label key={s} className="speaker-toggle">
                <input type="checkbox" checked={meSpeakers.includes(s)} onChange={() => onToggleMe(s)} />
                <span>{s}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <ol className="thread">
        {messages.map((m) => {
          const own = active.filter((f) => f.messageId === m.id);
          const clusters = clusterFindings(own);
          const parts: React.ReactNode[] = [];
          let pos = 0;
          for (const c of clusters) {
            if (c.start > pos) parts.push(m.text.slice(pos, c.start));
            const high = c.findings.some((f) => f.weight >= 3);
            const rule = c.findings[0].ruleId;
            const titles = [...new Set(c.findings.map((f) => f.title))].join('; ');
            const selected = c.findings.some((f) => f.ruleId === selectedRule);
            parts.push(
              // A <mark> rather than a <button>: buttons lay out as inline blocks, so a long
              // highlight couldn't wrap like the text around it.
              <mark
                key={`${m.id}-${c.start}`}
                role="button"
                tabIndex={0}
                className={`mark mark--${high ? 'high' : 'medium'}${selected ? ' is-selected' : ''}`}
                data-rule={rule}
                data-rules={c.findings.map((f) => f.ruleId).join(' ')}
                aria-pressed={selected}
                aria-label={`“${m.text.slice(c.start, c.end)}”. Flagged: ${titles}. Show explanation.`}
                onClick={() => onSelect(rule)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(rule);
                  }
                }}
              >
                {m.text.slice(c.start, c.end)}
              </mark>,
            );
            pos = c.end;
          }
          if (pos < m.text.length) parts.push(m.text.slice(pos));
          return (
            <li key={m.id} className={`bubble bubble--${m.side}`} data-testid="message">
              <span className="bubble__who">{m.side === 'me' ? (m.speaker && !/^(?:me|you|myself)$/i.test(m.speaker) ? `You (${m.speaker})` : 'You') : m.speaker ?? 'Message'}</span>
              <p className="bubble__text">{parts}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
