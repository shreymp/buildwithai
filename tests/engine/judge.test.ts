import { describe, expect, it } from 'vitest';
import { analyze, MAX_INPUT } from '../../src/engine/judge';
import { RULES } from '../../src/engine/rules';
import { GENERIC_STOP, PLAYBOOKS, PLAYBOOK_ORDER } from '../../src/engine/playbooks';
import { SAMPLES, sampleText } from '../../src/data/samples';
import { cutsWord } from './helpers';

const demo = SAMPLES.find((s) => s.id === 'fake-check-thread')!;

describe('samples', () => {
  for (const s of SAMPLES.filter((x) => x.kind === 'scam')) {
    it(`flags the "${s.label}" scam sample with at least 3 explained findings`, () => {
      const r = analyze(sampleText(s));
      expect(r.verdict).not.toBe('none');
      const active = r.findings.filter((f) => !f.dampened);
      expect(new Set(active.map((f) => f.ruleId)).size).toBeGreaterThanOrEqual(3);
      for (const f of active) expect(f.why.length).toBeGreaterThan(20);
      expect(r.playbook).not.toBeNull();
    });
  }
  it('names the right playbook for each scam sample', () => {
    const want: Record<string, string> = { 'fake-check-thread': 'fake_check', 'task-scam': 'task', 'training-fee': 'upfront_fee', 'identity-form': 'identity' };
    for (const [id, pb] of Object.entries(want)) expect(analyze(sampleText(SAMPLES.find((s) => s.id === id)!)).playbook, id).toBe(pb);
  });
  for (const s of SAMPLES.filter((x) => x.kind === 'legit')) {
    it(`does not flag the "${s.label}" legitimate sample`, () => {
      const r = analyze(sampleText(s));
      expect(r.verdict).toBe('none');
      expect(r.legitSignals.length).toBeGreaterThan(0);
    });
  }
});

describe('the demo thread: the prediction comes true', () => {
  it('first message: off the platform (step 2), predicts a chat-only "hire"', () => {
    const r = analyze(sampleText(demo, 1));
    expect(r.verdict).toBe('closer_look');
    expect(r.currentStep).toBe(2);
    expect(r.nextMove?.title).toMatch(/chat-only interview/i);
  });
  it('after the interview and "hire": step 3, predicts an ask such as a check for equipment', () => {
    const r = analyze(sampleText(demo, 4));
    expect(r.currentStep).toBe(3);
    expect(r.nextMove?.body).toMatch(/check to buy equipment/i);
  });
  it('the check arrives: fake-check playbook at step 4, predicts paying the vendor', () => {
    const r = analyze(sampleText(demo, 5));
    expect(r.verdict).toBe('likely');
    expect(r.playbook).toBe('fake_check');
    expect(r.currentStep).toBe(4);
    expect(r.nextMove?.title).toMatch(/pay their vendor/i);
  });
  it('full thread: step 5, stop-here guidance, plan says not to deposit', () => {
    const r = analyze(sampleText(demo));
    expect(r.currentStep).toBe(5);
    expect(r.nextMove?.title).toMatch(/stop here/i);
    expect(r.plan[0].text).toMatch(/don’t deposit the check/i);
    expect(r.messages.filter((m) => m.side === 'me')).toHaveLength(1);
  });
  it('never scores the user’s own messages', () => {
    const r = analyze(sampleText(demo));
    const mine = new Set(r.messages.filter((m) => m.side === 'me').map((m) => m.id));
    expect(r.findings.some((f) => mine.has(f.messageId))).toBe(false);
  });
});

describe('the verdict reason only claims what happened', () => {
  it('does not mention a money request before one is made', () => {
    const demo4 = analyze(sampleText(demo, 4));
    expect(demo4.verdict).toBe('likely');
    expect(demo4.reason).not.toMatch(/including a request/);
    expect(demo4.reason).toMatch(/haven’t asked for money/);
    expect(analyze(sampleText(demo)).reason).toMatch(/including a request that puts your money/);
  });
});

