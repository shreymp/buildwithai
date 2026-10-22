# DECISIONS.md

Source of truth for assumptions, tests, and decisions. Newest entries at the bottom of each section.

## 0. Rules and constraints (Phase 1, step 1)

**Could not open the official rules page directly.** `learn-ai-basics.devpost.com` is blocked by this sandbox's network policy (`getaddrinfo ENOTFOUND` / proxy 403). What I could verify:

| Item | Status | Source |
|---|---|---|
| Deadline Oct 26 2026 5:00 pm EDT; judging Oct 27–30; winners ~Nov 4 | Seen in search snippets of the rules page | WebSearch results quoting learn-ai-basics.devpost.com/rules |
| Demo video "less than three (3) minutes" | Seen in search snippet | same |
| Public repo + demo video required; deployment optional | Verified | Skill Pack `README.md`, `skills/6-ship/SKILL.md` (cloned from github.com/challengepost/learn-ai-basics, MIT) |
| Stage 1 pass/fail on scope.md / prd.md / spec.md; Stage 2 = Design, Potential Impact, Innovation/Idea, Presentation at 25% each | **From the user's brief only — not independently verified** | user |
| 18+ / age of majority; some countries excluded | Third-party listing (Internshala) — secondhand | WebSearch |
| "Project must run on the platform for which it is intended" | Seen in search snippet | rules page snippet |
| ~4,356 registered participants (approximate, from listing) | Secondhand | search summary of learn-ai-basics.devpost.com |

**Skill Pack facts that constrain the build (verified by reading the files):**
- Planning docs live at `devpost/scope.md`, `devpost/prd.md`, `devpost/spec.md`, with `status: draft|approved` frontmatter, built from fixed templates. `5-build` adds `devpost/checklist.md` (machine-readable field labels) and `devpost/app-map.html`.
- `devpost/learner-profile.md` must stay out of commits (`.gitignore`).
- The pack is explicitly **learner-led**: the agent must not invent the learner's intentions; product decisions are the learner's.
- `6-ship` says the **project name, short description, submission answers, and exit survey must be written by the human**; the agent may only fix spelling/grammar and "won't draft or rewrite them". This conflicts with the user's deliverable "submission materials drafted". **Flagged to user (open question Q1).** Default if no answer: produce a factual *fact sheet* (features, how it works, links, disclosures) and leave prose fields for the user.

**Ambiguities that matter:**
- A1. Whether official rules (not just the Skill Pack) require human-written submission text. Unverified → treat the Skill Pack rule as binding.
- A2. How judges view an agent-run, unattended build in a "learn" hackathon. The rules (per brief) only require the docs to show Skill Pack use. Mitigation: planning docs record the user's real decisions from the approval conversation; process is disclosed honestly in README.
- A3. Pre-existing code: none. Repo was empty on 2026-10-22. Third-party libraries will be listed with licenses in README.

## 1. Environment constraints discovered

- Outbound network from this container: only package registries (npm, PyPI) and a few hosts. General web, HuggingFace, CDNs, government APIs are blocked. → **Any idea depending on a live external API cannot be spiked here.** Strong preference for a self-contained, client-side app.
- No Anthropic API key provided. Environment has other credentials (cloud/OpenAI-compatible) that belong to the environment, **not authorized for product use** → the shipped product will not depend on a paid LLM API. (Open question Q3 to user.)
- Chromium + Playwright + ffmpeg available → screenshots, axe checks, and screen recording of the demo are possible.

## 2. Directions considered (Phase 1, step 3)

| # | Direction | User | Mechanism | Framing | Outcome |
|---|---|---|---|---|---|
| 1 | Job-scam playbook reader | job seekers getting unsolicited recruiter texts/DMs | explainable rules over a message *thread*, mapped to 5 FTC-described scam scripts | "know the scammer's next move" | **Shortlisted → chosen (pending approval)** |
| 2 | Subscription detective | anyone with a bank account | time-series recurrence detection over bank CSV, in-browser | money leak | Shortlisted → runner-up |
| 3 | Receipt split via on-device OCR | friends splitting a bill | tesseract.js OCR + line-item parser | fairness | Shortlisted → dropped |
| 4 | Plain-language checker for public notices | local-government/nonprofit writers | readability metrics + plain-language lexicon | comprehension equity | Not shortlisted: Hemingway Editor etc. cover most of it |
| 5 | Product-recall radar | households | CPSC/NHTSA recall APIs | safety | Not shortlisted: depends on external APIs that cannot be spiked from this sandbox |
| 6 | Volunteer shift matcher | nonprofit coordinators | constraint solving | operations | Not shortlisted: generic, weak demo moment |

## 3. Spike results (Phase 1, step 4) — what was actually run

- **Scam rules (idea 1).** `spikes/scam/engine.mjs`: 19 signal families written from FTC-described patterns *before* seeing test data. Held-out corpus `spikes/scam/corpus.json` (40 items: 20 scams across 5 playbooks, 20 hard-negative legit messages) was written by a separate subagent that never saw the rules. Blind result (`node spikes/scam/eval.mjs`): **recall 0.95 (19/20), precision 0.79 (5 FPs, all single-signal "caution"), playbook ID 15/19.** Worst-case runtime on 50–80k-char adversarial inputs: ≤14 ms (no catastrophic backtracking observed on those inputs; not a proof). Caveat: corpus is synthetic and written by a model; it is not real-world accuracy. Because I have now seen which items fail, this corpus is **burned for tuning**; a fresh held-out corpus will be written after rules are frozen.
- **Recurring-charge detector (idea 2).** `spikes/subs/detect.mjs` written blind; data from an independent seeded generator `spikes/subs/gen.js` (5 accounts, 13 months, 4 CSV layouts). Result (`node spikes/subs/eval.mjs`): **recall 0.68, precision 0.86, cadence 40/43, price increases 6/6.** Most misses = merchant-descriptor grouping. Viable but needs fuzzy clustering; demo data necessarily synthetic.
- **On-device OCR (idea 3).** `spikes/ocr/ocr.mjs`: tesseract.js 6 + `@tesseract.js-data/eng` runs fully offline in Node, 875 ms incl. init, on a Playwright-rendered receipt. **Misread TOTAL 70.09 as 76.09** on a clean render → money-critical parsing unreliable without arithmetic checks; real photos would be worse. Dropped as a core; kept as a possible *stretch* input path for idea 1 (screenshots of chat text, where a misread digit does not change the verdict).

