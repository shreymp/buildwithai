// Splits pasted text into messages. Recognizes WhatsApp exports and copies, email reply
// chains, and "Name: text" chat transcripts; anything else is treated as a single message.
// Nothing the other person wrote is ever dropped: text before the first recognized speaker
// line becomes its own message.

import type { Message, Side } from './types';

const DATE = String.raw`\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{1,4}`;
const TIME = String.raw`\d{1,2}[:.]\d{2}(?:[:.]\d{2})?(?:\s?[ap]\.?\s?m\.?)?`;
const MARKS = '[\\u200e\\u200f\\u202a-\\u202e]*';
// [10/18/26, 7:42:10 PM] Name: text
const IOS = new RegExp(`^${MARKS}\\[${DATE},?\\s{1,3}${TIME}\\]\\s{0,3}([^:\\n]{1,40}?):\\s?(.*)$`, 'i');
// [7:42 PM, 10/18/2026] Name: text (WhatsApp Desktop and Web copy)
const DESKTOP = new RegExp(`^${MARKS}\\[${TIME},?\\s{1,3}${DATE}\\]\\s{0,3}([^:\\n]{1,40}?):\\s?(.*)$`, 'i');
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
  'sent', 'received', 'bcc', 'importance', 'reply-to', 'attachments', 'attachment',
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

function sideOf(name: string | null, meSpeakers: Set<string>, themSpeakers: Set<string>, defaultMe = false): Side {
  if (!name) return 'them';
  if (themSpeakers.has(name)) return 'them';
  if (meSpeakers.has(name)) return 'me';
  return ME_NAMES.test(name) || defaultMe ? 'me' : 'them';
}

const GREETING = /^\W{0,3}(?:hi|hello|hey|dear|good (?:morning|afternoon|evening))[\s,]{1,3}([A-Z][a-z]{1,20})\b/i;

function build(input: string, lines: Line[], match: Matcher, meSpeakers: Set<string>, themSpeakers: Set<string>): Message[] {
  const out: Message[] = [];
  for (const line of lines) {
    const hit = match(line.text);
    if (hit) {
      const start = line.start + hit.offset;
      out.push({ id: `m${out.length + 1}`, speaker: hit.name, side: sideOf(hit.name, meSpeakers, themSpeakers), text: hit.text, start, end: start + hit.text.length });
    } else if (line.text.trim()) {
      const trimmedStart = line.start + (line.text.length - line.text.trimStart().length);
      const trimmedEnd = line.start + line.text.trimEnd().length;
      const prev = out[out.length - 1];
      if (!prev) {
        // Text before the first speaker line (an email body above a signature block, say).
        out.push({ id: 'm1', speaker: null, side: 'them', text: input.slice(trimmedStart, trimmedEnd), start: trimmedStart, end: trimmedEnd });
      } else {
        // Continuation of the previous message (multi-line message in an export).
        if (!prev.text.trim()) prev.start = trimmedStart;
        prev.end = trimmedEnd;
        prev.text = input.slice(prev.start, prev.end);
      }
    }
  }
  return out.filter((m) => m.text.trim().length > 0).map((m, i) => ({ ...m, id: `m${i + 1}` }));
}

/**
 * A guess at who the user is, for a two-person chat where nobody is "Me": the person the
 * other one greets by name ("Hello Jordan, …"). Returns the messages with that speaker
 * on the user's side, or null when there's no single answer. It's only a guess, so the
 * caller also checks the thread without it (see analyze()).
 */
export function withGreetedAsUser(messages: Message[]): Message[] | null {
  const names = [...new Set(messages.map((m) => m.speaker).filter((n): n is string => !!n))];
  if (names.length !== 2 || messages.some((m) => m.side === 'me')) return null;
  const greeted = new Set<string>();
  for (const m of messages) {
    const g = GREETING.exec(m.text);
    if (!g) continue;
    const first = g[1].toLowerCase();
    const other = names.find((n) => n !== m.speaker && n.split(' ')[0].toLowerCase() === first);
    if (other) greeted.add(other);
  }
  // Both people greeting each other gives no answer.
  if (greeted.size !== 1) return null;
  return messages.map((m) => (m.speaker && greeted.has(m.speaker) ? { ...m, side: 'me' } : m));
}

// ── Email reply chains ────────────────────────────────────────────────────────
const GMAIL_ON = /^\s*on\s.{4,200}wrote:\s*$/i;
const ORIGINAL = /^\s*-{2,}\s*(?:original message|forwarded message)\s*-{2,}\s*$/i;
const HEADER = /^\s*\**(from|sent|date|to|cc|bcc|subject|importance|reply-to)\**:\s*(.*)$/i;

