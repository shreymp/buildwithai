import { describe, expect, it } from 'vitest';
import { parseThread } from '../../src/engine/thread';

describe('parseThread', () => {
  it('treats plain text as one message with exact offsets', () => {
    const input = '\n  Hello there, we have a job for you.  \n';
    const [m] = parseThread(input);
    expect(m.text).toBe('Hello there, we have a job for you.');
    expect(input.slice(m.start, m.end)).toBe(m.text);
  });
  it('splits an iOS WhatsApp export, including hidden marks and continuation lines', () => {
    const input = '[10/18/26, 7:42:10 PM] Dana Reyes: Hi Maya!\nWe have a role for you.\n‎[10/18/26, 7:43:01 PM] Maya: Sounds good\n[10/18/26, 7:44:30 PM] Dana Reyes: Add me on Telegram';
    const msgs = parseThread(input);
    expect(msgs.map((m) => m.speaker)).toEqual(['Dana Reyes', 'Maya', 'Dana Reyes']);
    expect(msgs[0].text).toBe('Hi Maya!\nWe have a role for you.');
    for (const m of msgs) expect(input.slice(m.start, m.end)).toBe(m.text);
  });
  it('splits an Android WhatsApp export', () => {
    const input = '10/18/26, 7:42 PM - Lily: Hello! Part-time job\n10/18/26, 7:43 PM - Me: What is it?\n10/18/26, 7:45 PM - Lily: Rate hotels for commission';
    const msgs = parseThread(input);
    expect(msgs.map((m) => m.speaker)).toEqual(['Lily', 'Me', 'Lily']);
    expect(msgs[1].side).toBe('me');
  });
  it('splits "Name: text" transcripts and marks Me as the user', () => {
    const msgs = parseThread('Dana: Hi there\nMe: Hello\nDana: Add me on Telegram');
    expect(msgs.map((m) => [m.speaker, m.side])).toEqual([['Dana', 'them'], ['Me', 'me'], ['Dana', 'them']]);
  });
  it('does not mistake job-post labels for speakers', () => {
    const msgs = parseThread('We are hiring a remote assistant.\nSalary: $40,000\nLocation: Remote\nRequirements: Laptop');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].speaker).toBeNull();
  });
  it('honors speakers the user marked as themselves', () => {
    const msgs = parseThread('Dana: Hi\nMaya: Hello\nDana: Welcome', ['Maya']);
    expect(msgs.find((m) => m.speaker === 'Maya')?.side).toBe('me');
  });
});

describe('parseThread: single forwarded line and overrides', () => {
  it('reads a single "Name: long message" line as one message from that speaker', () => {
    const msgs = parseThread('Dana: Hi Maya! We came across your resume and have a remote role for you.');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].speaker).toBe('Dana');
    expect(msgs[0].text.startsWith('Hi Maya!')).toBe(true);
  });
  it('lets the user say a speaker called "Me" is not them', () => {
    const msgs = parseThread('Me: Hi\nDana: Hello there', [], ['Me']);
    expect(msgs.every((m) => m.side === 'them')).toBe(true);
  });
});
