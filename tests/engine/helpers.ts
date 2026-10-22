import type { PlaybookId } from '../../src/engine/types';

export interface CorpusItem {
  id: string;
  label: 'scam' | 'legit';
  playbook: string;
  channel: string;
  messages: { from: 'them' | 'me'; text: string }[];
}

const PLAYBOOK_ALIASES: Record<string, PlaybookId> = {
  fake_check_equipment: 'fake_check', fake_check: 'fake_check', task: 'task', reshipping: 'reshipping',
  upfront_fee: 'upfront_fee', identity_harvest: 'identity', identity: 'identity',
};
export const toPlaybook = (p: string): PlaybookId | null => PLAYBOOK_ALIASES[p] ?? null;

/** Renders a corpus item as a "Name: text" transcript, the way a user would paste a thread. */
export function asTranscript(item: CorpusItem): string {
  if (item.messages.length === 1 && item.messages[0].from === 'them') return item.messages[0].text;
  return item.messages.map((m) => `${m.from === 'me' ? 'Me' : 'Recruiter'}: ${m.text.replace(/\s*\n\s*/g, ' ')}`).join('\n');
}

/** True when [start, end) begins or ends in the middle of a word ("imple tasks"). */
export function cutsWord(text: string, start: number, end: number): boolean {
  const inWord = (a: string | undefined, b: string | undefined) => !!a && !!b && /[\p{L}\p{N}]/u.test(a) && /[\p{L}\p{N}]/u.test(b);
  return inWord(text[start - 1], text[start]) || inWord(text[end - 1], text[end]);
}
