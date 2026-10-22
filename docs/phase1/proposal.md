# Proposal: Tipoff (working name)

Status: **awaiting user approval**. Nothing past Phase 1 has been built.

## Product
Tipoff is a free, private web app for job seekers. You paste a recruiter text, a DM, or a whole conversation. Tipoff highlights the exact phrases that match one of five job-scam playbooks the FTC has documented, explains each one in plain language, shows which step of the scam's script the conversation has reached, and warns what the scammer will most likely ask for next. Everything runs on-device with readable rules: no account, no server, nothing uploaded.

**Target user:** job seekers who receive unsolicited recruiter messages, especially people looking for remote or entry-level work, such as students, recent grads, and career changers.

**Problem evidence**
- Reported losses to job and employment-agency scams rose from $90M (2020) to $501M (2024), and reports roughly tripled. Source: FTC press release, Mar 10 2025, as quoted in search results. I could not open ftc.gov directly from this sandbox; please verify before citing.
- Gamified "task" job scams: about 20,000 reports in the first half of 2024, against about 5,000 in all of 2023, with over $220M in reported job-scam losses in H1 2024. Source: FTC Data Spotlight, Dec 2024, "Paying to get paid". Same caveat: read via search results.
- Research framing: an arXiv benchmark, *PreScam* (2026, arXiv 2605.12243), treats predicting how a scam conversation progresses as an open problem. I saw only its search-result abstract, not the paper.

## Fit to the rubric (25% each)
- **Design:** the results screen is built for reading evidence, like a grammar checker's inline marks combined with a step timeline. It is mobile-first, every explanation opens with a tap, and the visual system is researched and token-based.
- **Potential impact:** a large and growing harm with measurable losses. The tool is free, private, and works offline. Its copy is careful never to declare a message "safe".
- **Innovation:** existing tools (LLM chatbots, scam-check assistants) say *whether* a message looks like a scam. Tipoff says *which script* it follows, *where you are* in it, and *what comes next*, and its evidence is fully explainable.
- **Presentation:** the video turns on a prediction that comes true. Tipoff predicts the scammer's next move, then the next message in the thread shows exactly that move.

**Runner-up: Subscription Detective** (a bank CSV goes in, forgotten and price-raised subscriptions come out). It lost on Innovation, because the category is crowded (Rocket Money, ChargeSift, Subscription Killer, getfin), and on spike quality: blind recall was 0.68 against Tipoff's 0.95. Its advocate conceded both points. It had real advantages: lower liability and a simpler demo.

## Core workflow
Paste or type a message, or a thread → Check → the results show:
1. A verdict band: *No known scam pattern found* / *Worth a closer look* / *Likely scam*.
2. The script timeline, with "you are here" and "what they'll likely ask next".
3. The message with phrases highlighted; tapping one shows why it was flagged.
4. A "What to do now" plan with official reporting links.
5. Signals pointing toward legitimate, shown for balance.

## Demo story (target 2:45)
- 0:00–0:15: "A verdict tells you *whether*. Tipoff tells you *what comes next*." The FTC numbers are on screen, with the source cited.
- 0:15–0:45: Maya's first text, shown at phone size. Tipoff says *Worth a closer look*. The timeline is at step 2 of 5, and the next-move card reads: "They'll 'hire' you after a chat-only interview, then send a check to buy equipment from their 'approved vendor'."
- 0:45–1:25: Paste the rest of the thread. The scammer does exactly that. The verdict changes to *Likely scam* and the timeline moves to step 4. Tap a highlight to see why. Then the action plan.
- 1:25–1:55: A legitimate recruiter email (video interview, company portal, employer-paid background check) gets *No known scam pattern found*, plus a short list of what to verify anyway.
- 1:55–2:15: An obfuscated message ("t e l e g r a m", "tra1ning fee") is still caught, and the network is switched off to show it still works (under 10 seconds).
- 2:15–2:35: The "How it works" page: readable rules, accuracy measured on a held-out set (with sample size, false-positive rate, and one miss shown), and its limitations.
- 2:35–2:45: Close. Open source, MIT license.

All demo messages are fictional and labeled as such. They are modeled on the FTC's published scam descriptions.

## Scope
**MVP (must work for the demo)**
1. Input: paste or type, a one-tap clipboard paste, and a sample gallery of 6 fictional samples (2 of them legitimate). Thread splitting handles iOS and Android WhatsApp exports, "Name: text" lines with a speaker heuristic, and plain blocks. When there are two or more speakers, a per-speaker "this is me" toggle appears.
2. Engine (TypeScript, runs in a Web Worker, 20k-character cap):
   - Normalization: quotes, homoglyphs, leetspeak, spaced letters. An offset map ties every match back to the original text.
   - About 30 anchor-word signals across 5 playbooks, plus general signals and legitimacy dampeners.
   - A 5-step script per playbook. The current step is the furthest step with evidence; the next-move card names the step after it.
   - *Likely scam* requires evidence from at least 2 script stages, at least one of which is a money or identity request.
3. Results screen:
   - The timeline and next-move card are the centerpiece.
   - Inline marks; tapping a mark opens its explanation card (no popovers).
   - A "What to do now" plan with official report links.
   - A **"Verify them" reply template** you can copy.
   - Free-mail sender and URL-shortener notes, signals pointing toward legitimate, and a "not a guarantee" footer.
