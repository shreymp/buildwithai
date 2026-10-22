// The five job-scam scripts Tipoff knows, plus the shared early steps.
// Each script is written from the FTC's public descriptions of these scams.

import type { NextMove, PlanItem, PlaybookId, Step, Verdict } from './types';

export const SOURCES = {
  jobScams: { href: 'https://consumer.ftc.gov/articles/job-scams', label: 'FTC: Job scams' },
  taskScams: {
    href: 'https://www.ftc.gov/news-events/data-visualizations/data-spotlight/2024/12/paying-get-paid-gamified-job-scams-drive-record-losses',
    label: 'FTC Data Spotlight: gamified job scams',
  },
  reshipping: {
    href: 'https://consumer.ftc.gov/consumer-alerts/2025/12/can-you-unbox-signs-reshipping-scam',
    label: 'FTC alert: reshipping scams',
  },
  report: { href: 'https://reportfraud.ftc.gov', label: 'ReportFraud.ftc.gov' },
  identity: { href: 'https://www.identitytheft.gov/steps', label: 'IdentityTheft.gov' },
  ic3: { href: 'https://www.ic3.gov', label: 'FBI IC3' },
  uspis: { href: 'https://www.uspis.gov/report', label: 'USPIS' },
} as const;

export interface StepCopy {
  label: string;
  detail: string;
}

/** Steps 1–3 are shared by every playbook. */
export const SHARED_STEPS: Record<1 | 2 | 3, StepCopy> = {
  1: { label: 'The hook', detail: 'An unexpected offer: easy work, high pay, little experience needed.' },
  2: { label: 'Off the platform', detail: 'They move you to WhatsApp, Telegram, Signal or text.' },
  3: { label: 'The fast “hire”', detail: 'A chat-only interview and an instant offer.' },
};

export const GENERIC_LATE_STEPS: Record<4 | 5, StepCopy> = {
  4: { label: 'The setup', detail: 'A check, “tasks”, packages, a fee or forms: the mechanism of the scam.' },
  5: { label: 'The ask', detail: 'Your money, your identity or your bank access leaves your hands.' },
};

export interface Playbook {
  id: PlaybookId;
  name: string;
  short: string;
  summary: string;
  steps: Record<4 | 5, StepCopy>;
  /** What to expect after each step, keyed by the step you are on now. */
  next: Record<1 | 2 | 3 | 4, NextMove>;
  stop: NextMove;
  plan: PlanItem[];
  source: { href: string; label: string };
}

const STOP_DONT = 'Don’t send money, codes or personal details, and don’t deposit anything they send.';

export const GENERIC_NEXT: Record<1 | 2 | 3 | 4, NextMove> = {
  1: {
    title: 'They’ll try to move you to a chat app',
    body: 'Next, scam recruiters usually ask you to continue on WhatsApp, Telegram or Signal, often with a “hiring manager” handle to add.',
    dont: 'Keep the conversation where the job was posted, or ask for a video call with a named hiring manager.',
  },
  2: {
    title: 'Next: a “hire” after a chat-only interview',
    body: 'The usual next move is a short interview by text or chat, followed by an instant offer: no video call, no hiring manager, no real paperwork.',
    dont: 'Ask for a video interview and the job posting on the company’s official careers site. A real employer will agree.',
  },
  3: {
    title: 'Next, they’ll ask for something',
    body: 'After the “hire”, job scams branch. Most often you’ll get a check to buy equipment from their vendor, a fee for training or a starter kit, a request for your SSN or bank login “for payroll”, or paid “tasks” in an app.',
    dont: STOP_DONT,
  },
  4: {
    title: 'Next, money or information leaves your hands',
    body: 'The setup ends with an ask: pay someone, deposit to unlock, ship a package, or send your personal details.',
    dont: STOP_DONT,
  },
};

export const GENERIC_STOP: NextMove = {
  title: 'This is the end of the script. Stop here',
  body: 'Scams like this one end when you send money or personal information. Stop replying, don’t send anything, and follow the steps below.',
  dont: STOP_DONT,
};

