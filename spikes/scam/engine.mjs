// Spike: explainable job-scam signal engine. Rules written from FTC-described patterns
// BEFORE looking at the held-out corpus.
export const SIGNALS = [
  // id, stage, weight, playbooks, regex list
  { id: 'unsolicited', stage: 'hook', w: 1, pb: ['task', 'fake_check_equipment', 'reshipping', 'upfront_fee', 'identity_harvest'],
    re: [/\b(got|found|saw) your (resume|cv|profile|number)\b/i, /\byour (resume|profile) (was|has been) (selected|recommended|shortlisted)/i, /\brecommended (you|your profile)\b/i, /\b(we|i) came across your\b/i] },
  { id: 'high_pay_low_effort', stage: 'hook', w: 2, pb: ['task', 'reshipping', 'fake_check_equipment'],
    re: [/\$\s?\d{3,4}\s*(?:-|to|–)?\s*(?:\$\s?\d{3,4}\s*)?(?:\/|per|a)\s*(day|daily)/i, /\b(earn|make)\s+\$?\d{2,4}\s*(?:-|to)?\s*\$?\d{0,4}\s*(?:\/|per|a|each)\s*(day|hour|hr)\b.*\b(no experience|part[- ]time|from home|flexible)/i, /\bno experience (needed|required|necessary)\b/i, /\b(only|just) (\d+|a few|one|two)\s*(-\s*\d+)?\s*(hours?|hrs?|minutes?|mins?)\s*(a|per)?\s*day\b/i, /\$\d{2,3}\s*(\/|per)\s*(hour|hr)\b.{0,60}\b(data entry|assistant|typing)\b/i] },
  { id: 'vague_role', stage: 'hook', w: 1, pb: ['task', 'reshipping'],
    re: [/\b(simple|easy) (online )?(tasks?|work|job)\b/i, /\bwork from (your )?(home|phone)\b.{0,40}\b(simple|easy|flexible)\b/i, /\bpart[- ]time (online )?(job|work|position)\b.{0,60}\b(phone|online|home)\b/i] },
  { id: 'off_platform', stage: 'move', w: 2, pb: ['task', 'fake_check_equipment', 'identity_harvest', 'upfront_fee'],
    re: [/\b(add|contact|message|text|reach|dm|chat with)\b.{0,40}\b(on|via|through|at)\s+(telegram|whatsapp|signal|wechat|google chat|hangouts|wickr|teams chat)\b/i, /\b(telegram|whatsapp|signal|wickr)\s*(id|username|handle|number|:)/i, /\bt\.me\//i, /\bwa\.me\//i, /\bdownload (the )?(telegram|signal|wickr|teams)\b/i] },
  { id: 'chat_interview', stage: 'legit', w: 2, pb: ['fake_check_equipment', 'identity_harvest', 'upfront_fee'],
    re: [/\b(interview|screening)\b.{0,60}\b(via|over|through|on)\s+(text|chat|telegram|whatsapp|signal|google chat|hangouts|instant messag\w*|teams chat)\b/i, /\b(text|chat)[- ]based interview\b/i, /\binterview will be (conducted )?(via|over|through|by) (text|chat)/i] },
  { id: 'instant_hire', stage: 'legit', w: 2, pb: ['fake_check_equipment', 'identity_harvest', 'upfront_fee', 'reshipping'],
    re: [/\b(you('ve| have) been|you are|you're) (hired|selected|approved)\b(?!.{0,40}\bfor (an|the|a) (interview|next round|phone screen))/i, /\bcongratulations\b.{0,80}\b(hired|offer|position|selected)\b/i, /\bstart (immediately|today|right away|tomorrow)\b/i, /\bno interview (needed|required|necessary)\b/i] },
  { id: 'urgency', stage: 'hook', w: 1, pb: ['task', 'fake_check_equipment', 'identity_harvest', 'upfront_fee', 'reshipping'],
    re: [/\b(limited|few) (slots|spots|positions) (left|remaining|available)\b/i, /\b(respond|reply|act|confirm)\b.{0,30}\b(within|in the next)\s+\d+\s*(hours?|hrs|minutes?|mins)\b/i, /\b(asap|urgent(ly)?|immediately)\b.{0,40}\b(reply|respond|send|confirm|deposit|pay)\b/i, /\boffer (expires|ends)\b/i] },
  { id: 'free_email', stage: 'hook', w: 1, pb: ['fake_check_equipment', 'identity_harvest', 'upfront_fee', 'reshipping'],
    re: [/\b[\w.+-]+@(gmail|yahoo|outlook|hotmail|aol|proton(mail)?|icloud|gmx|mail)\.(com|me|net)\b/i] },
  // extraction
  { id: 'check_deposit', stage: 'setup', w: 3, pb: ['fake_check_equipment'],
    re: [/\b(send|mail|issue|deposit|cash)\w*\b.{0,40}\b(check|cheque)\b/i, /\b(check|cheque)\b.{0,60}\b(deposit|cash|mobile deposit|clear)\w*/i, /\bmobile deposit\b/i] },
  { id: 'equipment_vendor', stage: 'setup', w: 3, pb: ['fake_check_equipment'],
    re: [/\b(approved|designated|our|certified|preferred)\s+(vendor|supplier|merchant)\b/i, /\b(purchase|buy|order)\b.{0,50}\b(equipment|laptop|computer|software|office supplies|workstation)\b.{0,60}\b(vendor|supplier|reimburs\w*|from)\b/i, /\breimburs\w*\b.{0,60}\b(equipment|laptop|computer|software)\b/i] },
  { id: 'send_back_money', stage: 'extract', w: 3, pb: ['fake_check_equipment', 'task'],
    re: [/\b(send|return|refund|transfer|forward|wire)\b.{0,40}\b(remaining|remainder|excess|balance|difference|extra)\b/i, /\b(overpa(id|yment)|paid you too much|sent (you )?too much)\b/i] },
  { id: 'gift_card_crypto_wire', stage: 'extract', w: 3, pb: ['task', 'fake_check_equipment', 'upfront_fee'],
    re: [/\bgift ?cards?\b/i, /\b(usdt|bitcoin|btc|crypto(currency)?|tether|usdc|eth(ereum)?|binance|coinbase|crypto wallet|wallet address|bitcoin atm)\b/i, /\b(zelle|cash ?app|venmo|wire transfer|western union|moneygram)\b.{0,60}\b(send|pay|transfer|deposit|vendor|fee)\b/i, /\b(send|pay|transfer|deposit)\b.{0,60}\b(zelle|cash ?app|western union|moneygram)\b/i] },
  { id: 'pay_to_work', stage: 'extract', w: 3, pb: ['task'],
    re: [/\b(recharge|top[- ]?up|deposit|prepay|pre-pay)\b.{0,50}\b(account|balance|tasks?|unlock|level|vip|combo|merge)\b/i, /\b(negative|minus) balance\b/i, /\b(unlock|reset|clear)\b.{0,30}\b(tasks?|orders?|combo|level)\b/i, /\b(combo|lucky|merge|premium) (task|order)s?\b/i] },
  { id: 'task_work', stage: 'setup', w: 2, pb: ['task'],
    re: [/\b(rate|rating|like|liking|review|reviewing|boost|boosting|optimiz\w*|click(ing)?)\b.{0,30}\b(products?|apps?|videos?|hotels?|movies?|songs?|items?|data)\b.{0,60}\b(commission|earn|get paid|paid|\$)/i, /\bcommission\b.{0,40}\b(per|each|every)\s+(task|order|rating|review|set)\b/i, /\b(\d+)\s+(tasks?|orders?)\s+(per|a|each)\s+(set|day)\b/i, /\b(app|product|data) optimi[sz]ation\b/i] },
  { id: 'group_chat', stage: 'setup', w: 1, pb: ['task'],
    re: [/\b(join|added you to|invite you to)\b.{0,30}\b(group|channel|team chat)\b.{0,40}\b(telegram|whatsapp|members|mentor|success)/i, /\b(mentor|trainer|coach)\b.{0,40}\b(guide|teach|show)\b.{0,30}\b(tasks?|first day|first set)\b/i] },
  { id: 'reship', stage: 'setup', w: 3, pb: ['reshipping'],
    re: [/\b(receive|accept)\b.{0,40}\b(packages?|parcels?|shipments?)\b.{0,80}\b(home|address|residence|apartment)\b/i, /\b(re-?ship|re-?label|repackag\w*|forward)\w*\b.{0,40}\b(packages?|parcels?|items?|shipments?|labels?)\b/i, /\b(print|attach)\b.{0,30}\b(new |prepaid |shipping )?labels?\b/i, /\b(quality (control|inspection)|package inspector|shipping coordinator|logistics (assistant|coordinator))\b.{0,80}\b(home|packages?|parcels?)\b/i] },
  { id: 'upfront_fee', stage: 'extract', w: 3, pb: ['upfront_fee'],
    re: [/\b(pay|fee|cost|charge|purchase|buy)\b.{0,50}\b(training|certification|starter kit|onboarding kit|background check|registration|application|processing|materials|license|uniform|software license)\b/i, /\b(training|certification|starter kit|background check|registration|application|processing|onboarding)\s+(fee|cost|charge|deposit)\b/i, /\b(refundable|one[- ]time)\s+(fee|deposit|payment)\b/i] },
  { id: 'id_request', stage: 'extract', w: 3, pb: ['identity_harvest'],
    re: [/\b(ssn|social security( number)?|sin number)\b/i, /\b(photo|picture|scan|copy|front and back)\b.{0,30}\b(id|driver'?s licen[cs]e|passport|state id)\b/i, /\b(bank|online banking)\b.{0,30}\b(login|password|username|credentials|pin)\b/i, /\b(routing|account) (and|&) (routing|account) numbers?\b.{0,80}\b(asap|now|today|before|right away|to (start|proceed|get started))\b/i, /\b(credit card|debit card)\b.{0,30}\b(number|details|info)\b/i, /\b(mother'?s maiden name|date of birth)\b.{0,40}\b(send|provide|need|reply)\b/i] },
  { id: 'secrecy', stage: 'extract', w: 2, pb: ['fake_check_equipment', 'task', 'reshipping'],
    re: [/\b(don'?t|do not)\b.{0,20}\b(tell|inform|mention|discuss)\b.{0,30}\b(bank|anyone|family|teller)\b/i, /\bkeep (this|it) (confidential|private|between us)\b/i] },
];

// Benign context dampeners: things legit hiring processes do.
const LEGIT = [
  { id: 'company_portal', re: [/\b(workday|greenhouse|lever|icims|taleo|smartrecruiters|hr portal|careers portal|applicant portal|onboarding portal)\b/i] },
  { id: 'video_or_onsite', re: [/\b(video (call|interview)|on[- ]?site|in[- ]person|panel interview|zoom (call|link|interview)|phone screen|hiring manager)\b/i] },
  { id: 'employer_pays', re: [/\b(at no cost to you|we (will )?cover|company[- ]paid|paid (for )?by (the company|us)|we('ll| will) ship you)\b/i] },
];

export function analyze(messages) {
  const texts = (Array.isArray(messages) ? messages : [{ from: 'them', text: String(messages) }]).filter(m => m.from !== 'me');
  const hits = [];
  texts.forEach((m, mi) => {
    for (const s of SIGNALS) for (const r of s.re) {
      const g = new RegExp(r.source, r.flags.includes('g') ? r.flags : r.flags + 'g');
      let x; while ((x = g.exec(m.text))) { hits.push({ signal: s.id, stage: s.stage, w: s.w, pb: s.pb, msg: mi, start: x.index, end: x.index + x[0].length, text: x[0] }); if (!x[0].length) g.lastIndex++; }
    }
  });
  const legit = new Set();
  texts.forEach(m => { for (const l of LEGIT) if (l.re.some(r => r.test(m.text))) legit.add(l.id); });
  const uniq = new Map(); for (const h of hits) if (!uniq.has(h.signal)) uniq.set(h.signal, h);
  let score = 0; for (const h of uniq.values()) score += h.w;
  const pbScore = {}; for (const h of uniq.values()) for (const p of h.pb) pbScore[p] = (pbScore[p] || 0) + h.w;
  const extractors = [...uniq.values()].filter(h => h.stage === 'extract' || h.stage === 'setup').length;
  const damp = extractors ? 0 : legit.size;
  score = Math.max(0, score - damp);
  const playbook = Object.entries(pbScore).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const level = score >= 5 ? 'high' : score >= 3 ? 'caution' : 'low';
  return { score, level, playbook, signals: [...uniq.keys()], hits, legit: [...legit] };
}
