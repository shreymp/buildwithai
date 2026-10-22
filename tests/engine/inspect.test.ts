import { describe, expect, it } from 'vitest';
import { inspect } from '../../src/engine/inspect';
import type { Message } from '../../src/engine/types';

const msg = (text: string, side: 'them' | 'me' = 'them'): Message => ({ id: 'm1', speaker: null, side, text, start: 0, end: text.length });

describe('inspect', () => {
  it('notes free webmail senders', () => {
    expect(inspect([msg('Email hr.northfield@gmail.com today')]).map((n) => n.kind)).toEqual(['free_email']);
  });
  it('notes shorteners, chat links, IP links and punycode', () => {
    const kinds = inspect([msg('See bit.ly/abc123 or t.me/northfield_hr or http://192.168.4.20/apply or https://xn--pple-43d.com/jobs')]).map((n) => n.kind);
    expect(kinds).toEqual(['shortener', 'chat_link', 'ip_url', 'punycode']);
  });
  it('ignores company domains and the user’s own messages', () => {
    expect(inspect([msg('Write to ana.ortiz@halverson-foods.example')])).toEqual([]);
    expect(inspect([msg('my email is me@gmail.com', 'me')])).toEqual([]);
  });
});
