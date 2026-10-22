import { describe, expect, it } from 'vitest';
import { normalize, toOriginal } from '../../src/engine/normalize';

function span(original: string, needle: string): string {
  const n = normalize(original);
  const i = n.norm.indexOf(needle);
  expect(i, `"${needle}" not found in "${n.norm}"`).toBeGreaterThanOrEqual(0);
  const [a, b] = toOriginal(n, i, i + needle.length);
  return original.slice(a, b);
}

describe('normalize', () => {
  it('lowercases and keeps a one-to-one map for plain text', () => {
    const n = normalize('Add me on Telegram');
    expect(n.norm).toBe('add me on telegram');
    expect(n.map.length).toBe(n.norm.length + 1);
  });
  it('straightens curly quotes without changing length', () => {
    const s = 'Don’t tell your bank';
    expect(normalize(s).norm).toBe("don't tell your bank");
    expect(span(s, "don't tell")).toBe('Don’t tell');
  });
  it('collapses spaced-out letters and maps back to the original span', () => {
    const s = 'Contact HR on t e l e g r a m today';
    expect(normalize(s).norm).toContain('on telegram today');
    expect(span(s, 'telegram')).toBe('t e l e g r a m');
  });
  it('undoes number-for-letter swaps inside words', () => {
    expect(normalize('a one-time tra1ning fee').norm).toContain('training fee');
    expect(normalize('message me on T3legram').norm).toContain('telegram');
  });
  it('leaves prices, times and handles alone', () => {
    const n = normalize('$45/hr at 10am, ask maria1990 or call 555-0100').norm;
    expect(n).toContain('$45/hr');
    expect(n).toContain('10am');
    expect(n).toContain('maria1990');
  });
  it('maps Cyrillic and Greek look-alike letters, including capitals', () => {
    expect(normalize('Сontact our team on Теlegram').norm).toBe('contact our team on telegram');
    expect(normalize('Τelegram').norm).toBe('telegram');
  });
  it('removes zero-width characters but keeps offsets correct', () => {
    const s = 'send a gi​ft card now';
    expect(normalize(s).norm).toBe('send a gift card now');
    expect(span(s, 'gift card')).toBe('gi​ft card');
  });
  it('joins split brand names', () => {
    expect(normalize('text me on whats app').norm).toContain('whatsapp');
    expect(normalize('our tele gram id').norm).toContain('telegram id');
  });
  it('does not join ordinary short words', () => {
    expect(normalize('I am a recruiter at a big firm').norm).toBe('i am a recruiter at a big firm');
  });
});
