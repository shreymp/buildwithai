import accuracyData from '../data/accuracy.json';
import { PLAYBOOKS, PLAYBOOK_ORDER, SHARED_STEPS, SOURCES } from '../engine/playbooks';
import { LEGIT_CONTEXT, RULES } from '../engine/rules';
import { lowerFirst } from '../lib/text';
import { IconExternal } from './icons';

export interface Accuracy {
  measured: boolean;
  date?: string;
  corpus?: { name: string; source: string; items: number; scams: number; legit: number };
  scamsCaught?: number;
  scamsTotal?: number;
  scamsLikely?: number;
  legitFlagged?: number;
  legitLikely?: number;
  legitTotal?: number;
  recall?: number;
  precision?: number;
  playbookCorrect?: number;
  playbookTotal?: number;
  misses?: { id: string; playbook: string; excerpt: string }[];
  falsePositives?: { id: string; verdict: string; excerpt: string; rules: string[] }[];
}

const accuracy = accuracyData as Accuracy;
const pct = (n: number) => `${Math.round(n * 100)}%`;

const STEP_NAMES: Record<number, string> = { 1: SHARED_STEPS[1].label, 2: SHARED_STEPS[2].label, 3: SHARED_STEPS[3].label, 4: 'The setup', 5: 'The ask' };

