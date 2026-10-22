// The rulebook. Every rule is plain data: patterns, a plain-language explanation, the
// script step it belongs to, and the scam playbooks it points to. The How it works page
// renders this same list.
//
// Patterns run on normalized, lowercased text (see normalize.ts). Every quantifier is
// bounded so a long paste can never cause catastrophic backtracking.
//
// Sources for the patterns: FTC consumer guidance on job scams, fake check scams,
// reshipping scams, and the Dec 2024 Data Spotlight on gamified "task" job scams.

import type { LegitContext, Rule } from './types';

const ALL = ['fake_check', 'task', 'reshipping', 'upfront_fee', 'identity'] as const;
const CHAT_APPS = '(?:telegram|whatsapp|signal|wechat|wickr|google chat|hangouts|kik|line app|skype chat|teams chat)';
const W = '[^.?!]{0,30}'; // a short gap that stays inside one sentence
const HOME = /\b(?:home|house|apartment|residence|your (?:own )?address|remote|from home)\b/;

export const RULES: Rule[] = [
  // ── Step 1: the hook ────────────────────────────────────────────────────────
  {
    id: 'unsolicited',
    title: 'An offer you didn’t apply for',
    why: 'Scam “recruiters” send the same offer to thousands of people and say they found your résumé. Real recruiters usually name the job you applied to or where they saw your profile.',
    step: 1, playbooks: [...ALL], weight: 1,
    patterns: [
      /\b(?:got|found|saw|received|reviewed|came across)\s(?:your|ur)\s(?:resume|cv|profile|number|contact|details)\b/g,
      /\byour\s(?:resume|cv|profile)\s(?:was|has been|is)\s(?:selected|recommended|shortlisted|referred|forwarded)\b/g,
      /\b(?:recommended|referred)\s(?:you|your profile|your resume)\s(?:to us|for)\b/g,
    ],
    dampenedBy: ['applied_role', 'video_interview', 'hr_portal', 'hr_portal_generic'],
  },
  {
    id: 'too_good_pay',
    title: 'Pay that’s too good for the work',
    why: 'High pay for simple, no-experience work is the bait. Scams quote daily or hourly rates far above what entry-level remote jobs pay.',
    step: 1, playbooks: ['task', 'reshipping', 'fake_check'], weight: 2,
    patterns: [
      /\$\s?[1-9]\d{2}(?:,\d{3})?(?:\s?(?:-|to)\s?\$?\s?\d{3,4}(?:,\d{3})?)?\s?(?:\/|per\s|a\s|each\s)\s?(?:day|daily)\b/g,
      /\$\s?\d{3,4}(?:,\d{3})?\s?(?:daily|a day)\b/g,
      /\b(?:daily|weekly)\s(?:pay|income|earnings|salary)\s(?:of\s|is\s|up to\s)?\$\s?[1-9]\d{2,3}/g,
      /\b(?:earn|make|get paid)\s(?:up to\s|over\s)?\$\s?\d{3,5}(?:,\d{3})?\s?(?:\/|per\s|a\s|each\s|every\s)\s?(?:day|week)\b/g,
      /\$\s?(?:[4-9]\d|[1-9]\d{2})(?:\.\d{2})?\s?(?:\/|per\s|an\s|a\s)\s?(?:hour|hr)\b(?=[^.?!]{0,80}\b(?:data entry|typing|assistant|no experience|part[- ]time|from home|simple|easy)\b)/g,
      /\b(?:data entry|typing|personal assistant|virtual assistant|remote assistant)\b[^.?!]{0,60}\$\s?(?:[4-9]\d|[1-9]\d{2})(?:\.\d{2})?\s?(?:\/|per\s|an\s|a\s)\s?(?:hour|hr)\b/g,
    ],
  },
  {
    id: 'no_experience',
    title: '“No experience needed”',
    why: 'Combined with high pay, “no experience needed” widens the net. On its own it’s common in real entry-level posts, so Tipoff treats it as a weak sign.',
    step: 1, playbooks: [...ALL], weight: 1,
    patterns: [/\bno (?:prior |previous |work )?experience (?:is )?(?:needed|required|necessary)\b/g],
    dampenedBy: ['video_interview', 'hr_portal', 'hr_portal_generic', 'applied_role'],
  },
  {
    id: 'vague_easy_work',
    title: 'Vague, “easy” work',
    why: 'Scam offers rarely describe a real job. They promise “simple tasks” you can do from your phone in minutes a day.',
    step: 1, playbooks: ['task', 'reshipping'], weight: 1,
    patterns: [
      /\b(?:simple|easy|basic)\s(?:online\s|daily\s|phone\s)?(?:tasks?|work|jobs?|assignments?)\b/g,
      /\b(?:work |earn |do it )?(?:from|on) (?:your|ur) (?:phone|mobile)\b/g,
      /\b\d{1,3}\s?(?:-\s?\d{1,3}\s?)?(?:min|mins|minutes)\s(?:a|per|each)\s?day\b/g,
      /\b(?:only|just)\s(?:\d{1,2}|a few|one|two|three)\s?(?:-\s?\d{1,2}\s)?(?:hours?|hrs?|minutes?|mins?)\s(?:a|per|each)\s?day\b/g,
    ],
  },
  {
    id: 'pressure',
    title: 'Pressure to decide fast',
    why: 'Urgency stops you from checking. Real employers give you time to research them.',
    step: 1, playbooks: [...ALL], weight: 1,
    patterns: [
      /\b(?:limited|few|only \d{1,2})\s(?:slots|spots|positions|openings|seats)\s(?:left|remaining|available)\b/g,
      /\b(?:respond|reply|confirm|act|decide)\b[^.?!]{0,25}\b(?:within|in the next)\s\d{1,2}\s?(?:hours?|hrs|minutes?|mins)\b/g,
      /\b(?:offer|position|spot)\s(?:expires|closes|ends)\s(?:today|tonight|in \d{1,2} (?:hours?|minutes?))\b/g,
      /\breply\s(?:with\s)?["']?(?:yes|y|1|ok)["']?\s(?:to|and|if|for)\b/g,
      /\b(?:asap|urgent(?:ly)?|right now)\b[^.?!]{0,25}\b(?:reply|respond|send|confirm|deposit|pay|buy)\b/g,
    ],
  },
  {
    id: 'personal_email',
    title: 'Company recruiter using a personal email',
    why: 'Recruiters at real companies write from the company’s domain. A “hiring manager” on a free webmail address is a common red flag.',
    step: 1, playbooks: ['fake_check', 'upfront_fee', 'identity', 'reshipping'], weight: 1,
    patterns: [/\b[a-z0-9._%+-]{1,64}@(?:gmail|yahoo|ymail|outlook|hotmail|live|aol|protonmail|proton|icloud|gmx|mail|zoho)\.(?:com|me|net)\b/g],
  },

  // ── Step 2: off the platform ────────────────────────────────────────────────
  {
    id: 'move_to_chat',
    title: 'Moving you to a chat app',
    why: 'Scammers move you off job sites and email to WhatsApp, Telegram or Signal, where they’re harder to trace and the platform can’t warn you.',
    step: 2, playbooks: [...ALL], weight: 2,
    patterns: [
      new RegExp(`\\b(?:add|contact|message|text|reach|dm|chat with|connect with|talk to|write to|find)\\b${W}\\b(?:on|via|through|at|using)\\s(?:the\\s)?${CHAT_APPS}\\b`, 'g'),
      new RegExp(`\\b${CHAT_APPS}\\s?(?:id|username|user name|handle|number|contact|account)\\b`, 'g'),
      /\bt\.me\/[a-z0-9_]{2,40}/g,
      /\bwa\.me\/\d{6,15}/g,
      new RegExp(`\\b(?:download|install|get)\\s(?:the\\s)?${CHAT_APPS}\\b`, 'g'),
      new RegExp(`\\b(?:continue|move|switch)\\b${W}\\b(?:on|to)\\s${CHAT_APPS}\\b`, 'g'),
      new RegExp(`\\b${CHAT_APPS}\\s?:?\\s?(?:@[a-z0-9_]{3,32}|\\+\\s?\\d[\\d ().-]{0,18}\\d)`, 'g'),
      /\b(?:on|via)\s(?:wa|whatsapp|telegram|signal)\s?:?\s?\+?\s?\d[\d ().-]{0,18}\d/g,
    ],
    dampenedBy: ['video_interview', 'hr_portal'],
  },

  // ── Step 3: the fast "hire" ─────────────────────────────────────────────────
  {
    id: 'chat_interview',
    title: 'An interview by text or chat only',
    why: 'Real employers interview you by video, phone or in person. A “text interview” lets a scammer pose as a company without showing a face or a real office.',
    step: 3, playbooks: ['fake_check', 'identity', 'upfront_fee'], weight: 2,
    patterns: [
      new RegExp(`\\binterview\\w{0,3}\\b[^.?!]{0,40}\\b(?:via|over|through|on|by|using)\\s(?:the\\s)?(?:text|chat|sms|instant messag\\w{0,4}|${CHAT_APPS})\\b`, 'g'),
      /\b(?:text|chat|sms|im)[- ]based\s(?:interview|screening)\b/g,
      new RegExp(`\\b(?:text|chat|${CHAT_APPS})\\sinterview\\b`, 'g'),
    ],
  },
  {
    id: 'instant_hire',
    title: 'Hired without a real interview',
    why: 'Real offers come after interviews and checks. Being “hired” after a few chat messages means the job is the bait, not the point.',
    step: 3, playbooks: ['fake_check', 'identity', 'upfront_fee', 'reshipping', 'task'], weight: 2,
    patterns: [
      /\b(?:you(?:'ve| have)? been|you are|you're|ur)\s(?:officially\s)?(?:hired|approved for the (?:position|role|job))\b/g,
      /\byou\s(?:got|get)\sthe\s(?:job|position|role)\b/g,
      /\bno interview (?:is )?(?:needed|required|necessary)\b/g,
      /\bcongratulations\b[^.?!]{0,60}\b(?:hired|you got the (?:job|position|role|offer)|welcome to the team|offer you the position|passed the interview)\b/g,
      /\b(?:passed|cleared)\s(?:the|your)\s(?:interview|screening|assessment)\b[^.?!]{0,60}\b(?:start|begin|onboard)/g,
      /\byou(?:'ve| have)? been (?:selected|chosen)\s(?:for|as)\s(?:(?!interview)[^.?!]){0,40}\b(?:position|role|job)\b/g,
      /\bhired\s(?:immediately|right away|on the spot|today)\b/g,
    ],
    dampenedBy: ['video_interview', 'hr_portal'],
  },
  {
    id: 'rushed_start',
    title: 'Start immediately',
    why: 'Pushing you to start today leaves no time to verify the company. Common in scams, but also in some real hourly jobs, so it’s a weak sign.',
    step: 3, playbooks: ['fake_check', 'reshipping', 'task'], weight: 1,
    patterns: [/\b(?:start|begin)\s(?:working\s)?(?:immediately|today|right away|tonight)\b/g],
    dampenedBy: ['video_interview', 'hr_portal', 'hr_portal_generic', 'applied_role'],
  },

  // ── Step 4: the setup ───────────────────────────────────────────────────────
  {
    id: 'check_for_equipment',
    title: 'A check is coming your way',
    why: 'This is the fake-check scam. The check looks real and your bank may show the funds, but it bounces days later. By then you’ve spent the money, and you owe it back.',
    step: 4, playbooks: ['fake_check'], weight: 3,
    patterns: [
      /\b(?:send|mail|issue|overnight|ship|courier|fedex|forward)\w{0,3}\s(?:you\s)?(?:a\s|the\s|your\s)?(?:company\s|cashier'?s\s|certified\s|business\s)?(?:check|cheque)\b/g,
      /\b(?:check|cheque)\s(?:for|of|worth|in the amount of)\s\$\s?\d[\d,]{0,9}(?:\.\d{1,2})?/g,
      /\bmobile deposit\b/g,
      /\b(?:sent|mailed|issued|delivered)\s(?:to you\s)?(?:by|via|as a|in a)\s(?:company\s|cashier'?s\s)?(?:check|cheque)\b/g,
      /\b(?:deposit|cash)\w{0,3}\s(?:the|this|that|your|it|my)\s(?:check|cheque)\b/g,
      /\b(?:check|cheque)\b[^.?!]{0,30}\b(?:to (?:buy|purchase|cover)|for (?:your |the )?(?:equipment|laptop|supplies|office|workstation|software))\b/g,
    ],
  },
  {
    id: 'buy_from_vendor',
    title: 'Buy equipment from “their” vendor',
    why: 'Real employers ship equipment or reimburse you later. A scammer’s “approved vendor” is the scammer, so anything you pay them is gone.',
    step: 4, playbooks: ['fake_check', 'upfront_fee'], weight: 3,
    patterns: [
      /\b(?:approved|designated|certified|preferred|authorized)\s(?:equipment\s)?(?:vendor|supplier|merchant)\b/g,
      /\b(?:purchase|buy|order)\w{0,3}\b[^.?!]{0,40}\b(?:equipment|laptop|macbook|computer|software|office supplies|workstation|printer|devices?)\b[^.?!]{0,40}\b(?:vendor|supplier|from (?:them|him|her|our))\b/g,
    ],
    dampenedBy: ['employer_pays'],
  },
  {
    id: 'task_work',
    title: 'Paid “tasks” like rating or liking',
    why: 'This is the task scam. You get small “commissions” for rating products or liking videos in an app, so the later deposits feel safe.',
    step: 4, playbooks: ['task'], weight: 2,
    patterns: [
      /\b(?:rate|rating|review|reviewing|like|liking|boost|boosting|optimi[sz]e|optimi[sz]ing|click|clicking|submit|submitting)\b[^.?!]{0,25}\b(?:products?|apps?|videos?|hotels?|movies?|songs?|items?|data|orders?)\b[^.?!]{0,50}?(?:commission\w{0,2}|\bearn\w{0,3}(?:\scommission\w{0,2})?|\bget paid|\$\s?\d[\d,]{0,9})/g,
      /\bcommission\w{0,2}\b[^.?!]{0,20}\b(?:per|each|every|for every)\s(?:task|order|rating|review|set|click)\b/g,
      /\b\d{1,3}\s(?:tasks|orders|ratings|reviews)\s(?:per|a|each|in a)\s(?:set|day|round)\b/g,
      /\b(?:app|product|data|hotel|movie|music|review)\soptimi[sz]ation\b/g,
    ],
  },
  {
    id: 'mentor_group',
    title: 'A “mentor” or group chat to coach you',
    why: 'Task scams add you to group chats where fake coworkers post their earnings, to push you to deposit more.',
    step: 4, playbooks: ['task'], weight: 1,
    patterns: [
      /\b(?:join|joined|add(?:ed)? you to|invite you to)\s(?:our\s|the\s)?(?:vip\s|team\s|work\s)?(?:group|channel|community)\b/g,
      /\b(?:mentor|trainer|coach|team leader|receptionist)\b[^.?!]{0,30}\b(?:guide|teach|show|walk)\s(?:you|u)\b/g,
    ],
  },
  {
    id: 'receive_packages',
    title: 'Receive and reship packages from home',
    why: 'This is the reshipping scam. The packages are bought with stolen cards, and forwarding them makes you part of the fraud. The promised pay never arrives.',
    step: 4, playbooks: ['reshipping'], weight: 3,
    patterns: [
      /\b(?:receive|accept|collect)\w{0,3}\b[^.?!]{0,30}\b(?:packages|parcels|shipments|deliveries)\b[^.?!]{0,50}\b(?:home|address|apartment|residence|house)\b/g,
      /\b(?:package|parcel|quality control|merchandise)\s(?:inspector|forwarder|coordinator|handler|specialist)\b/g,
      /\blogistics\s(?:coordinator|assistant|agent|clerk)\b/g,
      /\b(?:receive|accept)\w{0,3}\s(?:and|&)\s(?:forward|reship|re-ship|resend)\w{0,3}\b/g,
      /\$\s?\d{1,3}\s(?:per|for each|for every|a|each)\s(?:package|parcel|box|shipment|processed item|item)\b/g,
      /\b(?:send|give|provide|text)\w{0,3}\b[^.?!]{0,20}\baddress\b[^.?!]{0,40}\b(?:packages?|parcels?|first order|deliver\w{0,4}|shipments?)\b/g,
    ],
    // A mailroom job forwards packages too; the scam has you do it from where you live.
    needsMessage: HOME,
  },
  {
    id: 'reship_out',
    title: 'Relabel and ship the packages on',
    why: 'Sending the packages on, often with labels they email you, is the moment you move stolen goods for the scammer. Real employers don’t run shipping through your home.',
    step: 5, playbooks: ['reshipping'], weight: 3,
    patterns: [
      /\b(?:re-?ship|re-?label|re-?pack(?:age)?)\w{0,4}\b/g,
      /\bforward\w{0,3}\s(?:the\s|these\s|all\s|them\s)?(?:packages?|parcels?|items?|shipments?|boxes)\b/g,
      /\b(?:print|attach|apply)\w{0,3}\s(?:the\s)?(?:new\s|prepaid\s|shipping\s|return\s){1,2}labels?\b/g,
      /\b(?:new|prepaid)\s(?:shipping\s)?labels?\b/g,
      /\bship\w{0,3}\s(?:them|it|the items|the packages|the parcels)\s(?:out\s)?to\s(?:the\s|new\s|our\s)?(?:addresses|address|customers|recipients)\b/g,
      /\b(?:ship|send|mail|forward|drop)\w{0,3}\s(?:it|them|each one|the (?:package|parcel|box|item)s?)\s(?:back\s)?(?:out|off|on)\b[^.?!]{0,30}\blabels?\b/g,
      /\b(?:forward|ship|send|mail)\w{0,3}\b[^.?!]{0,30}\bwith\s(?:the\s|our\s|new\s|prepaid\s)?(?:shipping\s)?labels?\b/g,
    ],
    // The home address often comes up in an earlier message than the shipping orders.
    needsMessage: HOME,
    needsThread: true,
  },
  {
    id: 'pay_for_job',
    title: 'Paying to get the job',
    why: 'Real employers don’t charge you for training, certification, background checks or starter kits. If you have to pay to start, it isn’t a job.',
    step: 4, playbooks: ['upfront_fee'], weight: 3,
    patterns: [
      /\b(?:pay|purchase|buy)\s(?:a\s|the\s|your\s|for\s|for your\s|for the\s|\$\s?\d{1,4}\s(?:for\s)?(?:the\s|your\s)?)(?:onboarding\s|new hire\s|required\s)?(?:training|certification|starter kit|onboarding kit|welcome kit|background check|registration|software license|work permit|uniform)(?:\s(?:fee|kit|costs?))?\b/g,
      /\b(?:training|certification|registration|application|processing|onboarding|activation|background check|kit|placement|enrollment|admin)\s(?:fee|cost|charge|deposit)\b/g,
      /\b(?:refundable|one-time|one time|small|nominal)\s(?:fee|deposit|payment)\b/g,
      /\b(?:training|starter|onboarding|welcome|equipment)?\s?(?:kit|materials|certification|course|exam)\b[^.?!]{0,30}\b(?:cost|costs|is|are|fee of|price is)\s\$\s?\d[\d,]{0,9}(?:\.\d{1,2})?/g,
      /\b(?:program|course|training|certification|kit|onboarding|registration|enrollment|verification|activation|placement)\s(?:fee|cost|price|payment)s?\s(?:is|of|are|will be|costs?)\s\$\s?\d[\d,]{0,9}(?:\.\d{1,2})?/g,
      /\b(?:pay|purchase|buy)\s(?:our|their|the company's)\s[^.?!]{0,30}\b(?:software|license|kit|training|course|program|certification|materials)\b/g,
    ],
    dampenedBy: ['employer_pays'],
  },
  {
    id: 'form_link',
    title: 'Onboarding forms by link, before any real offer',
    why: 'Identity thieves send a “new hire form” link or document to collect your details. Real onboarding happens in the employer’s HR system after a written offer.',
    step: 4, playbooks: ['identity'], weight: 2,
    patterns: [
      /\b(?:fill|complete|submit)\w{0,3}\s(?:out\s)?(?:the\s|this\s|our\s)?(?:new hire|onboarding|employment|payroll|hiring)?\s?(?:form|forms|paperwork|application)\b[^.?!]{0,50}(?:link|(?:forms\.gle|docs\.google\.com|bit\.ly|tinyurl\.com|jotform\.com|forms\.office\.com)(?:\/[\w\-./?=&%#]{0,100}[\w/])?)/g,
    ],
    dampenedBy: ['hr_portal'],
  },

  // ── Step 5: the ask ─────────────────────────────────────────────────────────
  {
    id: 'send_back_extra',
    title: 'Send back the “extra” money',
    why: 'The classic fake-check move: the check is for more than needed, and you’re asked to send the rest on. The check bounces; the money you sent is real.',
    step: 5, playbooks: ['fake_check'], weight: 3,
    patterns: [
      /\b(?:send|return|refund|transfer|forward|wire|zelle)\w{0,3}\b[^.?!]{0,30}\b(?:remaining|remainder|excess|balance|difference|extra|leftover|rest of the)\b/g,
      /\b(?:overpaid|overpayment|paid you too much|sent (?:you )?too much)\b/g,
    ],
  },
  {
    id: 'pay_the_vendor',
    title: 'Pay the vendor yourself',
    why: 'Once the fake check “clears”, they tell you to pay their vendor. That payment is the theft.',
    step: 5, playbooks: ['fake_check'], weight: 3,
    patterns: [
      /\b(?:pay|send|zelle|transfer|wire|forward)\w{0,3}\s(?:the\s|our\s|that\s)?(?:money\s|funds\s|payment\s)?(?:to\s)?(?:the\s|our\s)?(?:vendor|supplier)\b/g,
      /\b(?:pay|send|zelle|transfer|wire|forward)\w{0,3}\b[^.?!]{0,30}\bto\s(?:the\s|our\s|their\s|an?\s)?(?:approved\s|designated\s|certified\s|preferred\s|authorized\s)?(?:equipment\s)?(?:vendor|supplier)\b/g,
      /\b(?:pay|send|zelle|transfer|wire|forward)\w{0,3}\b[^.?!]{0,30}\bto\s(?:the\s|our\s|their\s|an?\s)?equipment\s(?:partner|provider|company)\b/g,
    ],
  },
  {
    id: 'deposit_to_unlock',
    title: 'Deposit money to unlock work or earnings',
    why: 'This is the turn in a task scam: your account goes “negative” or a “combo task” appears, and you must deposit to keep going or withdraw. You won’t get it back.',
    step: 5, playbooks: ['task'], weight: 3,
    patterns: [
      /\b(?:recharge|top[- ]?up|prepay|pre-pay)\w{0,3}\b[^.?!]{0,30}\b(?:account|balance|tasks?|unlock|level|vip|combo|merge|withdraw)\w{0,4}/g,
      /\bdeposit\w{0,3}\b[^.?!]{0,30}\b(?:to (?:unlock|continue|withdraw|upgrade|activate|complete)|into (?:your |the )?(?:work |task )?account|vip|combo|level)\b/g,
      /\b(?:negative|minus)\s(?:balance|account)\b/g,
      /\b(?:unlock|reset|clear|complete)\w{0,3}\s(?:the\s|your\s|this\s)?(?:next\s)?(?:tasks?|orders?|combo|level|account)\b[^.?!]{0,30}\b(?:deposit|pay|recharge|top)/g,
      /\b(?:combo|lucky|merge|premium|golden|special)\s(?:task|order|product)s?\b/g,
      /\bbalance\b[^.?!]{0,30}-\s?\$?\s?\d[\d,]{0,9}(?:\.\d{1,2})?/g,
      /\b(?:shortfall|insufficient (?:balance|funds))\b/g,
      /\bwithdraw\w{0,4}\b[^.?!]{0,30}\b(?:fee|tax|deposit|unlock|first)\b/g,
    ],
  },
  {
    id: 'hard_to_trace_payment',
    title: 'Paying in a way you can’t undo',
    why: 'Gift cards, crypto, wire transfers and apps like Zelle or Cash App are hard or impossible to reverse. That’s why scammers ask for them.',
    step: 5, playbooks: ['task', 'fake_check', 'upfront_fee'], weight: 3,
    patterns: [
      /(?<=\b(?:send|pay|deposit|transfer|buy|purchase|load|top up|forward|wire)\w{0,3}\b[^.?!]{0,50})\b(?:usdt|bitcoin|btc|crypto(?:currency)?|tether|usdc|ethereum|eth|gift ?cards?|itunes cards?|steam cards?)\b/g,
      /\b(?:usdt|bitcoin|btc|crypto|tether|usdc|gift ?cards?)\b(?=[^.?!]{0,25}\b(?:payment|deposit|to (?:pay|unlock|activate)|wallet address|receipt)\b)/g,
      /\b(?:bitcoin|crypto) atm\b/g,
      /\bgift ?cards?\b[^.?!]{0,20}\b(?:fine|ok|okay|accepted|works?|acceptable|preferred)\b/g,
      /\bwallet address\b/g,
      /(?<=\b(?:send|pay|transfer|wire)\w{0,3}\b[^.?!]{0,30})\b(?:(?:via|through|using|by|with|on)\s)?(?:zelle|cash ?app|venmo|western union|moneygram|paypal friends)\b/g,
      /(?<=\b(?:payment|deposit|fee|payable)s?\b[^.?!]{0,30}\s)(?:via|through|by|using|on)\s(?:zelle|cash ?app|venmo|western union|moneygram|wire transfer|bitcoin|crypto)\b/g,
      /\b(?:photos?|pictures?|pics?|scans?)\sof\s(?:the\s)?(?:card\s|gift card\s)?codes\b/g,
    ],
    // An employer paying you by Zelle is unusual but not this scam.
    unlessSentence: /\bwe pay\b|\bpay you\b|\byou(?:'ll| will)? (?:be|get) paid\b|\bpaid (?:every|weekly|biweekly|via)\b|\bpayroll\b/,
  },
  {
    id: 'identity_request',
    title: 'Asking for your SSN, ID or bank login',
    why: 'Your Social Security number, a photo of your ID or your bank login is all an identity thief needs. Real employers collect tax details in an HR system after a written offer, and never ask for your bank password.',
    step: 5, playbooks: ['identity'], weight: 3,
    patterns: [
      // The gap can't cross a "never" or "not": "send your resume; we never ask for your SSN".
      /\b(?:(?:send|provide|text|share|reply|upload|give|forward|submit)\w{0,3}|email\w{0,2}\s(?:me|us|them|it|back))\b(?:(?!\b(?:never|not|don't|won't|no)\b)[^.?!]){0,100}\b(?:ssn|social security(?: number)?|social|date of birth|dob)\b/g,
      /\b(?:photo|picture|scan|copy|pic|image)s?\sof\s(?:your\s)?(?:id|driver'?s licen[cs]e|licen[cs]e|passport|state id|social security card)\b/g,
      /\bfront and back of (?:your )?(?:id|license|licence|card)\b/g,
      /\b(?:need|require|collect|verify|confirm)\w{0,2}\s(?:your|ur)\b[^.?!]{0,40}\b(?:ssn|social security(?: number)?|date of birth|dob)\b/g,
      /\bwhat(?:'s| is) (?:your|ur) (?:ssn|social security)\b/g,
    ],
    dampenedBy: ['hr_portal'],
  },
  {
    id: 'bank_details',
    title: 'Asking for your bank account numbers',
    why: 'Direct deposit does need your routing and account numbers, but a real employer collects them in its payroll system after a written offer, not by email, text or chat. Sent to a stranger, they can be used to commit fraud in your name.',
    step: 5, playbooks: ['identity'], weight: 3,
    patterns: [
      /\b(?:routing|account) (?:and|&) (?:routing|account) numbers?\b/g,
      /\b(?:send|provide|text|share|reply|give|forward|submit)\w{0,3}\b(?:(?!\b(?:never|not|don't|won't|no)\b)[^.?!]){0,60}\b(?:bank (?:account )?(?:details|info|information|numbers?)|account number|routing number)\b/g,
    ],
    dampenedBy: ['hr_portal'],
  },
  {
    id: 'account_access',
    title: 'Asking for your bank login or card number',
    why: 'No employer needs your online banking password or card number. Direct deposit only takes a routing and account number, entered in a payroll system.',
    step: 5, playbooks: ['identity'], weight: 3,
    patterns: [
      /\b(?:bank|online banking|banking)\s(?:login|log-in|password|username|user name|credentials|pin)\b/g,
      /\b(?:credit|debit) card (?:number|details|info)\b/g,
    ],
  },
  {
    id: 'secrecy',
    title: 'Keep it secret from your bank',
    why: 'Scammers tell you not to talk to your bank because the bank would recognize the scam.',
    step: 5, playbooks: ['fake_check', 'task', 'reshipping'], weight: 2,
    patterns: [
      /\b(?:don't|do not|dont|never)\s(?:tell|inform|mention|discuss|say)\b[^.?!]{0,25}\b(?:bank|anyone|family|teller|friends)\b/g,
      /\bkeep (?:this|it|everything) (?:confidential|private|secret|between us)\b/g,
    ],
    // A recruiter asking to keep a search confidential is normal; secrecy around money isn't.
    needsMessage: /\b(?:bank|check|cheque|deposit|money|payment|funds|transfer|zelle|crypto|gift ?card)\b/,
  },
];

/** Signals of a normal hiring process. They soften related rules and are shown for balance. */
export const LEGIT_CONTEXT: LegitContext[] = [
  {
    id: 'hr_portal',
    title: 'Uses an applicant or HR portal',
    why: 'Real employers collect documents through systems like Workday or Greenhouse after an offer.',
    patterns: [/\b(?:workday|greenhouse|lever\.co|icims|taleo|smartrecruiters|successfactors|bamboohr|adp|paylocity|gusto|rippling|ukg|paycom|dayforce|paychex)\b/g],
  },
  {
    id: 'hr_portal_generic',
    title: 'Mentions an HR or careers portal',
    why: 'Real employers use HR portals, but anyone can call a link a “portal”, so this only softens the weakest signs.',
    patterns: [/\b(?:hr|careers|applicant|candidate|onboarding|employee)\sportal\b/g],
  },
  {
    id: 'video_interview',
    title: 'A video, phone or in-person interview',
    why: 'Talking to a hiring manager face to face is how real hiring works.',
    patterns: [/\b(?:video (?:call|interview|meeting)|on-?site interview|in-person|in person|panel interview|zoom (?:call|link|interview|meeting)|on zoom|google meet|teams (?:meeting|call)|phone (?:screen|interview|call)|(?:video|zoom|phone|teams|meet)\b[^.?!]{0,30}\bhiring manager)\b/g],
  },
  {
    id: 'employer_pays',
    title: 'The employer pays for equipment or checks',
    why: 'Legitimate employers ship equipment or reimburse costs; they don’t ask you to pay first.',
    patterns: [/\b(?:at no cost to you|no cost to you|we (?:will )?cover|we pay for|covered by (?:us|the company)|company[- ]paid|paid (?:for )?by (?:the company|us)|we(?:'ll| will) (?:ship|send) (?:you )?(?:a |your |the )?(?:laptop|equipment|computer)|free of charge|reimburse\w{0,2} (?:you )?(?:against|with|for) (?:your )?receipts|\bwe(?:'ll| will) reimburse (?:you )?(?:after|once|with))\b/g],
  },
  {
    id: 'applied_role',
    title: 'Refers to a job you applied for',
    why: 'Real recruiters reference your actual application.',
    patterns: [/\b(?:thank you for (?:applying|your application)|thanks for applying|your application for|you applied (?:for|to)|regarding your application|job (?:id|req)|requisition|req #?\d)\b/g],
  },
  {
    id: 'safety_warning',
    title: 'Warns you about scams',
    why: 'Real employers often remind candidates they’ll never ask for money or sensitive details by text.',
    patterns: [/\b(?:we|i|they|recruiters?)\s(?:will\s)?(?:never|won't|will not|do not|don't)\s(?:ask|request)\b[^.?!]{0,40}\b(?:money|payment|ssn|social security(?: numbers?)?|bank(?: details| account)?|password|fees?|gift cards?)\b/g],
  },
];

/** Words that, just before a match, flip its meaning ("we will never ask for your SSN"). */
export const NEGATION_BEFORE = /\b(?:never|not|don't|dont|do not|won't|will not|no need (?:to|for)|without)\b[^.?!]{0,40}$/;
