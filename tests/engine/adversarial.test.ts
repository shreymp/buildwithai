// Regression suite from the Phase 3 adversarial round (eval/adversarial-findings.json).
// The inputs were written by a white-box tester trying to break the engine. Each case
// states the outcome a careful human would expect; "flagged" means closer look or likely.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/engine/judge';
import type { PlaybookId, Verdict } from '../../src/engine/types';
import { cutsWord } from './helpers';

interface Case { id: string; category: string; input: string }
const cases = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../eval/adversarial-findings.json'), 'utf8')) as Case[];
const byId = new Map(cases.map((c) => [c.id, c]));

type Expect = {
  verdict?: Verdict | 'flagged';
  playbook?: PlaybookId | null;
  rule?: string;
  notPlaybook?: PlaybookId;
  step?: number;
  /** Speakers the user ticked as themselves. */
  me?: string[];
};

const EXPECT: Record<string, Expect> = {
  // Parsing: nothing the other person wrote may be dropped.
  labels_drop_body: { verdict: 'likely', playbook: 'fake_check' },
  fn_next_steps_labels: { verdict: 'likely', playbook: 'fake_check' },
  outlook_chain_sent: { verdict: 'flagged', playbook: 'fake_check' },
  fp_labels_drop_workday: { verdict: 'none' },
  fn_wa_multiline_parse: { verdict: 'likely', playbook: 'identity' },
  // Untold who the user is, Tipoff keeps the more cautious reading, so Jordan's own question
  // about depositing a check is scored. Once Jordan is ticked as the user, nothing is left.
  wa_copy_time_first: { verdict: 'none', me: ['Jordan Lee'] },
  gmail_quoted_reply: { verdict: 'none' },
  truncation_email_newest_on_top: { verdict: 'flagged', playbook: 'fake_check' },
  // Language detection and obfuscation
  terse_sms_not_english: { verdict: 'flagged', rule: 'move_to_chat' },
  bold_unicode_full: { verdict: 'flagged', rule: 'move_to_chat' },
  bold_unicode_post: { verdict: 'flagged', rule: 'move_to_chat' },
  chat_WA_abbrev: { verdict: 'flagged', rule: 'move_to_chat' },
  telegram_handle_only: { verdict: 'flagged', rule: 'move_to_chat' },
  personal_email_rule: { rule: 'personal_email' },
  // Negation and legitimacy signals the scammer controls
  neg_dont_forget_id: { verdict: 'flagged', playbook: 'identity' },
  neg_dont_hesitate_chat: { verdict: 'flagged', rule: 'move_to_chat', step: 2 },
  fn_phish_onboarding_portal: { verdict: 'likely', playbook: 'identity' },
  fn_no_video_needed: { verdict: 'flagged', rule: 'move_to_chat' },
  fp_fraud_footer: { verdict: 'none' },
  fp_fraud_footer2: { verdict: 'none' },
  // Rule wording gaps
  identity_need_ssn: { verdict: 'flagged', playbook: 'identity' },
  upfront_program_fee: { verdict: 'flagged', playbook: 'upfront_fee' },
  reshipping_logistics: { verdict: 'flagged', playbook: 'reshipping' },
  task_short_ask: { verdict: 'flagged', playbook: 'task' },
  pass_reshipping: { verdict: 'likely', playbook: 'reshipping', step: 5 },
  upfront_purchase_our_software: { verdict: 'flagged', playbook: 'upfront_fee' },
  upfront_registration_giftcard: { verdict: 'flagged', notPlaybook: 'fake_check' },
  // Genuine messages
  fp_adp_direct_deposit: { verdict: 'none' },
  fp_signon_bonus_check: { verdict: 'none' },
  fp_confidential_search: { verdict: 'none' },
  fp_small_biz_zelle: { verdict: 'none' },
  fp_it_vendor: { verdict: 'none' },
  fp_contract_rate: { verdict: 'none' },
  fp_mailroom_post: { verdict: 'none' },
  // Cases that already worked and must keep working
  wa_ios_export: { verdict: 'likely', playbook: 'fake_check' },
  android_export_24h: { verdict: 'likely', playbook: 'task' },
  pass_wa_ios_u202f: { verdict: 'likely', playbook: 'identity' },
  obf_spaced_whatsapp: { verdict: 'flagged', rule: 'move_to_chat' },
  obf_zero_width: { verdict: 'likely', playbook: 'identity' },
  obf_leet_mixed: { verdict: 'likely', playbook: 'upfront_fee' },
  obf_emoji_linebreak: { verdict: 'likely' },
  pass_partial_cyrillic: { verdict: 'likely', playbook: 'fake_check' },
  pass_legit_workday_onboarding: { verdict: 'none' },
  pass_legit_recruiter_li: { verdict: 'none' },
  perf_named_eng: {},
};

// Not expected to change in this round (low severity, recorded in docs/phase3/round1.md):
// fp_olivia_chatbot (a real chatbot's "Reply YES to start a chat-based screening").
const ACCEPTED = new Set(['fp_olivia_chatbot']);

describe('adversarial round 1', () => {
  it('every case in the findings file has an expectation or is explicitly accepted', () => {
    for (const c of cases) expect(EXPECT[c.id] !== undefined || ACCEPTED.has(c.id), c.id).toBe(true);
  });

  for (const [id, want] of Object.entries(EXPECT)) {
    it(id, () => {
      const c = byId.get(id);
      expect(c, `missing case ${id}`).toBeDefined();
      const r = analyze(c!.input, { meSpeakers: want.me ?? [] });
      const active = new Set(r.findings.filter((f) => !f.dampened).map((f) => f.ruleId));
      const got = { verdict: r.verdict, playbook: r.playbook, step: r.currentStep, rules: [...active] };
      if (want.verdict === 'flagged') expect(r.verdict, JSON.stringify(got)).not.toBe('none');
      else if (want.verdict) expect(r.verdict, JSON.stringify(got)).toBe(want.verdict);
      if (want.playbook !== undefined) expect(r.playbook, JSON.stringify(got)).toBe(want.playbook);
      if (want.notPlaybook) expect(r.playbook, JSON.stringify(got)).not.toBe(want.notPlaybook);
      if (want.rule) expect(active.has(want.rule), JSON.stringify(got)).toBe(true);
      if (want.step) expect(r.currentStep, JSON.stringify(got)).toBe(want.step);
      // Highlights point at exactly the quoted text and never cut a word in half.
      for (const f of r.findings) {
        const m = r.messages.find((x) => x.id === f.messageId)!;
        expect(m.text.slice(f.start, f.end)).toBe(f.quote);
        expect(cutsWord(m.text, f.start, f.end), `${f.ruleId}: «${f.quote}»`).toBe(false);
      }
    });
  }
});
