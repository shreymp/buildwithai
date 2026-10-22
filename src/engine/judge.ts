// analyze(): the whole engine in one call. Parses the paste, finds rule matches on a
// normalized copy of each message, applies legitimate-context dampening, places the
// conversation on a scam script, and builds the report the UI renders.

import { inspect } from './inspect';
import { normalize, toOriginal } from './normalize';
import {
  CAUTION_PLAN, GENERIC_NEXT, GENERIC_STOP, PLAYBOOKS, PLAYBOOK_ORDER, VERIFY_PLAN, replyTemplate, stepCopy,
} from './playbooks';
import { LEGIT_CONTEXT, NEGATION_BEFORE, RULES } from './rules';
import { parseThread } from './thread';
import type {
  AnalyzeOptions, Finding, LegitSignal, Message, NextMove, PlaybookId, Report, Step, StepView, Verdict,
} from './types';

export const MAX_INPUT = 20_000;
export const MIN_WORDS = 8;

const STOPWORDS = new Set(
  'the a an and or to of for in on at is are be you your we our i it this that with from have has will can as by not but if my me us they them their was were do just about what when how there here job work pay'.split(' '),
);

function words(s: string): string[] {
  return s.toLowerCase().match(/[\p{L}']+/gu) ?? [];
}

/** True when the text is mostly not English (by script and by common-word share). */
export function looksNonEnglish(text: string): boolean {
  const letters = text.match(/\p{L}/gu) ?? [];
  if (letters.length < 20) return false;
  const latin = letters.filter((c) => /[a-z]/i.test(c)).length;
  if (latin / letters.length < 0.6) return true;
  const w = words(text);
  if (w.length < 12) return false;
  const common = w.filter((x) => STOPWORDS.has(x)).length;
  return common / w.length < 0.08;
}

function findInMessage(message: Message): Finding[] {
  const n = normalize(message.text);
  const found: Finding[] = [];
  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
      let m: RegExpExecArray | null;
      while ((m = re.exec(n.norm))) {
        if (m[0].length === 0) { re.lastIndex++; continue; }
        const before = n.norm.slice(Math.max(0, m.index - 40), m.index);
        if (rule.id !== 'secrecy' && NEGATION_BEFORE.test(before)) continue;
        const [start, end] = toOriginal(n, m.index, m.index + m[0].length);
        found.push({
          id: `${message.id}:${rule.id}:${start}`,
          ruleId: rule.id,
          title: rule.title,
          why: rule.why,
          messageId: message.id,
          start,
          end,
          quote: message.text.slice(start, end),
          step: rule.step,
          playbooks: rule.playbooks,
          weight: rule.weight,
          dampened: false,
        });
      }
    }
  }
  // Drop overlapping matches of the same rule (different patterns hitting the same words).
  found.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept: Finding[] = [];
  for (const f of found) {
    if (kept.some((k) => k.ruleId === f.ruleId && f.start < k.end && k.start < f.end)) continue;
    kept.push(f);
  }
  return kept;
}

function legitInMessage(message: Message): LegitSignal[] {
  const n = normalize(message.text);
  const out: LegitSignal[] = [];
  for (const ctx of LEGIT_CONTEXT) {
    for (const pattern of ctx.patterns) {
      const re = new RegExp(pattern.source, pattern.flags);
      re.lastIndex = 0;
      const m = re.exec(n.norm);
      if (!m) continue;
      const [start, end] = toOriginal(n, m.index, m.index + m[0].length);
      out.push({ id: ctx.id, title: ctx.title, why: ctx.why, messageId: message.id, start, end, quote: message.text.slice(start, end) });
      break;
    }
  }
  return out;
}

function emptyScores(): Record<PlaybookId, number> {
  return { fake_check: 0, task: 0, reshipping: 0, upfront_fee: 0, identity: 0 };
}

function pickPlaybook(active: Finding[]): { playbook: PlaybookId | null; scores: Record<PlaybookId, number> } {
  const scores = emptyScores();
  // Only the setup and the ask (steps 4–5) identify a script; earlier steps are shared.
  for (const f of active) {
    if (f.step < 4) continue;
    for (const p of f.playbooks) scores[p] += f.weight * (f.playbooks.length === 1 ? 2 : 1);
  }
  let best: PlaybookId | null = null;
  for (const p of PLAYBOOK_ORDER) if (scores[p] > 0 && (best === null || scores[p] > scores[best])) best = p;
  return { playbook: best, scores };
}

function verdictFor(active: Finding[]): { verdict: Verdict; score: number; steps: Set<number> } {
  const byRule = new Map<string, Finding>();
  for (const f of active) if (!byRule.has(f.ruleId)) byRule.set(f.ruleId, f);
  const unique = [...byRule.values()];
  const score = unique.reduce((s, f) => s + f.weight, 0);
  const steps = new Set(unique.map((f) => f.step));
  const strong = unique.filter((f) => f.step >= 4 && f.weight >= 3);
  const strongAsk = strong.length > 0;
  let verdict: Verdict = 'none';
  // "Likely scam" needs a money/identity request plus corroboration: another step of the
  // script, or a second, different strong request.
  if ((strongAsk && (steps.size >= 2 || strong.length >= 2) && score >= 5) || (score >= 9 && steps.size >= 3)) verdict = 'likely';
  else if (score >= 3 || strongAsk) verdict = 'closer_look';
  return { verdict, score, steps };
}