const COMMON_REPORT: PlanItem = { text: 'Report it, even if you didn’t lose money. Reports help others spot the same script.', link: SOURCES.report };

export const PLAYBOOKS: Record<PlaybookId, Playbook> = {
  fake_check: {
    id: 'fake_check',
    name: 'Fake check and equipment',
    short: 'fake-check',
    summary: 'They “hire” you, mail a check to buy work equipment, and tell you to pay their vendor or send back the extra. The check bounces and you owe the bank.',
    steps: {
      4: { label: 'A check for “equipment”', detail: 'They mail or e-deposit a check to buy a laptop or software from their vendor.' },
      5: { label: 'Pay the vendor, send the extra', detail: 'You pay their vendor or return the “overpayment” before the check bounces.' },
    },
    next: {
      ...GENERIC_NEXT,
      3: {
        title: 'Next: a check to buy equipment',
        body: 'In this script, the next message offers to mail or e-deposit a check so you can buy a laptop or software from their “approved vendor”.',
        dont: 'Don’t deposit a check from someone you’ve never met in person. Real employers ship equipment themselves.',
      },
      4: {
        title: 'Next: pay their vendor or send back the extra',
        body: 'Once the check shows in your account, they’ll ask you to pay their vendor (by Zelle, Cash App, gift cards or crypto) or to return the “extra”. The check bounces days later, and you owe your bank the full amount.',
        dont: 'Don’t send any money. Funds showing in your account don’t mean the check has cleared.',
      },
    },
    stop: { ...GENERIC_STOP, dont: 'Don’t deposit their check, and don’t send money to their vendor or back to them, by any method.' },
    plan: [
      { text: 'Don’t deposit the check. If you already did, call your bank now and tell them it may be fake. Don’t spend or forward the money.' },
      { text: 'Don’t pay any “vendor” or send back an “overpayment”, by any method.' },
      { text: 'Look up the company yourself and contact it through its official website, not through the numbers in these messages.', link: SOURCES.jobScams },
      COMMON_REPORT,
    ],
    source: SOURCES.jobScams,
  },
  task: {
    id: 'task',
    name: 'Pay-to-work “tasks”',
    short: 'task',
    summary: 'You earn small commissions for rating products or liking videos in an app, then must deposit money, often crypto, to unlock tasks or withdraw. The deposits are gone.',
    steps: {
      4: { label: 'Paid “tasks” in an app', detail: 'Rate, like or “optimize” items for small commissions that look real.' },
      5: { label: 'Deposit to unlock or withdraw', detail: 'A “combo task” or negative balance means you must deposit to continue.' },
    },
    next: {
      ...GENERIC_NEXT,
      1: {
        title: 'Next: a “mentor” and an app to sign up for',
        body: 'Task scams usually move you to WhatsApp or Telegram, introduce a mentor, and ask you to register on a work app or website.',
        dont: 'Don’t create an account on a site they link to, and don’t download apps they recommend.',
      },
      2: {
        title: 'Next: simple paid tasks to build trust',
        body: 'Expect a training session and simple tasks: rating hotels, liking videos, “optimizing” apps. Early commissions are real, so you trust the system.',
        dont: 'Don’t deposit anything to “start” or “upgrade”. Real jobs pay you; you never pay them.',
      },
      3: {
        title: 'Next: simple paid tasks to build trust',
        body: 'Expect a training session and simple tasks: rating hotels, liking videos, “optimizing” apps. Early commissions are real, so you trust the system.',
        dont: 'Don’t deposit anything to “start” or “upgrade”. Real jobs pay you; you never pay them.',
      },
      4: {
        title: 'Next: deposit to unlock your earnings',
        body: 'The FTC describes the turn: a “combo” or “lucky” task puts your account negative, and you must deposit money, usually crypto, to continue or withdraw. Every deposit makes the next one bigger.',
        dont: 'Don’t deposit to “unlock”, “reset” or “withdraw”. The balance on screen isn’t real.',
      },
    },
    stop: { ...GENERIC_STOP, dont: 'Don’t deposit, “recharge” or pay a “withdrawal fee”. The balance in their app isn’t real.' },
    plan: [
      { text: 'Stop doing tasks and don’t deposit any money, crypto or gift cards, no matter what the app balance says.' },
      { text: 'If you sent crypto or money, contact the exchange or bank right away, and keep screenshots of the app and chats.', link: SOURCES.ic3 },
      { text: 'Read how these scams work so you can spot the group-chat pressure.', link: SOURCES.taskScams },
      COMMON_REPORT,
    ],
    source: SOURCES.taskScams,
  },
  reshipping: {
    id: 'reshipping',
    name: 'Package reshipping',
    short: 'reshipping',
    summary: 'A “quality control” or “logistics” job where you receive packages at home and reship them with new labels. The goods were bought with stolen cards, and the pay never comes.',
    steps: {
      4: { label: 'Packages to your home', detail: 'You’re asked for your address to receive “company” packages.' },
      5: { label: 'Relabel and ship out', detail: 'You repack items and ship them on with labels they send. You become the fraud’s middleman.' },
    },
    next: {
      ...GENERIC_NEXT,
      3: {
        title: 'Next: packages sent to your home',
        body: 'Next they’ll ask for your home address and say packages are on the way for you to “inspect”.',
        dont: 'Don’t give your home address for receiving company merchandise. That isn’t a real job.',
      },
      4: {
        title: 'Next: relabel and ship them on',
        body: 'They’ll send prepaid labels and ask you to repack and reship the items, often overseas. Your first paycheck will never arrive.',
        dont: 'Don’t ship anything. Keep the packages and labels as evidence.',
      },
    },
    stop: { ...GENERIC_STOP, dont: 'Don’t ship any packages. Keep them and the labels as evidence for the police or postal inspectors.' },
    plan: [
      { text: 'Don’t reship any package. Keep the packages and labels, and stop replying.' },
      { text: 'Report it to the U.S. Postal Inspection Service as well as the FTC.', link: SOURCES.uspis },
      { text: 'Learn the signs of reshipping scams.', link: SOURCES.reshipping },
      COMMON_REPORT,
    ],
    source: SOURCES.reshipping,
  },
  upfront_fee: {
    id: 'upfront_fee',
    name: 'Pay for the job',
    short: 'upfront-fee',
    summary: 'They promise a job if you pay first for training, certification, a background check or a starter kit. After you pay, the job disappears.',
    steps: {
      4: { label: 'A fee to get started', detail: 'Training, certification, a background check or a “starter kit” you must pay for.' },
      5: { label: 'Pay by app, card or crypto', detail: 'They want payment by a method that’s hard to reverse.' },
    },
    next: {
      ...GENERIC_NEXT,
      3: {
        title: 'Next: a fee to get started',
        body: 'In this script, the offer comes with a cost: training, a certification, a background check or a starter kit that you must pay for first.',
        dont: 'Don’t pay to get a job. Real employers pay for their own hiring costs.',
      },
      4: {
        title: 'Next: pay by gift card, app or crypto',
        body: 'They’ll ask you to pay the fee by Zelle, Cash App, gift cards or crypto, which are hard to reverse. More fees often follow.',
        dont: 'Don’t pay any fee. If you already paid by card, call your card issuer to dispute it.',
      },
    },
    stop: { ...GENERIC_STOP, dont: 'Don’t pay any fee, by any method. If you already paid by card, call your card issuer.' },
    plan: [
      { text: 'Don’t pay any fee for training, certification, background checks or equipment.' },
      { text: 'If you paid with a card, call your card issuer and ask to dispute the charge.' },
      { text: 'Search the company name with “scam” or “complaint”, and contact it only through its official website.', link: SOURCES.jobScams },
      COMMON_REPORT,
    ],
    source: SOURCES.jobScams,
  },
  identity: {
    id: 'identity',
    name: 'Identity harvest',
    short: 'identity',
    summary: 'A fake hiring process collects your Social Security number, ID photos and bank details “for payroll”, then uses them to open accounts or steal money in your name.',
    steps: {
      4: { label: '“New hire” forms by link', detail: 'A form or document link that asks for personal details before any real offer.' },
      5: { label: 'Your SSN, ID or bank login', detail: 'They ask for your Social Security number, ID photos or bank access.' },
    },
    next: {
      ...GENERIC_NEXT,
      3: {
        title: 'Next: “paperwork” that collects your identity',
        body: 'Next they’ll send onboarding forms by link or ask directly for your SSN, a photo of your ID and bank details “to set up payroll”.',
        dont: 'Only give tax and bank details in an employer’s official HR system after a written offer, never by text or chat.',
      },
      4: {
        title: 'Next: your SSN, ID and bank details',
        body: 'The forms are a way to collect your Social Security number, ID photos and bank login. That’s everything needed to open accounts in your name.',
        dont: 'Don’t fill in the form. Never share a bank password or a photo of your ID by chat.',
      },
    },
    stop: { ...GENERIC_STOP, dont: 'Don’t send your SSN, ID photos or bank details. If you already did, follow the identity theft steps below.' },
    plan: [
      { text: 'Don’t send your SSN, ID photos or bank login. If you already did, follow the recovery steps at IdentityTheft.gov.', link: SOURCES.identity },
      { text: 'If you shared bank details, call your bank and change your online banking password.' },
      { text: 'Consider a free credit freeze with each of the three credit bureaus.' },
      COMMON_REPORT,
    ],
    source: SOURCES.identity,
  },
};

