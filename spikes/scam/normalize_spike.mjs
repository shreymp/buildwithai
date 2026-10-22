import { analyze } from './engine.mjs';
const HOMO = { 'а':'a','е':'e','о':'o','р':'p','с':'c','у':'y','х':'x','і':'i','ӏ':'l' };
export function norm(s) {
  s = s.normalize('NFKC').replace(/[​-‍﻿]/g, '');
  s = [...s].map(c => HOMO[c] || c).join('');
  // collapse spaced/dotted letters: "t e l e g r a m" / "t.e.l.e.g.r.a.m"
  s = s.replace(/\b(?:[A-Za-z][ .\-_*]){3,}[A-Za-z]\b/g, m => m.replace(/[ .\-_*]/g, ''));
  // leetspeak inside words
  s = s.replace(/\b[\w@$]*[a-z][\w@$]*\b/gi, w => /[a-z]/i.test(w) && /[0-9@$]/.test(w) && !/^\$?\d/.test(w) ? w.replace(/0/g,'o').replace(/1/g,'i').replace(/3/g,'e').replace(/4/g,'a').replace(/5/g,'s').replace(/7/g,'t').replace(/@/g,'a').replace(/\$/g,'s') : w);
  s = s.replace(/\bwhats\s*app\b/gi, 'whatsapp').replace(/\btele\s*gram\b/gi, 'telegram').replace(/\bteleg?ra?m\b/gi, 'telegram');
  return s;
}
const cases = [
  'Interview will be via T3legram, add me: @hr_jane',
  'Pls contact our HR on t e l e g r a m for the interview',
  'Message me on whats app to start, no experience needed, earn $300/day',
  'You will need to pay a one-time tra1ning fee of $89',
  'Сontact our team on Теlegram',  // Cyrillic C and Te
];
for (const c of cases) { const a = analyze(c), b = analyze(norm(c)); console.log(a.signals.join(',')||'-', ' => ', b.signals.join(','), '|', norm(c)); }
