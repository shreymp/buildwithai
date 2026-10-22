import { lowerFirst } from '../lib/text';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SAMPLES, sampleText, type Sample } from '../data/samples';
import { MAX_INPUT } from '../engine/judge';
import { SHARED_STEPS, GENERIC_LATE_STEPS, PLAYBOOKS, PLAYBOOK_ORDER } from '../engine/playbooks';
import { speakersOf } from '../engine/thread';
import type { Report } from '../engine/types';
import { runCheck } from '../lib/runCheck';
import { ActionPlan, ReplyTemplate } from './ActionPlan';
import { FindingList } from './FindingList';
import { IconClipboard, IconLock, IconNext } from './icons';
import { MessageView } from './MessageView';
import { InspectorNotes, LegitNotes } from './Notes';
import { NextMoveCard, ScriptTimeline } from './ScriptTimeline';
import { VerdictBanner } from './VerdictBanner';

type Phase = 'idle' | 'checking' | 'done' | 'error';

type Overrides = Record<string, 'me' | 'them'>;

const optionsFor = (o: Overrides) => ({
  meSpeakers: Object.keys(o).filter((k) => o[k] === 'me'),
  themSpeakers: Object.keys(o).filter((k) => o[k] === 'them'),
});

interface Replay {
  sample: Sample;
  shown: number;
}