export const PLAYBOOK_ORDER: PlaybookId[] = ['fake_check', 'task', 'upfront_fee', 'identity', 'reshipping'];

export function stepCopy(step: Step, playbook: PlaybookId | null): StepCopy {
  if (step <= 3) return SHARED_STEPS[step as 1 | 2 | 3];
  return playbook ? PLAYBOOKS[playbook].steps[step as 4 | 5] : GENERIC_LATE_STEPS[step as 4 | 5];
}

/** Plan items for a "worth a closer look" result without a clear playbook. */
export const CAUTION_PLAN: PlanItem[] = [
  { text: 'Don’t send money, codes or personal details until you’ve verified the company yourself.' },
  { text: 'Find the job on the company’s official careers site, and contact the company through its official website, not the numbers in these messages.', link: SOURCES.jobScams },
  { text: 'Ask for a video interview with a named hiring manager. Real recruiters say yes.' },
  COMMON_REPORT,
];

/** Plan items when no known pattern was found. Never says "safe". */
export const VERIFY_PLAN: PlanItem[] = [
  { text: 'Check that the job appears on the company’s own careers site, and that emails come from the company’s domain.' },
  { text: 'Expect a real interview (video, phone or in person) before any offer.' },
  { text: 'Never pay for training or equipment, and only share tax or bank details in an official HR system after a written offer.', link: SOURCES.jobScams },
];

