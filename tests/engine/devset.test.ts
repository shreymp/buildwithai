// Development set: the Phase 1 spike corpus (40 items, model-written). Rules were tuned
// against it after the blind spike run, so it is NOT a measure of accuracy — it is a
// regression guard. Held-out accuracy lives in eval/.
import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/engine/judge';
import devset from '../fixtures/devset.json';
import { asTranscript, toPlaybook, type CorpusItem } from './helpers';

const items = devset as CorpusItem[];

describe('dev set regression', () => {
  const rows = items.map((x) => ({ x, r: analyze(asTranscript(x)) }));
  it('flags at least 18 of 20 scams', () => {
    const misses = rows.filter(({ x, r }) => x.label === 'scam' && r.verdict === 'none').map(({ x }) => x.id);
    expect(misses.length, `missed: ${misses.join(', ')}`).toBeLessThanOrEqual(2);
  });
  it('never calls a legitimate message "likely scam"', () => {
    const bad = rows.filter(({ x, r }) => x.label === 'legit' && r.verdict === 'likely').map(({ x }) => x.id);
    expect(bad).toEqual([]);
  });
  it('flags at most 2 of 20 legitimate messages for a closer look', () => {
    const bad = rows.filter(({ x, r }) => x.label === 'legit' && r.verdict !== 'none').map(({ x, r }) => `${x.id}:${r.findings.map((f) => f.ruleId)}`);
    expect(bad.length, bad.join(' | ')).toBeLessThanOrEqual(2);
  });
  it('names the right playbook for most flagged scams', () => {
    const flagged = rows.filter(({ x, r }) => x.label === 'scam' && r.verdict !== 'none');
    const right = flagged.filter(({ x, r }) => r.playbook === toPlaybook(x.playbook) || r.playbook === null);
    const wrong = flagged.filter(({ x, r }) => r.playbook !== null && r.playbook !== toPlaybook(x.playbook)).map(({ x, r }) => `${x.id}:${x.playbook}->${r.playbook}`);
    expect(wrong, wrong.join(' | ')).toEqual([]);
    expect(right.length).toBe(flagged.length);
  });
});
