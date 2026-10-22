// Splits pasted text into messages. Recognizes WhatsApp exports (iOS and Android) and
// "Name: text" chat transcripts; anything else is treated as a single message.

import type { Message, Side } from './types';

const DATE = String.raw`\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{1,4}`;
const TIME = String.raw`\d{1,2}[:.]\d{2}(?:[:.]\d{2})?(?:\s?[ap]\.?\s?m\.?)?`;
const MARKS = '[\\u200e\\u200f\\u202a-\\u202e]*';
// [10/18/26, 7:42:10 PM] Name: text
const IOS = new RegExp(`^${MARKS}\\[${DATE},?\\s{1,3}${TIME}\\]\\s{0,3}([^:\\n]{1,40}?):\\s?(.*)$`, 'i');
// 10/18/26, 7:42 PM - Name: text
const ANDROID = new RegExp(`^${MARKS}${DATE},?\\s{1,3}${TIME}\\s{1,3}[-–]\\s{1,3}([^:\\n]{1,40}?):\\s?(.*)$`, 'i');
// Name: text
const NAMED = /^([A-Za-z][A-Za-z .'’-]{0,29}):\s+(\S.*)$/;

/** Words that look like "Label:" lines in job posts rather than speaker names. */
const LABELS = new Set([
  'salary', 'pay', 'rate', 'wage', 'wages', 'note', 'notes', 'nb', 'ps', 'p.s', 'requirements', 'requirement', 'location', 'position', 'role',
  'job', 'job title', 'title', 'email', 'e-mail', 'phone', 'tel', 'mobile', 'subject', 'from', 'to', 'cc', 'date', 'time', 'hours', 'schedule',
  'benefits', 'responsibilities', 'duties', 'company', 'website', 'web', 'address', 'contact', 'start date', 're', 'fwd', 'fw', 'telegram',
  'whatsapp', 'signal', 'skype', 'link', 'url', 'qualifications', 'experience', 'description', 'job description', 'compensation', 'type',
  'employment type', 'department', 'interview', 'deadline', 'step', 'warning', 'important', 'reminder', 'update', 'details', 'summary',
  'question', 'answer', 'q', 'a', 'tip', 'reference', 'ref', 'id', 'username', 'handle', 'payment', 'amount', 'total', 'bonus', 'shift',
]);

const ME_NAMES = /^(?:me|you|myself|i)$/i;

interface Line { text: string; start: number }

function splitLines(input: string): Line[] {
  const lines: Line[] = [];
  let pos = 0;
  for (const raw of input.split('\n')) {
    lines.push({ text: raw.replace(/\r$/, ''), start: pos });
    pos += raw.length + 1;
  }
  return lines;
}

function cleanName(name: string): string {
  return name.replace(/[‎‏‪-‮]/g, '').replace(/\s+/g, ' ').trim();
}

function looksLikeName(name: string): boolean {
  const n = cleanName(name);
  if (!n || n.length > 30 || /\d/.test(n)) return false;
  if (LABELS.has(n.toLowerCase())) return false;
  if (n.split(' ').length > 4) return false;
  return /^[A-Z]/.test(n) || ME_NAMES.test(n);
}

type Matcher = (line: string) => { name: string; text: string; offset: number } | null;

function matcherFor(re: RegExp): Matcher {
  return (line) => {
    const m = re.exec(line);
    if (!m) return null;
    const text = m[2];
    return { name: cleanName(m[1]), text, offset: line.length - text.length };
  };
}

function build(input: string, lines: Line[], match: Matcher, meSpeakers: Set<string>, themSpeakers: Set<string>): Message[] {
  const out: Message[] = [];
  for (const line of lines) {
    const hit = match(line.text);
    if (hit) {
      const side: Side = meSpeakers.has(hit.name) || (ME_NAMES.test(hit.name) && !themSpeakers.has(hit.name)) ? 'me' : 'them';
      const start = line.start + hit.offset;
      out.push({ id: `m${out.length + 1}`, speaker: hit.name, side, text: hit.text, start, end: start + hit.text.length });
    } else if (out.length && line.text.trim()) {
      // Continuation of the previous message (multi-line message in an export).
      const prev = out[out.length - 1];
      prev.end = line.start + line.text.length;
      prev.text = input.slice(prev.start, prev.end);
    }
  }
  return out.filter((m) => m.text.trim().length > 0);
}

export function parseThread(input: string, meSpeakerList: string[] = [], themSpeakerList: string[] = []): Message[] {
  const meSpeakers = new Set(meSpeakerList);
  const themSpeakers = new Set(themSpeakerList);
  const lines = splitLines(input);
  const nonEmpty = lines.filter((l) => l.text.trim());

  for (const re of [IOS, ANDROID]) {
    const hits = nonEmpty.filter((l) => re.test(l.text)).length;
    if (hits >= 1 && hits >= nonEmpty.length * 0.3) return build(input, lines, matcherFor(re), meSpeakers, themSpeakers);
  }

  // "Name: text" transcripts: need two or more such lines, and a repeated or alternating speaker.
  const named = nonEmpty.map((l) => NAMED.exec(l.text)).filter((m): m is RegExpExecArray => !!m && looksLikeName(m[1]));
  if (named.length >= 2) {
    const counts = new Map<string, number>();
    for (const m of named) counts.set(cleanName(m[1]), (counts.get(cleanName(m[1])) ?? 0) + 1);
    const repeated = [...counts.values()].some((c) => c >= 2);
    if (repeated || counts.size >= 2) {
      const match: Matcher = (line) => {
        const m = NAMED.exec(line);
        if (!m || !looksLikeName(m[1]) || !counts.has(cleanName(m[1]))) return null;
        return { name: cleanName(m[1]), text: m[2], offset: line.length - m[2].length };
      };
      return build(input, lines, match, meSpeakers, themSpeakers);
    }
  }

  // One "Name: long message" line (a single forwarded chat message).
  if (nonEmpty.length >= 1 && named.length === 1 && NAMED.exec(nonEmpty[0].text) && named[0][2].split(/\s+/).length >= 6) {
    const name = cleanName(named[0][1]);
    const match: Matcher = (line) => {
      const m = NAMED.exec(line);
      if (!m || cleanName(m[1]) !== name) return null;
      return { name, text: m[2], offset: line.length - m[2].length };
    };
    return build(input, lines, match, meSpeakers, themSpeakers);
  }

  // A single message: trim surrounding whitespace but keep offsets exact.
  const lead = input.length - input.trimStart().length;
  const text = input.trim();
  return text ? [{ id: 'm1', speaker: null, side: 'them', text, start: lead, end: lead + text.length }] : [];
}

export function speakersOf(messages: Message[]): string[] {
  return [...new Set(messages.map((m) => m.speaker).filter((s): s is string => !!s))];
}