describe('copy fits the case (blind review, round 2)', () => {
  it('never says "job job" and gives stop advice that fits each script', () => {
    for (const s of SAMPLES) {
      const r = analyze(sampleText(s));
      expect(r.reason, s.id).not.toMatch(/job job/);
    }
    for (const id of PLAYBOOK_ORDER) {
      expect(PLAYBOOKS[id].stop.dont, id).not.toBe(GENERIC_STOP.dont);
    }
    expect(PLAYBOOKS.identity.stop.dont).not.toMatch(/deposit/);
    expect(PLAYBOOKS.upfront_fee.stop.dont).not.toMatch(/deposit/);
  });
  it('does not ask a clean-looking recruiter for an interview they may have offered', () => {
    const legit = analyze(sampleText(SAMPLES.find((x) => x.id === 'legit-recruiter')!));
    expect(legit.verdict).toBe('none');
    expect(legit.reply).not.toMatch(/video interview/);
    expect(analyze(sampleText(demo)).reply).toMatch(/video interview/);
  });
  it('quotes a scam warning to the end of the phrase', () => {
    const legit = analyze(sampleText(SAMPLES.find((x) => x.id === 'legit-recruiter')!));
    expect(legit.legitSignals.find((l) => l.id === 'safety_warning')?.quote).toMatch(/Social Security number$/);
  });
});

describe('reshipping needs packages, not just the word "forward"', () => {
  it('does not flag a recruiter forwarding a resume for a remote job', () => {
    const r = analyze('Hi Sam, I’ve forwarded your resume to the hiring manager for the remote analyst role. You can work from home three days a week. Talk soon!');
    expect(r.findings.map((f) => f.ruleId)).not.toContain('reship_out');
    expect(r.verdict).toBe('none');
  });
});

describe('guessing who the user is', () => {
  const export_ = (lines: [string, string][]) => lines.map(([who, text], i) => `[10/18/26, 7:4${i}:00 PM] ${who}: ${text}`).join('\n');
  it('takes the person greeted by name as the user', () => {
    const r = analyze(export_([
      ['Lisa HR', 'Hello Jordan, to finish payroll setup send your SSN and a photo of your driver’s license here today.'],
      ['Jordan Lee', 'Is there a Workday or HR portal I can use instead?'],
    ]));
    expect(r.messages.filter((m) => m.side === 'me').map((m) => m.speaker)).toEqual(['Jordan Lee']);
    expect(r.legitSignals).toHaveLength(0);
    expect(r.verdict).not.toBe('none');
  });
  it('never lets a wrong guess hide the scammer: a victim greeting the scammer still gets a warning', () => {
    const r = analyze(export_([
      ['Jordan Lee', 'Hi Lisa, I saw your message about the remote job.'],
      ['Lisa HR', 'Great! We will mail you a company check for $2,850 to buy your laptop from our approved vendor. Use mobile deposit, then send the rest to the vendor through Zelle.'],
    ]));
    expect(r.verdict).toBe('likely');
    expect(r.messages.find((m) => m.speaker === 'Lisa HR')!.side).toBe('them');
  });
});

describe('findings point at the exact original text', () => {
  it('never cuts a word in half in any sample', () => {
    for (const s of SAMPLES) {
      const r = analyze(sampleText(s));
      for (const f of r.findings) {
        const m = r.messages.find((x) => x.id === f.messageId)!;
        expect(cutsWord(m.text, f.start, f.end), `${s.id} ${f.ruleId}: «${f.quote}»`).toBe(false);
      }
    }
  });
  it('quotes match message text at the reported offsets, including obfuscated input', () => {
    const r = analyze('Hi! Pls contact our HR on t e l e g r a m. You will need to pay a one-time tra1ning fee of $89 via Zelle ASAP.');
    for (const f of r.findings) {
      const m = r.messages.find((x) => x.id === f.messageId)!;
      expect(m.text.slice(f.start, f.end)).toBe(f.quote);
    }
    expect(r.findings.map((f) => f.ruleId)).toEqual(expect.arrayContaining(['move_to_chat', 'pay_for_job', 'hard_to_trace_payment']));
  });
});