/** "Jordan Lee <jordan@x.com>" or "Jordan Lee" → "Jordan Lee". */
function personName(raw: string): string | null {
  const n = raw.replace(/<[^>]*>/g, '').replace(/["']/g, '').replace(/\[mailto:[^\]]*\]/gi, '').trim();
  if (!n || n.length > 40 || /@/.test(n)) return null;
  return n.split(/\s*[;,]\s*/)[0] || null;
}

function wroteAuthor(line: string): string | null {
  // "On Mon, Oct 19, 2026 at 9:14 AM Jordan Lee <jordan.lee@gmail.com> wrote:"
  const m = /(?:\b[ap]\.?m\.?|\d{2}:\d{2}|\d{4}),?\s+(.{1,80}?)\s*(?:<[^>]*>)?\s*wrote:\s*$/i.exec(line);
  return m ? personName(m[1]) : null;
}

interface Segment { from: number; to: number; speaker: string | null; toName: string | null }

function parseEmailChain(input: string, lines: Line[], meSpeakers: Set<string>, themSpeakers: Set<string>): Message[] | null {
  const segments: Segment[] = [];
  let cur: Segment = { from: 0, to: 0, speaker: null, toName: null };
  let i = 0;
  let found = false;
  const close = (end: number) => {
    cur.to = end;
    segments.push(cur);
  };
  while (i < lines.length) {
    const t = lines[i].text;
    const next = lines[i + 1]?.text ?? '';
    const isWrote = GMAIL_ON.test(t) || (/wrote:\s*$/i.test(t) && t.length < 120 && /^\s*on\s/i.test(lines[i - 1]?.text ?? ''));
    const isOriginal = ORIGINAL.test(t);
    const isOutlook = /^\s*\**from\**:/i.test(t) && (HEADER.test(next) || HEADER.test(lines[i + 2]?.text ?? ''));
    if (!isWrote && !isOriginal && !isOutlook) { i++; continue; }
    found = true;
    // A "On … wrote:" header that wrapped onto two lines starts on the previous line.
    const headerStart = isWrote && !GMAIL_ON.test(t) ? i - 1 : i;
    close(lines[headerStart].start);
    cur = { from: 0, to: 0, speaker: isWrote ? wroteAuthor(t) : null, toName: null };
    i++;
    // Header block ("From:", "Sent:", "To:", "Subject:"), which also follows "Original Message".
    while (i < lines.length && HEADER.test(lines[i].text)) {
      const [, key, value] = HEADER.exec(lines[i].text)!;
      if (/^from$/i.test(key)) cur.speaker = personName(value);
      if (/^to$/i.test(key)) cur.toName = personName(value);
      i++;
    }
    cur.from = lines[i]?.start ?? input.length;
  }
  if (!found) return null;
  close(input.length);

  // Who is the user? The recipient of the first quoted email, or else the author the top
  // message replied to. The speaker toggles let the user correct this.
  const quoted = segments.slice(1);
  const me = quoted.find((s) => s.toName)?.toName ?? (quoted[0]?.speaker && !quoted[0].toName ? quoted[0].speaker : null);

  const out: Message[] = [];
  for (const seg of segments) {
    const raw = input.slice(seg.from, seg.to);
    const lead = raw.length - raw.trimStart().length;
    const text = raw.trim();
    if (!text) continue;
    const start = seg.from + lead;
    const speaker = seg.speaker;
    const defaultMe = !!speaker && !!me && speaker === me;
    out.push({ id: `m${out.length + 1}`, speaker, side: sideOf(speaker, meSpeakers, themSpeakers, defaultMe), text, start, end: start + text.length });
  }
  return out;
}

/** True when the paste looks like an email chain, where the newest message is at the top. */
export function looksLikeEmailChain(input: string): boolean {
  return splitLines(input).some(
    (l, i, all) => GMAIL_ON.test(l.text) || ORIGINAL.test(l.text) || (/^\s*\**from\**:/i.test(l.text) && HEADER.test(all[i + 1]?.text ?? '')),
  );
}

export function parseThread(input: string, meSpeakerList: string[] = [], themSpeakerList: string[] = []): Message[] {
  const meSpeakers = new Set(meSpeakerList);
  const themSpeakers = new Set(themSpeakerList);
  const lines = splitLines(input);
  const nonEmpty = lines.filter((l) => l.text.trim());

  // Chat exports: the paste starts with a timestamped line, or has at least two of them.
  // (Long multi-line messages mean most lines can lack a timestamp.)
  for (const re of [IOS, DESKTOP, ANDROID]) {
    const hits = nonEmpty.filter((l) => re.test(l.text)).length;
    if (hits >= 2 || (hits === 1 && nonEmpty.length > 0 && re.test(nonEmpty[0].text))) return build(input, lines, matcherFor(re), meSpeakers, themSpeakers);
  }

  const chain = parseEmailChain(input, lines, meSpeakers, themSpeakers);
  if (chain) return chain;

  // "Name: text" transcripts: a speaker who writes more than once, or "Me" plus one other.
  // One-off "Pay Rate:" / "Next Steps:" lines in an email are labels, not speakers.
  const named = nonEmpty.map((l) => NAMED.exec(l.text)).filter((m): m is RegExpExecArray => !!m && looksLikeName(m[1]));
  if (named.length >= 2) {
    const counts = new Map<string, number>();
    for (const m of named) counts.set(cleanName(m[1]), (counts.get(cleanName(m[1])) ?? 0) + 1);
    const repeated = [...counts.values()].some((c) => c >= 2);
    const meAndOther = counts.size === 2 && [...counts.keys()].some((n) => ME_NAMES.test(n) || meSpeakers.has(n));
    if (repeated || meAndOther) {
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
