// analyze(): the whole engine in one call. Parses the paste, finds rule matches on a
// normalized copy of each message, applies legitimate-context dampening, places the
// conversation on a scam script, and builds the report the UI renders.

import { inspect } from './inspect';
import { normalize, toOriginal } from './normalize';
import {
  CAUTION_PLAN, GENERIC_NEXT, GENERIC_STOP, PLAYBOOKS, PLAYBOOK_ORDER, VERIFY_PLAN, replyTemplate, stepCopy,
} from './playbooks';
import { LEGIT_CONTEXT, NEGATION_BEFORE, RULES } from './rules';
import { looksLikeEmailChain, parseThread, withGreetedAsUser } from './thread';
import type {
  AnalyzeOptions, Finding, LegitSignal, Message, NextMove, PlaybookId, Report, Step, StepView, Verdict,
} from './types';

export const MAX_INPUT = 20_000;
export const MIN_WORDS = 8;

const STOPWORDS = new Set(
  'the a an and or to of for in on at is are be you your we our i it this that with from have has will can as by not but if my me us they them their was were do just about what when how there here job work pay no now'.split(' '),
);

/** Very common words in other languages that use the Latin alphabet (Spanish, Portuguese, French, Italian, German, Indonesian). */
const FOREIGN_STOPWORDS = new Set(
  'el la los las que de del y en por para con una un es su al lo como más pero sus le ya o este sí porque esta entre cuando muy sin sobre también usted ustedes trabajo os não você uma com é em ao mais se das dos nas les et des est pour pas du dans il ne ce qui sur avec vous nous sont je une au der die und das ist nicht ich mit sie den zu ein eine auf für dem sich che di il per non sono da gli della yang dan di ini itu untuk dengan saya anda tidak kami'.split(' '),
);

