// `npm run eval` — scores the engine on the held-out corpus (written by an agent that
// never saw the rules). The first, blind run (v1.0) is kept in src/data/accuracy.json and
// is never overwritten: the corpus results have been seen since, so later runs can't be
// blind. Later runs write src/data/accuracy-rerun.json, which the page labels "not blind".
// Set EVAL_WRITE=0 to print without writing, and EVAL_VERSION to name the version.
import fs from 'node:fs';
import path from 'node:path';
import { expect, it } from 'vitest';
import { analyze } from '../src/engine/judge';
import { asTranscript, toPlaybook, type CorpusItem } from '../tests/engine/helpers';

const PLAYBOOK_NAMES: Record<string, string> = {
  fake_check: 'Fake check', task: 'Pay-to-work tasks', reshipping: 'Reshipping', upfront_fee: 'Pay for the job', identity: 'Identity harvest',
};
const excerpt = (x: CorpusItem) => {
  const t = x.messages.filter((m) => m.from === 'them').map((m) => m.text).join(' ').replace(/\s+/g, ' ');
  return t.length > 180 ? `${t.slice(0, 177)}…` : t;
};

it('held-out evaluation', () => {
  const file = path.resolve(__dirname, 'corpus-heldout.json');
  expect(fs.existsSync(file), 'eval/corpus-heldout.json is missing').toBe(true);
  const items = JSON.parse(fs.readFileSync(file, 'utf8')) as CorpusItem[];
  const scams = items.filter((x) => x.label === 'scam');
  const legit = items.filter((x) => x.label === 'legit');
  const rows = items.map((x) => ({ x, r: analyze(asTranscript(x)) }));

  const caught = rows.filter(({ x, r }) => x.label === 'scam' && r.verdict !== 'none');
  const scamsLikely = rows.filter(({ x, r }) => x.label === 'scam' && r.verdict === 'likely').length;
  const legitFlagged = rows.filter(({ x, r }) => x.label === 'legit' && r.verdict !== 'none');
  const legitLikely = rows.filter(({ x, r }) => x.label === 'legit' && r.verdict === 'likely').length;
  const playbookCorrect = caught.filter(({ x, r }) => r.playbook === toPlaybook(x.playbook)).length;
  const recall = caught.length / scams.length;
  const precision = caught.length / Math.max(1, caught.length + legitFlagged.length);

  const result = {
    measured: true,
    version: process.env.EVAL_VERSION ?? 'unreleased',
    blind: false,
    date: new Date().toISOString().slice(0, 10),
    corpus: {
      name: 'corpus-heldout.json',
      source: 'Written by a separate AI agent that never saw Tipoff’s rules, after the rules were frozen. Scam scripts follow FTC descriptions of real job scams.',
      items: items.length,
      scams: scams.length,
      legit: legit.length,
    },
    scamsCaught: caught.length,
    scamsTotal: scams.length,
    scamsLikely,
    legitFlagged: legitFlagged.length,
    legitLikely,
    legitTotal: legit.length,
    recall: Number(recall.toFixed(3)),
    precision: Number(precision.toFixed(3)),
    playbookCorrect,
    playbookTotal: caught.length,
    misses: rows
      .filter(({ x, r }) => x.label === 'scam' && r.verdict === 'none')
      .map(({ x }) => ({ id: x.id, playbook: PLAYBOOK_NAMES[toPlaybook(x.playbook) ?? ''] ?? x.playbook, excerpt: excerpt(x) })),
    falsePositives: legitFlagged.map(({ x, r }) => ({
      id: x.id,
      verdict: r.verdict === 'likely' ? 'Likely scam' : 'Worth a closer look',
      excerpt: excerpt(x),
      rules: [...new Set(r.findings.filter((f) => !f.dampened).map((f) => f.ruleId))],
    })),
  };

  console.log(JSON.stringify({ ...result, misses: result.misses.length, falsePositives: result.falsePositives.map((f) => `${f.id}:${f.rules}`) }, null, 2));
  if (process.env.EVAL_WRITE !== '0') {
    fs.writeFileSync(path.resolve(__dirname, '../src/data/accuracy-rerun.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
});
