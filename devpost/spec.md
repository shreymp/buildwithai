---
doc: spec
status: approved
---

# Tipoff — Technical Spec

## How This Works, In Plain Language
Tipoff is a single web page that runs entirely in your browser. There is no server and no database, and nothing you paste leaves your device.

1. **The reader** splits pasted text into messages. It recognizes WhatsApp exports, "Name: text" lines, and blank-line blocks.
2. **The cleaner** produces a tidy copy of each message for matching. It straightens curly quotes, turns look-alike letters into plain ones, joins spaced-out letters, and fixes number-for-letter swaps. Alongside the copy it keeps a map from every cleaned character back to the original, so highlights land on exactly what you pasted.
3. **The rulebook** is a list of rules. Each rule is a small text pattern plus a plain-English explanation, the script step it belongs to, and the scam playbooks it points to. The rules are ordinary data that anyone can read, and the How it works page renders the same list.
4. **The judge** combines the rule hits:
   - It finds the playbook with the most evidence.
   - It places the conversation on the five-step script.
   - It picks the verdict band. "Likely scam" needs evidence from two steps, one of them a request for money, identity documents, or account access.
   - It writes the "what's next" card from the playbook's next step.
5. **The screen** shows the verdict, the timeline, the highlighted messages, the explanation cards, the action plan and the reply template.

The checking runs in a background worker so the page never freezes. A test proves the page makes no network requests after it loads.

**Why this shape:** a rulebook is explainable, private, free to run, and testable. An AI chatbot would be broader but would send private messages to a server and couldn't show its reasoning.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.
1. The user pastes text and taps **Check**. `CheckPage` sends `{ text, meOverrides }` to `engine.worker.ts`, with a 2-second timeout.
2. In the worker, `parseThread(text)` returns `Message[]`, each with its `speaker`, `side` ('them' | 'me') and original `start`/`end` offsets in the full text.
3. For each message from 'them', `normalize(message.text)` returns `{ norm, map }`, where `map[i]` is the original index for normalized character `i`.
4. `matchRules(norm)` runs every rule's patterns, maps each match back through `map`, and returns `Finding[]` with original-text offsets.
5. `applyContext(findings, messages)` applies the legitimacy dampeners and drops overlapping duplicates.
6. `judge(findings, messages)` returns the `Report`: verdict, playbook, current step, next-move text, findings, legitimacy notes, inspector notes, and action plan.
7. The worker posts the `Report` back. `Results` renders it. `Highlighter` splits each message into segments at every finding boundary and renders `<mark>` buttons.
8. Tapping a mark sets `selectedFindingId`. The matching `FindingCard` scrolls into view and is highlighted; its "Show in message" link returns focus to the mark.

