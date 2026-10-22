// Shared types for the Tipoff engine. The engine is pure TypeScript with no DOM access,
// so it runs the same in the browser worker, in Vitest, and in the eval script.

export type PlaybookId = 'fake_check' | 'task' | 'reshipping' | 'upfront_fee' | 'identity';

/** The five shared steps of a job-scam script. 4 and 5 get playbook-specific names. */
export type Step = 1 | 2 | 3 | 4 | 5;

export type Side = 'them' | 'me';

export interface Message {
  id: string;
  /** Speaker name as it appeared in the paste, or null when the paste had no names. */
  speaker: string | null;
  side: Side;
  text: string;
  /** Offsets of `text` inside the full pasted input. */
  start: number;
  end: number;
}

export interface Rule {
  id: string;
  title: string;
  /** Plain-language explanation shown on the finding card. */
  why: string;
  step: Step;
  playbooks: PlaybookId[];
  /** 1 = weak/common, 2 = moderate, 3 = strong. */
  weight: 1 | 2 | 3;
  /** Patterns run against normalized (lowercased) text. Bounded quantifiers only. */
  patterns: RegExp[];
  /** Legitimate-context ids that, when present in the same thread, soften this rule. */
  dampenedBy?: string[];
  /** A match is ignored when its sentence also matches this (e.g. "we pay you via Zelle"). */
  unlessSentence?: RegExp;
  /** The rule only applies when the message also matches this (e.g. secrecy needs money talk). */
  needsMessage?: RegExp;
}

export interface LegitContext {
  id: string;
  title: string;
  why: string;
  patterns: RegExp[];
}

export interface Finding {
  id: string;
  ruleId: string;
  title: string;
  why: string;
  messageId: string;
  /** Offsets inside `message.text` (original characters, not normalized). */
  start: number;
  end: number;
  quote: string;
  step: Step;
  playbooks: PlaybookId[];
  weight: number;
  dampened: boolean;
}

export interface LegitSignal {
  id: string;
  title: string;
  why: string;
  messageId: string;
  start: number;
  end: number;
  quote: string;
}

export type InspectorKind = 'free_email' | 'shortener' | 'chat_link' | 'ip_url' | 'punycode';

export interface InspectorNote {
  kind: InspectorKind;
  value: string;
  title: string;
  why: string;
}

export type Verdict = 'none' | 'closer_look' | 'likely';
export type ReportStatus = 'ok' | 'empty' | 'too_short' | 'not_english';

export interface StepView {
  step: Step;
  label: string;
  detail: string;
  seen: boolean;
}

export interface NextMove {
  title: string;
  body: string;
  dont: string;
}

export interface PlanItem {
  text: string;
  link?: { href: string; label: string };
}

export interface Report {
  status: ReportStatus;
  verdict: Verdict;
  reason: string;
  playbook: PlaybookId | null;
  playbookName: string | null;
  playbookScores: Record<PlaybookId, number>;
  currentStep: 0 | Step;
  steps: StepView[];
  nextMove: NextMove | null;
  findings: Finding[];
  legitSignals: LegitSignal[];
  inspector: InspectorNote[];
  plan: PlanItem[];
  reply: string;
  messages: Message[];
  truncated: boolean;
  score: number;
}

export interface AnalyzeOptions {
  /** Speaker names the user marked as themselves. */
  meSpeakers?: string[];
  /** Speaker names the user marked as NOT themselves (overrides the "Me"/"You" default). */
  themSpeakers?: string[];
}
