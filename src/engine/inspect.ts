// Notes about senders and links found in the messages. These are shown alongside the
// findings; the free-email case also feeds the `personal_email` rule.

import type { InspectorNote, Message } from './types';

const FREE_MAIL = /^(?:gmail|googlemail|yahoo|ymail|outlook|hotmail|live|msn|aol|protonmail|proton|icloud|me|gmx|mail|zoho|yandex)\.(?:com|me|net|co\.uk|ru)$/;
const SHORTENERS = new Set(['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'cutt.ly', 'rebrand.ly', 'shorturl.at', 'rb.gy', 'tiny.cc', 's.id', 'v.gd', 'bl.ink', 't.ly']);
const CHAT_LINKS = new Set(['t.me', 'telegram.me', 'wa.me', 'chat.whatsapp.com', 'signal.me', 'api.whatsapp.com']);

const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"'()]{2,200}|\b(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|cutt\.ly|rebrand\.ly|shorturl\.at|rb\.gy|tiny\.cc|s\.id|v\.gd|t\.ly|t\.me|telegram\.me|wa\.me|chat\.whatsapp\.com|signal\.me)\/[^\s<>"'()]{0,200}/gi;
const EMAIL_RE = /\b[a-z0-9._%+-]{1,64}@([a-z0-9-]{1,63}(?:\.[a-z0-9-]{1,63}){1,4})\b/gi;

function hostOf(url: string): string {
  const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  try {
    return new URL(withScheme).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function inspect(messages: Message[]): InspectorNote[] {
  const notes: InspectorNote[] = [];
  const seen = new Set<string>();
  const add = (n: InspectorNote) => {
    const key = `${n.kind}:${n.value}`;
    if (!seen.has(key)) { seen.add(key); notes.push(n); }
  };

  for (const m of messages) {
    if (m.side === 'me') continue;
    for (const match of m.text.matchAll(EMAIL_RE)) {
      const domain = match[1].toLowerCase();
      if (FREE_MAIL.test(domain)) {
        add({ kind: 'free_email', value: match[0], title: 'Personal email address', why: `${match[0]} is a free webmail address. Recruiters at real companies write from the company’s own domain.` });
      }
    }
    for (const match of m.text.matchAll(URL_RE)) {
      const url = match[0].replace(/[.,;:!?]+$/, '');
      const host = hostOf(url);
      if (!host) continue;
      if (CHAT_LINKS.has(host)) {
        add({ kind: 'chat_link', value: url, title: 'Direct chat-app link', why: `${host} opens a private chat on Telegram or WhatsApp, off the job platform and away from its protections.` });
      } else if (SHORTENERS.has(host)) {
        add({ kind: 'shortener', value: url, title: 'Shortened link', why: `${host} hides where the link really goes. Don’t open it; ask for the full company URL instead.` });
      } else if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
        add({ kind: 'ip_url', value: url, title: 'Link to a bare IP address', why: 'Real company sites use a domain name, not a raw number address.' });
      } else if (host.split('.').some((p) => p.startsWith('xn--'))) {
        add({ kind: 'punycode', value: url, title: 'Disguised characters in a link', why: 'This address uses special characters that can imitate a real company’s domain.' });
      }
    }
  }
  return notes;
}