export function CheckPage() {
  const [text, setText] = useState('');
  const [overrides, setOverrides] = useState<Overrides>({});
  const [report, setReport] = useState<Report | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [slow, setSlow] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [pasteHint, setPasteHint] = useState(false);
  const [replay, setReplay] = useState<Replay | null>(null);
  const [example, setExample] = useState<Sample | null>(null);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [selectTick, setSelectTick] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const verdictRef = useRef<HTMLHeadingElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);
  const focusAfter = useRef(false);

  const check = useCallback(async (value: string, o: Overrides, opts: { focus?: boolean } = {}) => {
    if (!value.trim()) {
      setInputError('Paste a message to check it.');
      setReport(null);
      setPhase('idle');
      textareaRef.current?.focus();
      return;
    }
    setInputError(null);
    const id = ++requestRef.current;
    setPhase('checking');
    const slowTimer = window.setTimeout(() => setSlow(true), 150);
    try {
      const r = await runCheck(value, optionsFor(o));
      if (id !== requestRef.current) return;
      setReport(r);
      setPhase('done');
      setSelectedRule(null);
      focusAfter.current = opts.focus !== false;
    } catch {
      if (id !== requestRef.current) return;
      setPhase('error');
      focusAfter.current = true;
    } finally {
      window.clearTimeout(slowTimer);
      if (id === requestRef.current) setSlow(false);
    }
  }, []);

  // Move focus to the verdict (or the notice) once results render.
  useEffect(() => {
    if (!focusAfter.current) return;
    focusAfter.current = false;
    const target = report?.status === 'ok' && phase === 'done' ? verdictRef.current : noticeRef.current;
    target?.focus();
  }, [report, phase]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void check(text, overrides);
  }

  function onTextChange(value: string) {
    setText(value);
    setReplay(null);
    setExample(null);
    if (inputError && value.trim()) setInputError(null);
  }

  function loadSample(s: Sample) {
    setOverrides({});
    setExample(s);
    if (s.lines.length > 1) {
      setReplay({ sample: s, shown: 1 });
      const t = sampleText(s, 1);
      setText(t);
      void check(t, {});
    } else {
      setReplay(null);
      const t = sampleText(s);
      setText(t);
      void check(t, {});
    }
  }

  function showNext() {
    if (!replay) return;
    const shown = Math.min(replay.shown + 1, replay.sample.lines.length);
    setReplay({ ...replay, shown });
    const t = sampleText(replay.sample, shown);
    setText(t);
    void check(t, overrides, { focus: false });
  }

  function showAll() {
    if (!replay) return;
    const shown = replay.sample.lines.length;
    setReplay({ ...replay, shown });
    const t = sampleText(replay.sample, shown);
    setText(t);
    void check(t, overrides, { focus: false });
  }

  async function paste() {
    setPasteHint(false);
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip.trim()) throw new Error('empty');
      onTextChange(clip);
      void check(clip, overrides);
    } catch {
      setPasteHint(true);
      textareaRef.current?.focus();
    }
  }

  function clear() {
    onTextChange('');
    setReport(null);
    setPhase('idle');
    setOverrides({});
    setInputError(null);
    textareaRef.current?.focus();
  }

  function toggleMe(speaker: string) {
    const isMe = report?.messages.some((m) => m.speaker === speaker && m.side === 'me') ?? false;
    const next: Overrides = { ...overrides, [speaker]: isMe ? 'them' : 'me' };
    setOverrides(next);
    void check(text, next, { focus: false });
  }

  function selectRule(ruleId: string) {
    setSelectedRule(ruleId);
    setSelectTick((t) => t + 1);
  }

  function showInMessage(ruleId: string) {
    setSelectedRule(ruleId);
    const mark = document.querySelector<HTMLButtonElement>(`.mark[data-rules~="${ruleId}"]`);
    if (mark) {
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      mark.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      mark.focus({ preventScroll: true });
    }
  }

  const speakers = report ? speakersOf(report.messages) : [];
  const ok = phase === 'done' && report?.status === 'ok';

  return (
    <div className={`check${phase !== 'idle' || report ? ' has-results' : ''}`}>
      <section className="check__input" aria-labelledby="page-title">
        <h1 id="page-title" className="page-title">
          See a job scam’s next move before it happens
        </h1>
        <p className="lede">
          Paste a recruiter’s text, DM or email, or the whole conversation. Tipoff shows which job-scam script it follows, where you are in it, and what they’ll likely ask next.
        </p>

        <form onSubmit={onSubmit} noValidate>
          <label htmlFor="message" className="field-label">
            Message or conversation
          </label>
          <p id="message-hint" className="field-hint">
            <IconLock width={16} height={16} /> Checked on your device. Nothing you paste is sent anywhere.
          </p>
          {inputError && (
            <p id="message-error" className="field-error">
              <span className="visually-hidden">Error: </span>
              {inputError}
            </p>
          )}
          <textarea
            id="message"
            ref={textareaRef}
            className={`textarea${inputError ? ' has-error' : ''}`}
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void check(text, overrides);
              }
            }}
            aria-describedby={`message-hint${inputError ? ' message-error' : ''}${pasteHint ? ' paste-hint' : ''}`}
            aria-invalid={inputError ? true : undefined}
            rows={8}
            spellCheck={false}
            data-testid="input"
          />
          {text.length > MAX_INPUT && (
            <p className="field-hint">That’s long. Tipoff will read the most recent {MAX_INPUT.toLocaleString()} characters.</p>
          )}
          {pasteHint && (
            <p id="paste-hint" className="field-hint" role="status">
              Your browser didn’t allow reading the clipboard. Press and hold in the box and choose Paste, or use Ctrl/⌘+V.
            </p>
          )}
          <div className="actions">
            <button type="submit" className="button button--primary button--lg" aria-busy={phase === 'checking' && slow} data-testid="check">
              {phase === 'checking' && slow ? 'Checking…' : 'Check message'}
            </button>
            <button type="button" className="button button--secondary" onClick={paste}>
              <IconClipboard width={20} height={20} /> Paste
            </button>
            {text && (
              <button type="button" className="button button--quiet" onClick={clear}>
                Clear
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="samples check__samples" aria-labelledby="samples-title">
          <h2 className="samples__title" id="samples-title">
            No message handy? Try an example
          </h2>
          <ul className="samples__list" aria-labelledby="samples-title">
            {SAMPLES.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`chip${example?.id === s.id ? ' is-active' : ''}`}
                  onClick={() => loadSample(s)}
                  aria-pressed={example?.id === s.id}
                  data-sample={s.id}
                >
                  <span className="chip__label">{s.label}</span>
                  <span className="chip__note">{s.note}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="samples__fine">Examples are fictional, written from the FTC’s descriptions of real job scams.</p>
      </section>

      <div className="check__results" aria-live="off">
        {phase === 'idle' && !report && <EmptyPreview />}

        {example && (phase === 'done' || phase === 'checking') && (
          <div className="example-banner" data-testid="example-banner">
            <p>
              <strong>Example:</strong> {example.label}. {example.kind === 'scam' ? 'A fictional scam.' : 'A fictional genuine message.'}
            </p>
            {replay && replay.sample.lines.length > 1 && (
              <div className="replay">
                <span className="replay__count" aria-live="polite">
                  Message {replay.shown} of {replay.sample.lines.length}
                </span>
                {replay.shown < replay.sample.lines.length ? (
                  <>
                    <button type="button" className="button button--primary" onClick={showNext} data-testid="next-message">
                      <IconNext width={18} height={18} /> Show the next message
                    </button>
                    <button type="button" className="link-button" onClick={showAll}>
                      Show all
                    </button>
                  </>
                ) : (
                  <span className="replay__done">Whole conversation shown</span>
                )}
              </div>
            )}
          </div>
        )}

        {phase === 'error' && (
          <div className="notice notice--error" role="alert" tabIndex={-1} ref={noticeRef} data-testid="error">
            <h2 className="notice__title">Something went wrong reading this message</h2>
            <p>Your text wasn’t sent anywhere. Try again, or check a shorter part of the conversation.</p>
            <button type="button" className="button button--secondary" onClick={() => check(text, overrides)}>
              Try again
            </button>
          </div>
        )}

        {phase === 'done' && report && report.status !== 'ok' && (
          <div className="notice" role="status" tabIndex={-1} ref={noticeRef} data-testid="notice">
            <h2 className="notice__title">{report.status === 'not_english' ? 'Tipoff reads English job messages' : 'Not enough to go on'}</h2>
            <p>{report.reason}</p>
          </div>
        )}

        {ok && report && (
          <div className="results" data-testid="results">
            {report.truncated && <p className="field-hint">This was long, so Tipoff read the most recent {MAX_INPUT.toLocaleString()} characters.</p>}
            <VerdictBanner report={report} ref={verdictRef} />
            {report.currentStep > 0 && report.verdict !== 'none' && (
              <div className="hero">
                <ScriptTimeline report={report} />
                <NextMoveCard report={report} />
              </div>
            )}
            <MessageView
              messages={report.messages}
              findings={report.findings}
              selectedRule={selectedRule}
              onSelect={selectRule}
              speakers={speakers}
              meSpeakers={speakers.filter((sp) => report.messages.some((m) => m.speaker === sp && m.side === 'me'))}
              onToggleMe={toggleMe}
            />
            <FindingList findings={report.findings} playbook={report.playbook} selectedRule={selectedRule} selectTick={selectTick} onShowInMessage={showInMessage} />
            <div className="act">
              <ActionPlan report={report} />
              <ReplyTemplate report={report} />
            </div>
            <InspectorNotes report={report} />
            <LegitNotes report={report} />
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyPreview() {
  return (
    <section className="preview" aria-labelledby="preview-title">
      <h2 id="preview-title" className="section-title">
        Job scams follow a script
      </h2>
      <p className="preview__lede">Most job scams run through the same five moves. Tipoff finds where your conversation is, so you can stop before the step that costs you.</p>
      <ol className="preview__steps">
        {([1, 2, 3] as const).map((s) => (
          <li key={s}>
            <span className="step__num" aria-hidden="true">{s}</span>
            <span>
              <strong>{SHARED_STEPS[s].label}</strong> {SHARED_STEPS[s].detail}
            </span>
          </li>
        ))}
        {([4, 5] as const).map((s) => (
          <li key={s}>
            <span className="step__num" aria-hidden="true">{s}</span>
            <span>
              <strong>{GENERIC_LATE_STEPS[s].label}</strong> {GENERIC_LATE_STEPS[s].detail}
            </span>
          </li>
        ))}
      </ol>
      <p className="preview__scripts">
        Scripts it knows: {PLAYBOOK_ORDER.map((id) => lowerFirst(PLAYBOOKS[id].name)).join(', ')}.
      </p>
    </section>
  );
}