## Stack
- **TypeScript 5.9 + React 19.1** (https://react.dev): a component model suits the many result states. Rationale: familiar to most reviewers, strong typing for the engine data.
- **Vite 6.4** (https://vite.dev): dev server and static build with built-in Web Worker bundling (`new Worker(new URL(...), { type: 'module' })`).
- **Vitest 3.2** (https://vitest.dev): unit and corpus tests for the engine.
- **Playwright 1.56** (https://playwright.dev): end-to-end flows, screenshots, and the zero-network assertion. It uses the preinstalled Chromium.
- **@axe-core/playwright 4.10** (https://github.com/dequelabs/axe-core-npm): automated accessibility checks.
- **Fonts via @fontsource** (self-hosted, no CDN): the families chosen in `DESIGN.md`.
- No UI kit. Styling is plain CSS with custom-property tokens in `src/styles/tokens.css`.
Everything in this list was checked against the npm registry on 2026-10-22.

## Where It Runs and How Someone Tries It
- **Runtime:** any modern browser (desktop or phone). Building requires Node 20 or later. No API keys.
- **Develop:** `npm ci && npm run dev`, then open the printed URL.
- **Production preview:** `npm run build && npm run preview`, then open the printed URL.
- **Tests:** `npm test` (engine), `npm run e2e` (browser flows, accessibility, network), `npm run eval` (prints held-out accuracy; `EVAL_VERSION=v1.x npm run eval` also writes `src/data/accuracy-rerun.json`). *Revised in Phase 3: the blind v1.0 result in `src/data/accuracy.json` is frozen and no longer written by eval (see DECISIONS.md).*
- **Deployment:** GitHub Pages, at the project URL `https://shreymp.github.io/buildwithai/`. `npm run build` with `BASE=/buildwithai/` produces `dist/`, which is published to the `gh-pages` branch. `npm run deploy` does both.
- **Demo recording:** use the deployed URL or `npm run preview`, at phone width (390 px) and desktop width.

## Look and Feel
Implements `prd.md > Look and Feel`. The full research and token values are in `DESIGN.md`.
- Tokens are the only source of color, type, spacing, radius, elevation and motion (`src/styles/tokens.css`).
- One accent color. Verdict colors are paired with an icon and a label.
- Highlights are a marker-style background plus an underline, with a visible focus ring.
- Motion is limited to state changes (timeline step reveal, selected card) and is disabled under `prefers-reduced-motion`.
- Copy follows the voice rules in `DESIGN.md`.

## Components

### Thread parser (`src/engine/thread.ts`)
Splits pasted text into `Message[]`. It handles:
- iOS WhatsApp lines (`[10/18/26, 7:42:10 PM] Name: text`)
- Android WhatsApp lines (`10/18/26, 7:42 PM - Name: text`)
- "Name: text" lines, accepted as speakers only when the name repeats or is short, capitalized and digit-free
- blank-line blocks
- a single message

Lines with no prefix join the previous message. Hidden direction marks (U+200E, U+200F, U+202F) are tolerated. Speakers named Me, You or Myself default to side 'me'.
PRD ref: `prd.md > Input and samples`.

### Normalizer (`src/engine/normalize.ts`)
Returns `{ norm, map }`. It handles:
- length-preserving replacements: curly quotes, non-breaking spaces, newlines treated as spaces, and confusable letters from a table covering Cyrillic and Greek look-alikes in both cases
- zero-width characters, which are removed
- spaced or dotted letter runs, which are collapsed
- number-for-letter swaps inside words containing a letter (but not prices)
- lowercasing

`map` keeps every mapping exact.
PRD ref: `prd.md > Reading the message (the engine)`.

### Rulebook (`src/engine/rules.ts`)
`Rule[]`. Each rule has:
- `id`
- `title`
- `why` (plain-language explanation)
- `step` (1–5)
- `playbooks` (`PlaybookId[]`)
- `weight` (1–3)
- `patterns` (RegExp[] with bounded quantifiers only, so no unbounded `.*` or `+` over `.`)
- optional `dampenedBy` (legitimacy-context ids)

There are also `LEGIT_CONTEXT` rules, which describe signals pointing the other way.
PRD ref: `prd.md > Reading the message (the engine)`, `prd.md > How it works`.

### Playbooks (`src/engine/playbooks.ts`)
Five playbooks: `fake_check`, `task`, `reshipping`, `upfront_fee` and `identity`. Each has:
- a name and a one-line description
- labels and descriptions for steps 4–5
- next-move text for each step
- an action plan
- a reply template
- an FTC source link

There is also a shared `GENERIC` script for steps 1–3.
PRD ref: `prd.md > Script timeline and next move (the kernel)`, `prd.md > Action plan and reply`.

### Inspector (`src/engine/inspect.ts`)
Extracts URLs and email addresses. It flags free-webmail senders, link shorteners and chat-app deep links, IP-address URLs, and punycode domains.
PRD ref: `prd.md > Sender and link notes`.

### Judge (`src/engine/judge.ts`)
`analyze(text, options) → Report`. It handles language and too-short detection, playbook scoring, step placement, the verdict, the next move and the plan.
PRD ref: `prd.md > Verdict`.

### Worker bridge (`src/engine/engine.worker.ts`, `src/lib/runCheck.ts`)
Runs `analyze` off the main thread with a 2-second timeout. If the worker can't start, it falls back to running on the main thread.
PRD ref: `prd.md > States and Boundaries` (Checking, Error).

### UI (`src/ui/*`)
| Component | Role | PRD ref |
|---|---|---|
| `App` | Hash router and top bar | `prd.md > Screens and Layout` |
| `CheckPage` | Input, samples, results area, and states | `prd.md > The Core Journey` |
| `VerdictBanner` | Verdict band | `prd.md > Verdict` |
| `ScriptTimeline` and `NextMoveCard` | Timeline and next-move card | `prd.md > Script timeline and next move (the kernel)` |
| `MessageView` and `Highlighter` | Highlighted messages | `prd.md > Explanations` |
| `FindingList` | Explanation cards | `prd.md > Explanations` |
| `ActionPlan` | What to do now | `prd.md > Action plan and reply` |
| `ReplyTemplate` | Copyable "Verify them" reply | `prd.md > Action plan and reply` |
| `InspectorNotes` | Sender and link notes | `prd.md > Sender and link notes` |
| `HowItWorksPage` | Rules, accuracy, limitations, privacy, sources | `prd.md > How it works` |

## Data Model
- **No persisted data.** Everything lives in React state and is cleared on reload.
- `Message { id, speaker: string | null, side: 'them' | 'me', text, start, end }`
- `Finding { id, ruleId, messageId, start, end, quote, step, playbooks, weight, dampened: boolean }`. The `start`/`end` offsets index into `message.text`.
- `Report { status: 'ok' | 'too_short' | 'not_english', verdict: 'none' | 'closer_look' | 'likely', reason, playbook: PlaybookId | null, playbookScores, currentStep: 0–5, stepsSeen: number[], nextMove: { title, body, dont }, findings, legitSignals, inspector, plan: PlanItem[], reply: string, messages, truncated: boolean }`
- `src/data/samples.ts`: six fictional samples, each labeled as such.
- `src/data/accuracy.json`: the blind v1.0 result, written once by `npm run eval` from `eval/corpus-heldout.json` and frozen since. Committed so the static site can show it. Later, non-blind reruns go to `src/data/accuracy-rerun.json`.

## File Structure
```
buildwithai/
├── index.html                 # app shell
├── package.json               # scripts: dev, build, preview, test, e2e, eval, deploy
├── vite.config.ts             # BASE env → base path; worker format es
├── src/
│   ├── main.tsx               # mounts App, imports fonts and styles
│   ├── engine/                # pure TypeScript, no DOM: testable in Node
│   │   ├── types.ts
│   │   ├── normalize.ts
│   │   ├── thread.ts
│   │   ├── rules.ts
│   │   ├── playbooks.ts
│   │   ├── inspect.ts
│   │   ├── judge.ts           # analyze()
│   │   └── engine.worker.ts
│   ├── lib/runCheck.ts        # worker bridge with timeout and fallback
│   ├── data/samples.ts, accuracy.json
│   ├── ui/                    # React components listed under Components
│   └── styles/tokens.css, base.css, components.css
├── tests/
│   ├── engine/*.test.ts       # unit, regression (legit and scam fixtures), perf
│   └── e2e/*.spec.ts          # Playwright: journey, states, a11y, network, screenshots
├── eval/
│   ├── corpus-heldout.json    # written after rule freeze by an agent that never saw the rules
│   └── run-eval.ts            # prints metrics, writes src/data/accuracy.json
├── scripts/deploy.mjs         # builds with BASE and pushes dist/ to gh-pages
├── spikes/                    # Phase 1 experiments, kept for transparency
├── docs/                      # proposal, critiques, screenshots, demo script, submission
├── devpost/                   # Devpost learning workspace (scope, prd, spec, checklist, app-map)
├── DESIGN.md  DECISIONS.md  PROGRESS.md  tests.json  README.md  LICENSE
```

## External Services and Dependencies
- **None at runtime.** No API, database or analytics.
- **GitHub Pages** hosts the static files (https://docs.github.com/pages). No keys. Free for public repositories.
- **Reporting links** are plain links the user may choose to open: https://reportfraud.ftc.gov, https://www.identitytheft.gov, https://www.ic3.gov.

## Important Failure Modes
- **A legitimate message is flagged**: the user sees exactly which words triggered it and why, plus any signals pointing the other way. The verdict wording stays modest, and "Likely scam" needs evidence from two steps including a money or data ask.
- **A reworded scam is missed**: the lowest band never says safe and always lists what to verify. The How it works page publishes the miss rate and an example.
- **A long or pathological input**: input is capped at 20,000 characters, quantifiers are bounded, the worker has a 2-second timeout, and the user sees the error state with their input kept.
- **The clipboard API is blocked**: the hint to paste manually is shown.

## What Was Simplified and Why
- **Hand-written rules** instead of a trained classifier: there's no labeled real-world dataset in reach, and rules are explainable. The fuller version would train on reported scam narratives (e.g., FTC Consumer Sentinel) with human labels.
- **Static next-move text per playbook step** instead of generated predictions: deterministic and reviewable. The fuller version would learn transitions from real conversation data (research such as PreScam treats this as an open problem).
- **Synthetic, model-written held-out test data** instead of real messages: real ones couldn't be collected safely in the time available. This is stated wherever accuracy is shown.

## Decisions and Open Issues
- **Learner choices:**
  - the job-scam direction
  - hosting on GitHub Pages
  - the agent drafts the submission text
  - "do not rely on me", so the agent decides everything else and logs it in `DECISIONS.md`
- **Implementation details derived from those choices:** React + Vite + TypeScript, the Web Worker, and the token CSS.
- **Genuine uncertainty:** can rules separate scams from tricky legitimate recruiter messages well enough to be credible? Investigation: a frozen rulebook evaluated on a held-out corpus written by an agent that never saw the rules, plus a regression suite of hard legitimate cases. Evidence lives in `src/data/accuracy.json` and `tests/engine`.
- **Open:** real-world accuracy is unknown (synthetic data only), and the GitHub Pages URL can't be fetched from the build sandbox. Deployment is verified through the GitHub API's Pages status.