function reasonFor(verdict: Verdict, active: Finding[], playbook: PlaybookId | null, steps: Set<number>): string {
  const ruleCount = new Set(active.map((f) => f.ruleId)).size;
  const signs = `${ruleCount} warning sign${ruleCount === 1 ? '' : 's'}`;
  if (verdict === 'likely') {
    const name = playbook ? `the ${PLAYBOOKS[playbook].name.toLowerCase()} job scam` : 'a known job-scam script';
    return `This follows ${name}: ${signs} across ${steps.size} steps of the script, including a request that puts your money or identity at risk.`;
  }
  if (verdict === 'closer_look') {
    return playbook
      ? `${signs} that match the start of the ${PLAYBOOKS[playbook].name.toLowerCase()} script, but not the full pattern yet.`
      : `${signs} common in job scams, but not enough to match a full script yet.`;
  }
  if (ruleCount > 0) return 'Only weak signs matched. These are common in real job messages too, so verify the basics below.';
  return 'None of Tipoff’s job-scam patterns matched this text. That isn’t proof it’s safe: scammers change their wording.';
}

function nextMoveFor(verdict: Verdict, currentStep: number, playbook: PlaybookId | null): NextMove | null {
  if (verdict === 'none' || currentStep === 0) return null;
  if (currentStep === 5) return playbook ? PLAYBOOKS[playbook].stop : GENERIC_STOP;
  const key = currentStep as 1 | 2 | 3 | 4;
  return playbook ? PLAYBOOKS[playbook].next[key] : GENERIC_NEXT[key];
}

function emptyReport(status: Report['status'], messages: Message[], truncated: boolean, reason: string): Report {
  return {
    status, verdict: 'none', reason, playbook: null, playbookName: null, playbookScores: emptyScores(), currentStep: 0,
    steps: [], nextMove: null, findings: [], legitSignals: [], inspector: [], plan: [], reply: replyTemplate(null), messages, truncated, score: 0,
  };
}

export function analyze(rawInput: string, options: AnalyzeOptions = {}): Report {
  let input = rawInput ?? '';
  const truncated = input.length > MAX_INPUT;
  if (truncated) input = input.slice(input.length - MAX_INPUT);

  if (!input.trim()) return emptyReport('empty', [], false, 'Paste a message to check it.');

  const messages = parseThread(input, options.meSpeakers ?? []);
  const theirs = messages.filter((m) => m.side === 'them');
  const theirText = theirs.map((m) => m.text).join('\n');

  if (words(theirText).length < MIN_WORDS) {
    return emptyReport('too_short', messages, truncated, 'There isn’t enough here to go on. Paste the whole message, and earlier messages if you have them.');
  }
  if (looksNonEnglish(theirText)) {
    return emptyReport('not_english', messages, truncated, 'Tipoff only reads English job messages for now.');
  }

  const findings = theirs.flatMap(findInMessage);
  const legitSignals = theirs.flatMap(legitInMessage);
  const legitIds = new Set(legitSignals.map((l) => l.id));
  for (const f of findings) {
    const rule = RULES.find((r) => r.id === f.ruleId);
    if (rule?.dampenedBy?.some((id) => legitIds.has(id))) f.dampened = true;
  }
  const order = new Map(messages.map((m, i) => [m.id, i]));
  findings.sort((a, b) => (order.get(a.messageId)! - order.get(b.messageId)!) || a.start - b.start);

  const active = findings.filter((f) => !f.dampened);
  const { verdict, score, steps } = verdictFor(active);
  const { playbook, scores } = pickPlaybook(active);
  const currentStep = (active.length ? Math.max(...active.map((f) => f.step)) : 0) as 0 | Step;

  const stepViews: StepView[] = ([1, 2, 3, 4, 5] as Step[]).map((s) => ({ step: s, ...stepCopy(s, playbook), seen: steps.has(s) }));
  const plan = verdict === 'none' ? VERIFY_PLAN : playbook ? PLAYBOOKS[playbook].plan : CAUTION_PLAN;

  return {
    status: 'ok',
    verdict,
    reason: reasonFor(verdict, active, playbook, steps),
    playbook,
    playbookName: playbook ? PLAYBOOKS[playbook].name : null,
    playbookScores: scores,
    currentStep,
    steps: stepViews,
    nextMove: nextMoveFor(verdict, currentStep, playbook),
    findings,
    legitSignals,
    inspector: inspect(messages),
    plan,
    reply: replyTemplate(playbook),
    messages,
    truncated,
    score,
  };
}