export function HowItWorksPage() {
  return (
    <article className="doc">
      <header className="doc__header">
        <h1 className="page-title">How Tipoff works</h1>
        <p className="lede">
          Tipoff reads a message with a small set of plain rules written from the FTC’s public descriptions of job scams. Every rule is listed below, with what it looks for and why it matters. Nothing is hidden, and nothing leaves your device.
        </p>
        <nav aria-label="On this page" className="toc">
          <a href="#/how-it-works/scripts">The five scripts</a>
          <a href="#/how-it-works/verdict">How the verdict is decided</a>
          <a href="#/how-it-works/accuracy">How accurate it is</a>
          <a href="#/how-it-works/rules">Every rule</a>
          <a href="#/how-it-works/privacy">Privacy</a>
          <a href="#/how-it-works/limits">Limits</a>
          <a href="#/how-it-works/sources">Sources</a>
        </nav>
      </header>

      <section id="scripts" aria-labelledby="scripts-title">
        <h2 id="scripts-title">The five scripts</h2>
        <p>
          Job scams open the same way, with an unexpected offer, a move to a chat app and a fast “hire”, then branch into one of these scripts. Tipoff places a conversation on its script and tells you the next step.
        </p>
        <div className="playbooks">
          {PLAYBOOK_ORDER.map((id) => {
            const p = PLAYBOOKS[id];
            return (
              <section key={id} className="playbook" aria-labelledby={`pb-${id}`}>
                <h3 id={`pb-${id}`}>{p.name}</h3>
                <p>{p.summary}</p>
                <ol className="playbook__steps">
                  <li>{SHARED_STEPS[1].label}</li>
                  <li>{SHARED_STEPS[2].label}</li>
                  <li>{SHARED_STEPS[3].label}</li>
                  <li>
                    <strong>{p.steps[4].label}</strong>
                  </li>
                  <li>
                    <strong>{p.steps[5].label}</strong>
                  </li>
                </ol>
                <a href={p.source.href} target="_blank" rel="noopener noreferrer" className="source-link">
                  {p.source.label} <IconExternal width={14} height={14} />
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </section>
            );
          })}
        </div>
      </section>

      <section id="verdict" aria-labelledby="verdict-rules-title">
        <h2 id="verdict-rules-title">How the verdict is decided</h2>
        <ul className="plain-list">
          <li>
            <strong>Likely scam</strong>: a request for money, identity documents or account access (step 4 or 5), backed up by evidence from another step of the script or a second, different request.
          </li>
          <li>
            <strong>Worth a closer look</strong>: several warning signs, or one strong one, but not a full script.
          </li>
          <li>
            <strong>No known scam pattern found</strong>: nothing, or only weak signs that also appear in real job messages. This never means “safe”: scammers change their wording, so Tipoff always lists what to verify.
          </li>
          <li>
            Signs of a normal hiring process (a video interview, an HR portal like Workday, the employer paying for equipment) soften related rules. The softened rules are still shown, so you can judge for yourself.
          </li>
          <li>Your own messages are never scored. Only messages from the other person count.</li>
          <li>Before matching, Tipoff undoes common tricks: look-alike letters from other alphabets, “t e l e g r a m”, “tra1ning”, hidden characters and curly quotes. Highlights still point at exactly what you pasted.</li>
        </ul>
      </section>

      <section id="accuracy" aria-labelledby="accuracy-title" data-testid="accuracy">
        <h2 id="accuracy-title">How accurate it is</h2>
        {accuracy.measured && accuracy.corpus ? (
          <>
            <div className="stats">
              <p className="stat">
                <span className="stat__value">
                  {accuracy.scamsCaught} of {accuracy.scamsTotal}
                </span>
                <span className="stat__label">test scams flagged ({pct(accuracy.recall ?? 0)})</span>
              </p>
              <p className="stat">
                <span className="stat__value">
                  {accuracy.legitFlagged} of {accuracy.legitTotal}
                </span>
                <span className="stat__label">genuine messages flagged by mistake</span>
              </p>
              <p className="stat">
                <span className="stat__value">
                  {accuracy.legitLikely} of {accuracy.legitTotal}
                </span>
                <span className="stat__label">genuine messages called “likely scam”</span>
              </p>
              <p className="stat">
                <span className="stat__value">
                  {accuracy.playbookCorrect} of {accuracy.playbookTotal}
                </span>
                <span className="stat__label">flagged scams matched to the right script</span>
              </p>
            </div>
            <p>
              <strong>What this test is:</strong> {accuracy.corpus.source} {accuracy.corpus.items} items: {accuracy.corpus.scams} scams and {accuracy.corpus.legit} genuine recruiter messages chosen to be tricky (salary talk, onboarding paperwork, WhatsApp scheduling, employer-paid background checks). Measured {accuracy.date}.
            </p>
            <p>
              <strong>What it isn’t:</strong> a measure of real-world accuracy. The messages are synthetic. Real scams use wording these rules haven’t seen, which is why Tipoff never says a message is safe.
            </p>
            {accuracy.misses && accuracy.misses.length > 0 && (
              <div className="misses">
                <h3>Scams it missed in the test</h3>
                <ul>
                  {accuracy.misses.map((m) => (
                    <li key={m.id}>
                      <span className="misses__pb">{m.playbook}</span> <q>{m.excerpt}</q>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {accuracy.falsePositives && accuracy.falsePositives.length > 0 && (
              <div className="misses">
                <h3>Genuine messages it flagged by mistake</h3>
                <ul>
                  {accuracy.falsePositives.map((m) => (
                    <li key={m.id}>
                      <span className="misses__pb">{m.verdict}</span> <q>{m.excerpt}</q>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p>Accuracy hasn’t been measured for this version yet.</p>
        )}
      </section>

      <section id="rules" aria-labelledby="rules-title">
        <h2 id="rules-title">
          Every rule <span className="count">({RULES.length})</span>
        </h2>
        {[1, 2, 3, 4, 5].map((step) => (
          <section key={step} aria-labelledby={`rules-step-${step}`} className="rule-group">
            <h3 id={`rules-step-${step}`}>
              Step {step}: {STEP_NAMES[step]}
            </h3>
            <ul className="rules">
              {RULES.filter((r) => r.step === step).map((r) => (
                <li key={r.id} className="rule" data-testid="rule">
                  <p className="rule__title">
                    <strong>{r.title}</strong>
                    <span className="rule__weight">{r.weight >= 3 ? 'Strong sign' : r.weight === 2 ? 'Clear sign' : 'Weak sign'}</span>
                  </p>
                  <p className="rule__why">{r.why}</p>
                  <p className="rule__meta">
                    Points to: {r.playbooks.length === 5 ? 'all scripts' : r.playbooks.map((p) => lowerFirst(PLAYBOOKS[p].name)).join(', ')}
                    {r.dampenedBy && (
                      <>
                        {' '}
                        · Softened by: {LEGIT_CONTEXT.filter((c) => r.dampenedBy!.includes(c.id)).map((c) => lowerFirst(c.title)).join('; ')}
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </section>

      <section id="privacy" aria-labelledby="privacy-title">
        <h2 id="privacy-title">Privacy</h2>
        <p>
          Tipoff is a static web page. Checking happens in your browser, in a background worker. The page makes no network requests after it loads: no server, no analytics, no AI service. Nothing is saved, so closing or reloading the page clears everything. An automated test confirms that no request leaves the page while a message is checked.
        </p>
      </section>

      <section id="limits" aria-labelledby="limits-title">
        <h2 id="limits-title">Limits</h2>
        <ul className="plain-list">
          <li>English job messages only.</li>
          <li>It reads patterns in the text. It can’t tell whether a named company is real, and it never accuses a company.</li>
          <li>Fixed rules miss new wording. A clean result isn’t a guarantee.</li>
          <li>It doesn’t read screenshots yet. Copy the text instead.</li>
          <li>The script steps and next moves are written from public FTC descriptions, not learned from real conversations.</li>
        </ul>
      </section>

      <section id="sources" aria-labelledby="sources-title">
        <h2 id="sources-title">Sources and where to report</h2>
        <ul className="plain-list">
          {Object.values(SOURCES).map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer">
                {s.label} <IconExternal width={14} height={14} />
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="fine">
          Losses reported to the FTC from job and employment-agency scams rose from $90 million in 2020 to $501 million in 2024 (FTC, March 2025). Tipoff isn’t affiliated with the FTC or any government agency.
        </p>
      </section>
    </article>
  );
}