describe('hard legitimate messages (regression)', () => {
  const legit = [
    'Hi Sam, I came across your profile on our careers site. Pay includes paid training. If selected you could start immediately. Please send availability and check your inbox for the invite.',
    'Congrats, you have been selected to move forward! Please enter your SSN and date of birth in Workday to complete onboarding.',
    'Hi! I lead recruiting at a crypto exchange. We are hiring a Bitcoin protocol engineer, remote, $180k. Would you be open to a video call with the hiring manager next week?',
    'Reminder: your on-site interview is Tuesday at 10am. Please bring a photo ID to the front desk. We never ask candidates for money or bank details.',
    'Your new laptop ships Friday at no cost to you. IT will send setup instructions to your company email.',
    'We reviewed your application for the warehouse associate role. Paid training starts Monday and you can start immediately after. Please complete your I-9 in our HR portal.',
    'Thanks for your time on the phone screen today! Next step is a panel interview over Zoom with the team.',
    'Unfortunately we have decided to move forward with other candidates. Thank you for your interest in Halverson Foods.',
    'Hi, I am a staffing agency recruiter. Our client pays $24/hr for this remote customer service role. Can we set up a quick phone call? Text me back at this number if WhatsApp is easier for you.',
  ];
  for (const text of legit) {
    it(`is not "likely scam": ${text.slice(0, 50)}…`, () => {
      const r = analyze(text);
      expect(r.verdict).not.toBe('likely');
      expect(r.verdict, r.findings.map((f) => f.ruleId).join(',')).toBe('none');
    });
  }
  it('respects negation ("we will never ask for your SSN")', () => {
    const r = analyze('Please note: we will never ask you to send your SSN or bank login by text. Apply on our careers site.');
    expect(r.findings.map((f) => f.ruleId)).not.toContain('identity_request');
  });
});

describe('states', () => {
  it('empty input', () => expect(analyze('   ').status).toBe('empty'));
  it('too short', () => expect(analyze('Hi, job for you').status).toBe('too_short'));
  it('not English', () => {
    expect(analyze('Hola, tenemos un trabajo desde casa para usted con un pago muy alto por día. Escríbanos por WhatsApp para más información sobre el puesto.').status).toBe('not_english');
    expect(analyze('Здравствуйте! У нас есть работа на дому с высокой оплатой. Напишите нам в Телеграм для подробностей.').status).toBe('not_english');
  });
  it('no pattern found is never called safe', () => {
    const r = analyze('Hi Sam, following up on our call yesterday about the analyst position. The team enjoyed meeting you.');
    expect(r.verdict).toBe('none');
    expect(r.reason).not.toMatch(/\b(?:is|looks|seems)\s(?:safe|legit)/i);
    expect(r.reason).toMatch(/isn’t proof/);
  });
  it('trims very long input to the most recent text', () => {
    const r = analyze('filler words here. '.repeat(2000) + 'Add me on Telegram to continue, pay the $50 training fee in gift cards.');
    expect(r.truncated).toBe(true);
    expect(r.messages[0].text.length).toBeLessThanOrEqual(MAX_INPUT);
    expect(r.verdict).not.toBe('none');
  });
});

describe('performance and safety', () => {
  const adversarial = [
    'a.'.repeat(10_000),
    'x'.repeat(20_000),
    'pay '.repeat(5_000),
    '$1000 per '.repeat(2_000),
    'send the check to the vendor '.repeat(700),
    'aaaa@'.repeat(4_000),
    ('t e l e g r a m ').repeat(1_200),
  ];
  for (const text of adversarial) {
    it(`finishes in under 300 ms on ${text.slice(0, 12)}… (${text.length} chars)`, () => {
      const t = performance.now();
      analyze(text);
      expect(performance.now() - t).toBeLessThan(300);
    });
  }
  it('every rule pattern uses the global flag and no unbounded wildcard', () => {
    for (const r of RULES) for (const p of r.patterns) {
      expect(p.flags).toContain('g');
      expect(p.source, `${r.id}: ${p.source}`).not.toMatch(/\.\*|\.\+|\[\^[^\]]*\]\*|\[\^[^\]]*\]\+/);
    }
  });
});