4. **How it works** page: the readable rules, accuracy measured on a held-out set (sample size, false-positive rate, one miss shown), and limitations.
5. Edge states: empty, too short, over 20k characters, non-English, nothing matched.
6. Proven zero network requests after load. Mobile-first and desktop layouts. WCAG 2.2 AA. The core flow works by keyboard alone.

**Stretch (in priority order)**
1. Lookalike-domain check against the company a message claims to be from.
2. Copy a redacted report to share with a friend or career center.
3. Dark mode.

**Cut after critique:** on-device screenshot OCR (by default tesseract.js loads its worker from a CDN, which breaks the zero-network claim; about 14 MB; loses who said what) and PWA/offline install (a service worker can serve judges a stale build).

**Schedule** (assuming approval on Oct 22)
- Oct 22–23: Skill Pack docs (scope, prd, spec, checklist) first, then design research and DESIGN.md, then the MVP, engine first with regression fixtures. **v1.0 tag targeted for Oct 23, 18:00 UTC.**
- Oct 23–25: improvement rounds with critics.
- **Feature freeze: Oct 25, 18:00 EDT.** After that: fixes, verification, demo assets, fact sheet.
- Oct 26 by 5:00 pm EDT: you record or approve the video, write the submission text, and submit.

## Spike results (what was actually run)
- **Rules engine:** 19 signal families written before I saw any test data. A separate agent, which never saw the rules, wrote a 40-item corpus: 20 scams across 5 playbooks and 20 hard negatives. Blind result: **recall 0.95, precision 0.79, playbook identified correctly in 15 of 19.** All 5 false positives were single-signal "caution" results. **However, the builder critic's hand-written legitimate texts scored HIGH, which I reproduced, so 0.79 overstates real precision.** On 50–80k-character inputs it took 14 ms or less. The corpus is synthetic and model-written, so these are **not** real-world numbers, and the corpus is now spent for tuning.
- **Normalization:** caught 4 of 5 obfuscated inputs that the raw rules missed. It missed uppercase Cyrillic homoglyphs; the fix is a fuller character table.
- **OCR:** tesseract.js ran offline in Node (browser not tested) in about 0.9 s on a rendered image and misread one digit. Now cut from the plan.
- **Runner-up detector:** recall 0.68, precision 0.86 on an independently generated bank-CSV set.
All spike code and data are in `spikes/`, with results logged in `DECISIONS.md`.

## Critiques and what changed
See `docs/phase1/critique-triage.md` and `premortem.md`.
- "It's just another scam checker" → the next-move timeline is now the hero, on screen and in the first 15 seconds of the video.
- "Rules miss reworded scams, and a miss reads as safe" → added a normalization layer, an adversarial test set, and copy that never says "safe".
- "The accuracy claim is circular" → a fresh held-out set is written after rule freeze, and the full numbers are published, including a miss.
- "Mobile and hover" → mobile-first design with tap explanations and a phone-size demo.
- Builder (reproduced): legitimate recruiter text scored HIGH and long inputs ran quadratically → anchor-word matching, a two-stage requirement for *Likely scam*, bounded regexes, a Web Worker, and a 20k-character cap. OCR and PWA cut. Reply template and How-it-works page moved into the MVP.

**Open risks**
- (a) There is no AI at runtime. The deterministic, private runtime is deliberate, but some judges may mark it down. With OCR cut, the answer is: AI built it; the runtime is deliberately transparent.
- (b) Rules cannot match an LLM's breadth on novel wording.
- (c) All accuracy numbers come from synthetic data.
- (d) I could not open the official rules page. The Stage 1 and Stage 2 criteria come from your brief.

## Completion criteria you can check
1. On a clean clone with Node 20 or later, `npm ci && npm run build && npm run preview` serves the app; `npm test` passes; `npm run e2e` passes.
2. Each of the 4 sample scams gets *Worth a closer look* or *Likely scam*, at least 3 highlighted phrases each with an explanation, and the correct playbook. Neither legitimate sample gets *Likely scam*.
3. The demo thread pasted one message at a time moves the timeline forward, and the next-move prediction made at step 2 matches what message 3 or 4 actually does.
4. Held-out corpus 2, written after rule freeze by an agent that never saw the rules, reports recall and precision at *Worth a closer look* or above. Target: at least 0.85 each. **Whatever the result is gets published.**
5. A Playwright test confirms zero network requests during analysis.
6. axe-core reports 0 serious or critical issues on every screen, and the core flow completes with the keyboard alone at 390 px and 1440 px widths.
7. Every edge state in MVP item 5 renders its designed state, with no crash.

## Rule compliance
- The repo was empty on Oct 22, so there is no pre-existing code. Third-party libraries will be listed with their licenses. The license is MIT.
- `devpost/scope.md`, `prd.md`, and `spec.md` follow the Skill Pack templates, and `learner-profile.md` is git-ignored.
- The app uses no real brands or people. The FTC is cited as a source, and its logo is not used.
- **Conflict:** the Skill Pack's `6-ship` step says the submission name, description, and form answers must be human-written; the agent may only fix spelling and grammar. Your brief asks me to draft submission materials.
