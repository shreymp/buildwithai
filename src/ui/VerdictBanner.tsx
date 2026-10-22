import { forwardRef } from 'react';
import type { Report } from '../engine/types';
import { IconCaution, IconInfo, IconStop } from './icons';

export const VERDICT_LABEL = {
  likely: 'Likely scam',
  closer_look: 'Worth a closer look',
  none: 'No known scam pattern found',
} as const;

const ICONS = { likely: IconStop, closer_look: IconCaution, none: IconInfo };

interface Props {
  report: Report;
}

/** The first thing in the results. Its heading receives focus when results appear. */
export const VerdictBanner = forwardRef<HTMLHeadingElement, Props>(function VerdictBanner({ report }, ref) {
  const Icon = ICONS[report.verdict];
  return (
    <section className={`verdict verdict--${report.verdict}`} aria-labelledby="verdict-title" data-testid="verdict">
      <Icon className="verdict__icon" width={32} height={32} />
      <div className="verdict__body">
        <h2 id="verdict-title" className="verdict__title" tabIndex={-1} ref={ref}>
          <span className="visually-hidden">Verdict: </span>
          {VERDICT_LABEL[report.verdict]}
        </h2>
        <p className="verdict__reason">{report.reason}</p>
        {report.playbookName && report.verdict !== 'none' && (
          <p className="verdict__playbook">
            Script: <strong>{report.playbookName}</strong>
          </p>
        )}
      </div>
    </section>
  );
});
