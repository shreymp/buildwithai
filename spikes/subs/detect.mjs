// Spike: recurring-charge detector over bank CSV exports. Written before seeing generator output.
export function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}
const num = s => { if (s == null || s === '') return null; const neg = /^\(.*\)$/.test(s.trim()) || /^-/.test(s.trim()); const v = parseFloat(String(s).replace(/[^0-9.]/g, '')); return isNaN(v) ? null : neg ? -v : v; };
function parseDate(s) {
  s = s.trim(); let m;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return Date.UTC(+m[1], m[2] - 1, +m[3]);
  if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/))) { let y = +m[3]; if (y < 100) y += 2000; return Date.UTC(y, m[1] - 1, +m[2]); }
  const t = Date.parse(s); return isNaN(t) ? null : t;
}
export function toTransactions(text) {
  const rows = parseCSV(text); const h = rows[0].map(x => x.trim().toLowerCase());
  const find = (...names) => h.findIndex(x => names.some(n => x === n || x.includes(n)));
  const di = find('transaction date', 'date', 'posted'); const de = find('description', 'payee', 'merchant', 'name', 'memo');
  const ai = h.findIndex(x => x === 'amount'); const dr = find('debit', 'withdrawal'); const cr = find('credit', 'deposit');
  const out = [];
  for (const r of rows.slice(1)) {
    const date = parseDate(r[di] || ''); if (date == null) continue;
    let amt = ai >= 0 ? num(r[ai]) : (num(r[dr]) ? -Math.abs(num(r[dr])) : Math.abs(num(r[cr]) || 0));
    if (amt == null) continue;
    out.push({ date, desc: r[de] || '', amount: amt });
  }
  // Sign convention: if most rows positive, assume debits positive (some card exports) -> flip
  const pos = out.filter(t => t.amount > 0).length; if (pos > out.length * 0.7) out.forEach(t => (t.amount = -t.amount));
  return out;
}
export function normalize(desc) {
  let s = desc.toUpperCase();
  s = s.replace(/^(SQ|TST|PAYPAL|PP|SP|DD|POS|ACH|DEBIT|PURCHASE|RECURRING|CHECKCARD|CKCD|APL|GOOGLE|AMZN MKTP)\s*\*\s*/g, '');
  s = s.replace(/^(POS|ACH|DEBIT|PURCHASE|RECURRING PAYMENT|CHECKCARD \d+)\s+/g, '');
  s = s.replace(/\b\d{3}[-. ]?\d{3}[-. ]?\d{4}\b/g, ' ');
  s = s.replace(/\b(WWW\.|HTTPS?:\/\/)/g, '').replace(/\.(COM|NET|IO|CO|TV)\b/g, ' ');
  s = s.replace(/[#*]\s*\w*\d\w*/g, ' ').replace(/\b[A-Z]*\d[A-Z0-9]*\b/g, ' ');
  s = s.replace(/\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|US|USA)\b\s*$/g, ' ');
  s = s.replace(/[^A-Z& ]/g, ' ').replace(/\s+/g, ' ').trim();
  return s.split(' ').slice(0, 3).join(' ');
}
const DAY = 86400000;
const CADENCES = [['weekly', 7, 2], ['biweekly', 14, 3], ['monthly', 30.44, 4], ['quarterly', 91.3, 8], ['annual', 365.25, 15]];
export function detect(txs) {
  const groups = new Map();
  for (const t of txs) { if (t.amount >= 0) continue; const k = normalize(t.desc); if (!k) continue; (groups.get(k) || groups.set(k, []).get(k)).push(t); }
  const span = Math.max(...txs.map(t => t.date)) - Math.min(...txs.map(t => t.date));
  const results = [];
  for (const [k, list] of groups) {
    list.sort((a, b) => a.date - b.date);
    if (list.length < 2) continue;
    // Split into amount clusters to catch duplicates/price tiers
    const gaps = list.slice(1).map((t, i) => (t.date - list[i].date) / DAY);
    const med = [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)];
    const cad = CADENCES.find(([, d, tol]) => Math.abs(med - d) <= tol);
    if (!cad) continue;
    const fit = gaps.filter(g => Math.abs(g - cad[1]) <= cad[2] * 1.5).length / gaps.length;
    const amts = list.map(t => -t.amount); const amed = [...amts].sort((a, b) => a - b)[Math.floor(amts.length / 2)];
    const amtStable = amts.filter(a => Math.abs(a - amed) / amed < 0.12).length / amts.length;
    if (cad[0] === 'annual' ? list.length < 2 : list.length < 3) continue;
    if (fit < 0.6) continue;
    const kind = amtStable >= 0.6 ? 'subscription' : 'variable_bill';
    const last = list[list.length - 1]; const maxDate = Math.max(...txs.map(t => t.date));
    const active = (maxDate - last.date) / DAY <= cad[1] + cad[2] * 2 + 3;
    const increases = []; for (let i = 1; i < amts.length; i++) if (amts[i] > amts[i - 1] * 1.03 && amts[i] - amts[i - 1] >= 0.5) increases.push({ from: amts[i - 1], to: amts[i], date: list[i].date });
    results.push({ key: k, cadence: cad[0], count: list.length, amount: amts[amts.length - 1], kind, active, fit, amtStable, increases, descs: [...new Set(list.map(t => t.desc))].slice(0, 3) });
  }
  return results.sort((a, b) => b.amount - a.amount);
}