export function replyTemplate(playbook: PlaybookId | null, verdict: Verdict = 'closer_look'): string {
  // With no warning signs, ask only for what any real recruiter can confirm in one reply;
  // a genuine invite may already offer the interview.
  const lines = verdict === 'none'
    ? [
        'Thanks for reaching out! Before I share any personal details, could you confirm:',
        '• the link to this job on your company’s official careers site, and',
        '• your full name, title, and company email address?',
      ]
    : [
        'Thanks for reaching out. Before we go further, could you send:',
        '• the link to this job on your company’s official careers site,',
        '• your full name, title, and company email address, and',
        '• a time for a video interview with the hiring manager.',
      ];
  const tail: Record<PlaybookId | 'none', string> = {
    fake_check: 'I don’t deposit checks or buy equipment for an employer. Please ship any equipment directly.',
    task: 'I don’t pay deposits to unlock work or withdraw earnings.',
    reshipping: 'I don’t receive or reship packages at my home address.',
    upfront_fee: 'I don’t pay for training, certification or background checks.',
    identity: 'I only share tax and bank details through an official HR system after a written offer.',
    none: 'I only share personal details through an official HR system after a written offer, and I don’t pay any fees.',
  };
  return [...lines, '', tail[playbook ?? 'none'], '', 'Thank you!'].join('\n');
}
