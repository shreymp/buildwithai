// Phase 3 round 3: messages written by a judge-perspective critic who had never seen the
// rules (docs/phase3/round3.md). The scams were under-called or left their key ask
// unhighlighted; the genuine ones must stay unflagged.
import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/engine/judge';
import { scamName } from '../../src/engine/playbooks';
import { cutsWord } from './helpers';

const quotes = (text: string, ruleId?: string) =>
  analyze(text).findings.filter((f) => !f.dampened && (!ruleId || f.ruleId === ruleId)).map((f) => f.quote.toLowerCase());

const S4 = 'Welcome aboard! To complete your onboarding for the Data Analyst role, please reply to this email with a clear photo of your driver’s license front and back, your Social Security number, and your bank routing and account number for direct deposit. Orientation starts tomorrow morning, so please send everything today.';
const S6 = 'Hi Taylor, you’ve been shortlisted for the Remote Billing Coordinator job. Before we can send your offer letter, you need to clear a background check. The processing fee is $65, payable via Cash App to $HRVerifyCenter. Send a screenshot of the payment and I’ll forward your offer within the hour.';
const S8 = 'Hi Ben, the team was impressed with your chat interview and we’d like to extend an offer for the Remote Admin Support role. Our accounts department will send you funds via an e-check to cover your home office setup. Once you receive it, forward $1,900 to our equipment partner using Bitcoin from the ATM at a nearby store. Keep the remaining balance as your first-week stipend.';
const P2 = 'Congratulations, you got the job! Before you start, you need to buy the onboarding software license. Please purchase three $100 Apple gift cards at any Walmart and send me photos of the codes on the back.';
const P3 = [
  'HR Team: Hi Kim, we have a remote role paying $800/week. You receive packages at your home, check them, and send them on.',
  'Kim: Sounds good. My address is 12 Elm St, Dayton OH.',
  'HR Team: Thanks Kim. First package arrives tomorrow, ship it out with the label within 24 hours.',
].join('\n');
const S3 = 'Congratulations! After reviewing your answers from the Google Hangouts chat, the hiring manager has selected you for the Remote Customer Service Representative position. You will receive a cheque of $3,850 via FedEx tomorrow. Deposit it through your bank app and purchase your MacBook and software from our certified supplier. Supplier payment details will be sent once the funds reflect in your account.';

describe('round 3: scams that were under-called', () => {
  it('S4: ID photo, SSN and bank numbers by email reply is "Likely scam", with the SSN highlighted', () => {
    const r = analyze(S4);
    expect(r.verdict).toBe('likely');
    expect(r.playbook).toBe('identity');
    expect(quotes(S4).some((q) => q.includes('social security'))).toBe(true);
  });
  it('S6: a background-check fee payable via Cash App is "Likely scam", with Cash App highlighted', () => {
    const r = analyze(S6);
    expect(r.verdict).toBe('likely');
    expect(r.playbook).toBe('upfront_fee');
    expect(quotes(S6, 'hard_to_trace_payment').some((q) => q.includes('cash app'))).toBe(true);
    expect(r.currentStep).toBe(5);
  });
  it('S8: forwarding money to an "equipment partner" in Bitcoin is step 5 and highlighted', () => {
    const r = analyze(S8);
    expect(r.verdict).toBe('likely');
    expect(r.playbook).toBe('fake_check');
    expect(r.currentStep).toBe(5);
    expect(quotes(S8).some((q) => q.includes('bitcoin'))).toBe(true);
  });
  it('P2: gift cards for an "onboarding software license" names the pay-for-the-job script; the hire highlight keeps "job"', () => {
    const r = analyze(P2);
    expect(r.verdict).toBe('likely');
    expect(r.playbook).toBe('upfront_fee');
    const hire = r.findings.find((f) => f.ruleId === 'instant_hire')!;
    expect(hire.quote.toLowerCase()).toContain('you got the job');
    expect(cutsWord(P2, hire.start, hire.end)).toBe(false);
  });
  it('P3: "ship it out with the label" in a later message is the reshipping step 5', () => {
    const r = analyze(P3, { meSpeakers: ['Kim'] });
    expect(r.playbook).toBe('reshipping');
    expect(r.currentStep).toBe(5);
    expect(r.verdict).toBe('likely');
    expect(r.findings.some((f) => f.ruleId === 'reship_out' && /label/i.test(f.quote))).toBe(true);
  });
});