## 4. Assumptions the plan depends on

| Assumption | How it is tested | Result that would change the plan |
|---|---|---|
| H1. Transparent rules can separate job scams from realistic legit recruiter messages well enough to be credible to a judge who types their own message | Fresh held-out corpus written after rule freeze by an agent that never sees the rules; plus an adversarial agent that tries to break it | Precision < 0.8 or recall < 0.8 at "Caution+" → widen the "Not enough to judge" band, soften copy, and reposition as "evidence highlighter" rather than "detector" |
| H2. Scams follow a small set of step-by-step scripts so "what they'll ask next" is meaningful | Playbook steps sourced from FTC descriptions; check that every scam in the held-out set maps to a playbook and its later messages land on later steps | If next-step prediction is wrong on >30% of multi-message scam threads → show "common next steps" for the playbook instead of a single prediction |
| H3. Judges value explainability/privacy over an LLM's breadth | Judge critic, rubric | If critics rate innovation low because "an LLM does this" → make the playbook timeline + next-move the headline, add measured-accuracy page |
| H4. A static, client-only app is acceptable for "working on its intended device" | Rules snippet: project must run on intended platform; we target desktop + mobile web | none expected |
| H5. Thread paste can be parsed reliably | Unit tests on WhatsApp export lines, "Name: text", blank-line blocks, and plain text | If ambiguous → fall back to one block per paste and let user add messages one at a time |

## 5. Decision log

- 2026-10-22: Created repo skeleton; spikes live in `spikes/` and are kept for transparency.
- 2026-10-22: Obfuscation spike (`spikes/scam/normalize_spike.mjs`): a normalization pass (NFKC, zero-width strip, spaced-letter collapse, leetspeak, "whats app"/"tele gram") turned 4 of 5 evasive inputs from 0 signals into correct signals. Miss: uppercase Cyrillic homoglyphs (map incomplete) → use a fuller confusables table in the build. Build implication: matching runs on normalized text, so highlights need an offset map back to the original text.
- 2026-10-22: Critics triaged in `docs/phase1/critique-triage.md`; premortem in `docs/phase1/premortem.md`. Kept idea 1; changes made: next-move timeline is the hero, normalization layer, mobile-first tap UI, honest accuracy page, evidence-first copy that never says "safe".
- 2026-10-22: Builder critique verified by rerunning the spike: legit text "paid training… start immediately… check your inbox" scored HIGH 10; Workday SSN onboarding scored HIGH 5; 40k-char "a.a." input took 772 ms (quadratic). → Engine redesign requirements recorded in `docs/phase1/critique-triage.md`. OCR and PWA cut. Explanation cards replace popovers. Verification-reply template, How-it-works page, and free-mail/shortener inspector promoted into the MVP.
- 2026-10-22: Verification pass before proposal: re-ran `spikes/scam/eval.mjs` (0.95 / 0.79 / 15 of 19, unchanged), `spikes/subs/eval.mjs` (0.68 / 0.86, unchanged), and `gen.js` (deterministic). Signal count is 19. Caveat found: the subscription eval matches by normalizing truth descriptors, so some "MISS"/"EXTRA" pairs are the same merchant split by the matcher (e.g. SP TUNEWAVE) → runner-up recall is probably understated. This does not change the decision, which rests on innovation and category saturation.

## 6. Approval and post-approval decisions

- 2026-10-22: **User approved the proposal**: "Approved, run it. You design the submission text as well, and host to GitHub Pages. You need to figure everything else. Do not rely on me for anything."
  - Submission text: the user explicitly overrides the Skill Pack 6-ship default (learner-written copy). The agent drafts it, and the README discloses that the text is agent-drafted. Risk: if judges or the rules require human-written text, the user should edit it before submitting. Noted in the fact sheet.
  - Hosting: GitHub Pages authorized. Pages isn't enabled and there is no settings API in my tools, so I pushed a `gh-pages` branch (a placeholder at first) to trigger GitHub's automatic Pages setup. This is the one push outside the designated branch, and it's covered by the user's explicit hosting instruction. github.io can't be fetched from this sandbox; deployment is verified through the GitHub API (`has_pages`, Actions runs of `pages-build-deployment`).
  - Name: kept "Tipoff". Not trademark-checked.
  - License holder: "shreymp" (the repository owner's GitHub handle; no legal name given).
  - "Why this matters to the learner" (scope.md): the user gave no personal story. I won't invent one; the section says so.
  - Team and eligibility: not provided. Recorded as an item the user must confirm on the Devpost form; it doesn't block the build.
  - The Skill Pack was installed into the repo with `npx skills add challengepost/learn-ai-basics --all -y` (`.agents/skills`, `.claude/skills` symlinks, `skills-lock.json`). A duplicate `agent/skills` copy the installer created for another harness was removed.
  - Stack pins: React 19.1, Vite 6.4, TS 5.9, Vitest 3.2, Playwright 1.56 (matches the preinstalled Chromium 1194). I avoided the newest majors (Vite 8, TS 7), which postdate my training knowledge and can't be verified against docs from this sandbox.