function words(s: string): string[] {
  return s.toLowerCase().match(/[\p{L}']+/gu) ?? [];
}

/**
 * True when the text is mostly not English: mostly non-Latin letters, or clearly more
 * common words from another Latin-alphabet language than from English. Terse English ad
 * copy ("Earn $500 daily. No experience required.") has few common words of either kind,
 * so it stays English.
 */
export function looksNonEnglish(text: string): boolean {
  // Fold "𝗕𝗼𝗹𝗱" and full-width letters to plain ones first.
  const folded = text.normalize('NFKC');
  const letters = folded.match(/\p{L}/gu) ?? [];
  if (letters.length < 20) return false;
  const latin = letters.filter((c) => /[a-z]/i.test(c)).length;
  if (latin / letters.length < 0.6) return true;
  const w = words(folded);
  if (w.length < 12) return false;
  const english = w.filter((x) => STOPWORDS.has(x)).length / w.length;
  const foreign = w.filter((x) => FOREIGN_STOPWORDS.has(x)).length / w.length;
  return foreign >= 0.1 && foreign > english;
}

/** Phrases that contain "not"/"don't" but don't negate what follows. */
const NOT_A_NEGATION = /\b(?:don't|dont|do not|never) (?:forget|hesitate|delay|worry|miss)\b|\bwithout (?:delay|fail)\b|\bnot only\b|\bif not\b/g;

function negatedBefore(norm: string, index: number): boolean {
  const before = norm.slice(Math.max(0, index - 40), index).replace(NOT_A_NEGATION, ' ');
  return NEGATION_BEFORE.test(before);
}

/**
 * Scam warnings ("We will never ask you to pay a training fee, buy from a vendor, or share
 * your bank login") list the very phrases the rules look for. Matches inside such a
 * sentence describe what a scammer would do, so they're ignored.
 */
const WARNING_START = /\b(?:(?:will|would|do|does|shall)\s(?:never|not)|won't|never)(?:,[^,.?!]{0,30},)?\s(?:ask|request|require|charge|contact)\w{0,2}\b|\b(?:beware|be (?:cautious|careful|wary|aware)) of\b|\bwatch out for\b|\b(?:recruitment |recruiting |hiring )?(?:fraud|scam) (?:alert|warning|notice)\b|\bsigns of a scam\b|\bscammers (?:may|might|often|will)\b/g;

function warningSpans(norm: string): [number, number][] {
  const spans: [number, number][] = [];
  WARNING_START.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = WARNING_START.exec(norm))) {
    const rest = norm.slice(m.index, m.index + 300);
    const stop = rest.search(/[.?!](?:\s|$)/);
    spans.push([m.index, m.index + (stop === -1 ? rest.length : stop + 1)]);
  }
  return spans;
}

/** The sentence around [start, end) in normalized text. */
function sentenceAround(norm: string, start: number, end: number): string {
  const from = Math.max(norm.lastIndexOf('.', start - 1), norm.lastIndexOf('?', start - 1), norm.lastIndexOf('!', start - 1)) + 1;
  const after = norm.slice(end).search(/[.?!]/);
  return norm.slice(from, after === -1 ? norm.length : end + after);
}

function findInMessage(message: Message): Finding[] {
  const n = normalize(message.text);
  const warnings = warningSpans(n.norm);
  const found: Finding[] = [];
  for (const rule of RULES) {
    if (rule.needsMessage && !new RegExp(rule.needsMessage.source, rule.needsMessage.flags.replace('g', '')).test(n.norm)) continue;
    for (const pattern of rule.patterns) {
      const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
      let m: RegExpExecArray | null;
      while ((m = re.exec(n.norm))) {
        if (m[0].length === 0) { re.lastIndex++; continue; }
        const mEnd = m.index + m[0].length;
        if (rule.id !== 'secrecy' && negatedBefore(n.norm, m.index)) continue;
        if (warnings.some(([a, b]) => m!.index >= a && m!.index < b)) continue;
        if (rule.unlessSentence && new RegExp(rule.unlessSentence.source, rule.unlessSentence.flags.replace('g', '')).test(sentenceAround(n.norm, m.index, mEnd))) continue;
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
      const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
      let m: RegExpExecArray | null;
      // "There's no need for a video call" is not a sign of a real interview.
      while ((m = re.exec(n.norm)) && ctx.id !== 'safety_warning' && negatedBefore(n.norm, m.index)) if (m[0].length === 0) re.lastIndex++;
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
  // A tie (say, a gift-card payment that fits three scripts equally) names no script.
  if (best && PLAYBOOK_ORDER.filter((p) => scores[p] === scores[best!]).length > 1) best = null;
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
  // Keep the most recent text: the end of a chat, but the top of an email chain.
  if (truncated) input = looksLikeEmailChain(input) ? input.slice(0, MAX_INPUT) : input.slice(input.length - MAX_INPUT);

  if (!input.trim()) return emptyReport('empty', [], false, 'Paste a message to check it.');

  const messages = parseThread(input, options.meSpeakers ?? [], options.themSpeakers ?? []);
  // Nobody marked as "Me": try the guess at who the user is, but keep whichever reading
  // warns more. A wrong guess could otherwise hide the scammer's messages from scoring.
  const guess = options.meSpeakers?.length || options.themSpeakers?.length ? null : withGreetedAsUser(messages);
  if (guess) {
    const guessed = judgeMessages(guess, truncated);
    const plain = judgeMessages(messages, truncated);
    return RANK[plain.verdict] > RANK[guessed.verdict] ? plain : guessed;
  }
  return judgeMessages(messages, truncated);
}

const RANK: Record<Verdict, number> = { none: 0, closer_look: 1, likely: 2 };

function judgeMessages(messages: Message[], truncated: boolean): Report {
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
  const picked = pickPlaybook(active);
  const scores = picked.scores;
  // With no verdict there's no script to name.
  const playbook = verdict === 'none' ? null : picked.playbook;
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