describe('round 3: copy fits the numbers', () => {
  it('one step and one sign read as singular', () => {
    expect(analyze(S3).reason).not.toMatch(/\b1 steps\b/);
    const one = analyze('Hi, please send me your Social Security number so I can get you set up for the role today.');
    expect(one.reason).toMatch(/^1 warning sign that matches/);
    // A lone step-5 sign is the end of the script, not its start.
    expect(one.reason).not.toMatch(/the start of/);
  });
  it('a script name that ends in "job" isn’t doubled', () => {
    expect(scamName('upfront_fee')).toBe('the pay for the job scam');
    expect(scamName('fake_check')).toBe('the fake check and equipment job scam');
  });
});

describe('round 3: a single request is "check this", not "stop, it’s over"', () => {
  it('a lone SSN request is "Worth a closer look" with a check-the-request card, not the end-of-script card', () => {
    const r = analyze('Hi, please send me your Social Security number so I can get you set up for the role today.');
    expect(r.verdict).toBe('closer_look');
    expect(r.currentStep).toBe(5);
    expect(r.nextMove?.title).not.toMatch(/end of the script|stop here/i);
    expect(r.nextMove?.title).toMatch(/before you send/i);
  });
  it('"Likely scam" at step 5 still ends the script', () => {
    expect(analyze(S6).nextMove?.title).toMatch(/stop here/i);
  });
});

describe('round 3: genuine messages stay unflagged', () => {
  const genuine: Record<string, string> = {
    P4_background_check: 'Hi Morgan, congratulations on your offer for the Billing Specialist role! The next step is a background check. You’ll get an email from Sterling asking you to enter your Social Security number and consent in their secure portal. There is no cost to you. Let me know once it’s done. Thanks, Priya, Talent Team',
    G1: 'Hi Priya, thanks for applying to the Junior Data Analyst role at Northwind Health. I’d love to set up a 30-minute phone screen with you this week to talk about your background and the team. Here’s my calendar link: https://calendly.com/dana-kim-northwind/30min. Feel free to pick any time that works. Best, Dana Kim, Talent Acquisition, Northwind Health',
    G2: 'Hi Marcus, I’m a technical recruiter at Brightwave. We’re hiring a fully remote Customer Support Specialist, $22-$26/hr with full benefits, and no prior SaaS experience is needed since we train everyone. Your experience at Target looks like a great fit. Would you be open to a quick call? You can also see the posting and apply directly at brightwave.com/careers.',
    G3: 'Congratulations again on accepting our offer! Before your start date on March 3, please complete your onboarding tasks in Workday: your I-9 (bring your original identity documents on your first day for verification), your W-4, and direct deposit setup. IT will ship your laptop to your home at no cost to you. If you have any questions, reply here or call me at the number in my signature. - Rachel, People Team, Acme Corp',
    G5: 'Hi Sam, we’re excited to offer you the Remote Customer Success Associate position at Lumen Analytics at $58,000/year. The formal offer letter is attached; please review and sign it through DocuSign by Friday. We provide a laptop and a $300 home-office stipend that is added to your first paycheck. Your manager, Tom Reyes, will reach out about your first-week schedule.',
    resume_then_warning: 'Please send your resume and two references to this email by Friday, and remember that we will never ask for your Social Security number before a written offer.',
  };
  for (const [id, text] of Object.entries(genuine)) {
    it(id, () => expect(analyze(text).verdict, quotes(text).join(' | ')).toBe('none'));
  }
});
