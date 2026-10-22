import type { Report } from '../engine/types';
import { lowerFirst } from '../lib/text';
import { IconArrowRight } from './icons';

interface Props {
  report: Report;
}

function stateOf(step: number, current: number, seen: boolean): 'here' | 'next' | 'seen' | 'past' | 'ahead' {
  if (step === current) return 'here';
  if (step === current + 1) return 'next';
  if (step < current) return seen ? 'seen' : 'past';
  return 'ahead';
}

const STATE_TEXT = {
  here: 'You are here',
  next: 'Likely next',
  seen: 'Happened',
  past: 'Not seen',
  ahead: '',
};

/** The scam's script as a process list: where this conversation sits, and what comes next. */
export function ScriptTimeline({ report }: Props) {
  const current = report.currentStep;
  return (
    <section className="script" aria-labelledby="script-title" data-testid="timeline">
      <div className="script__head">
        <h2 id="script-title" className="section-title">
          The script
        </h2>
        <p className="script__sub">
          {report.playbookName ? (
            <>
              Matches the <strong>{lowerFirst(report.playbookName)}</strong> job scam.
            </>
          ) : (
            'The opening moves are shared by most job scams. The later steps depend on which script they’re running.'
          )}
        </p>
      </div>
      <ol className="script__steps">
        {report.steps.map((s) => {
          const state = stateOf(s.step, current, s.seen);
          return (
            <li
              key={s.step}
              className={`step step--${state}`}
              aria-current={state === 'here' ? 'step' : undefined}
              data-step={s.step}
            >
              <span className="step__num" aria-hidden="true">
                {s.step}
              </span>
              <span className="step__text">
                <span className="step__label">{s.label}</span>
                <span className="step__detail">{s.detail}</span>
                {STATE_TEXT[state] && <span className="step__state">{STATE_TEXT[state]}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      {report.steps.some((s) => stateOf(s.step, current, s.seen) === 'past') && (
        <p className="script__note">“Not seen” steps weren’t in what you pasted. Scams can skip steps, or they happened somewhere else.</p>
      )}
    </section>
  );
}

export function NextMoveCard({ report }: Props) {
  const move = report.nextMove;
  if (!move) return null;
  const final = report.currentStep === 5;
  return (
    <section className={`next ${final ? 'next--final' : ''}`} aria-labelledby="next-title" data-testid="next-move">
      <p className="next__eyebrow">{final ? 'Where this ends' : 'What they’ll likely do next'}</p>
      <h2 id="next-title" className="next__title">
        {!final && <IconArrowRight className="next__icon" width={22} height={22} />}
        {move.title}
      </h2>
      <p className="next__body">{move.body}</p>
      <p className="next__dont">
        <strong>Instead: </strong>
        {move.dont}
      </p>
    </section>
  );
}
