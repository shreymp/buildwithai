# Critique triage (Phase 1, step 5)

The critics ran as separate subagents. Each saw only the material named in its brief. Because they share a model, agreement between them is **not** treated as evidence.

## Judge (saw only pitch.md): 7.25/10 overall (Design 7, Impact 8, Innovation 6, Presentation 8)

| Objection | Severity | Resolution |
|---|---|---|
| Looks like an existing paste-and-verdict tool or an LLM chatbot | critical | **Plan changed.** The script timeline and "what they'll likely ask next" become the hero of the results screen and the first beat of the video. Description and README lead with it. I won't show competitor products on screen (trademark constraint); the video shows the contrast in words ("a verdict tells you *whether*; Tipoff tells you *what comes next*"). |
| Fixed rules miss reworded, misspelled, or obfuscated scams; a miss reads as "safe" | critical | **Plan changed.** (a) A normalization layer runs before matching: leetspeak, spaced letters ("t e l e g r a m"), homoglyphs, "whats app", currency/number formats. (b) Synonym-expanded signals. (c) The lowest band never says safe: "No known job-scam pattern found — here's what still to verify." (d) An adversarial agent writes evasive inputs; the measured miss rate is published. Still an open risk: rules cannot match an LLM's breadth. |
| Accuracy claim is circular or unbacked | major | **Plan changed.** The test set is written by an agent that never sees the rules, after the rules are frozen. The "How it works" page reports sample size, source ("synthetic, model-written; not real-world"), detection rate, false-positive rate, and shows a missed example. Real data from FTC narratives, r/Scams, or BBB can't be reached from this sandbox — **ask the user** if they have redacted real messages. |
| Demo thread may look staged, or expose a real person's data | major | Use a clearly labeled fictional thread built step by step from the FTC's published description of the fake-check scam, and say so on screen. No real people. |
| No AI at runtime in an "AI" hackathon | major | **Open risk, not fixed by default.** Options: (a) say plainly that AI built it and the runtime stays deterministic and private by design; (b) stretch: optional on-device screenshot OCR (tesseract.js, which is ML); (c) optional bring-your-own-key LLM second opinion — but it can't be tested here without a key, and it would undercut the "nothing leaves your device" story. **Default (a) + (b); asking the user.** |
| Mobile: scams arrive on phones; hover doesn't exist | major | **Plan changed.** Mobile-first layout, tap-to-explain highlights (no hover-only content), the video recorded at phone size, and a one-tap "Paste from clipboard" button. Stretch: PWA share target (Android). |
| Distribution | major | Out of scope for a PoC. Covered in the Q&A sheet: campus career centers, job boards, PWA install. |
| Rules decay | major | Rules live in a single, documented data file with a source note per signal, so updates are one PR. Mentioned in the Q&A. |
| Liability / defamation of real recruiters | major | Copy talks about *patterns in the message*, never "this company is a scam." A persistent footer: "Not a guarantee. Verify through the company's official site." |
| OCR flaky on camera | minor | Stretch only; it ships only if a recorded run works reliably on the demo screenshots. |
| Opening segment overloaded; network-off beat too long | minor | Demo script rebalanced (see proposal). |
| FTC stats need an on-screen citation | minor | Yes: citation line in the app's About section and on screen in the video. |
| "Tipoff" naming clash | minor | Working name only; the user picks the final name. Not trademark-checked (I can't verify that from here). |

## Runner-up advocate (Subscription detective)

| Argument | Strength (theirs) | Triage |
|---|---|---|
| Liability is lower for subscriptions | strong | Accepted as true; mitigated for Tipoff by evidence-first copy and no "safe" verdict. Not decisive. |
| Judges can't test Tipoff with real scams | strong | Partly true. Mitigation: a sample gallery plus the ability to type anything. Most judges have received at least one job-scam-style text; that's an assumption, so I label it unverified. Equally, few judges will upload their real bank CSV. |
| Runner-up demo is deterministic | strong | Tipoff's engine is also deterministic. Accepted that the runner-up's demo is simpler. |
| Category saturation | — | The advocate concedes it: the runner-up is *more* saturated (Rocket Money, ChargeSift, Subscription Killer, getfin). |
| Spike quality | — | Runner-up recall 0.68 vs Tipoff 0.95 on blind held-out sets (both synthetic). |

**Decision:** keep Tipoff. It wins on Innovation and Impact (the advocate concedes both) and has the stronger spike. The advocate's demo-risk points became mitigations above.

## Builder (saw only plan.md + spike code)

I reproduced the builder's main claims with the spike engine before accepting them.

| Objection | Severity | Verified? | Resolution |
|---|---|---|---|
| Bad false positives on ordinary legit recruiter text ("paid training… start immediately… check your inbox" → HIGH 10; Workday SSN onboarding → HIGH 5) | critical | **Yes, reproduced** (HIGH 10, HIGH 5) | Short anchor-word matching instead of `.{0,60}` spans. "Likely scam" requires ≥2 distinct script stages including an extraction-stage signal. Legit dampeners stay on and are weighed against signals (an employer HR portal reduces id_request). A regression suite of judge-style legit texts must pass before every round. |
| Quadratic regex on long tokens (200k chars froze 21 s) | major | **Yes**: 40k "a.a." took 772 ms | Bounded quantifiers (`{1,64}`), no unbounded `.*`, 20k-char cap with a visible notice, engine in a Web Worker with a timeout, and a perf test in CI. |
| Curly quotes / NBSP break matching | major | Yes (missed secrecy) | Length-preserving pre-normalization (’ → ', NBSP → space). |
| Highlight offsets wrong when "me" messages exist; overlapping marks | major | Accepted (code inspection) | Keep original message indices. Segment text at every hit boundary, tag each segment with its signal ids, highlight only the anchor capture group (regex `d` flag). |
| Thread parser false speakers ("Salary:"), Android export format, U+200E/U+202F | major | Accepted | Speaker heuristic (name repeats, ≤30 chars, no digits) plus fixture tests for iOS/Android WhatsApp, Telegram copy, and plain blocks. Unprefixed lines join the previous message. |
| Cross-line cues missed | major | Accepted | Match on the message with newlines folded to spaces (length-preserving). |
| Popovers break on mobile | major | Accepted | **Plan changed:** tapping a mark selects and scrolls to its explanation card in a list below. No floating popovers. |
| Next-step prediction is undefined from one message | major | Partly accepted | **Defined:** each playbook has 5 authored steps; current step = the furthest step with evidence; the next-move card shows the authored text of the following step. That is static content, which keeps it cheap. It stays in the MVP because it is the kernel. |
| OCR: jsDelivr default loading breaks zero-network; ~14 MB; loses speaker info | major | Accepted | **Cut** from the plan. |
| PWA service worker can serve judges a stale build | minor | Accepted | **Cut.** |
| Hosting undecided; Vite `base` | critical | Accepted | **Asking the user now** for GitHub Pages authorization. Hash routing; `base` set from an env var. |
| Skill Pack docs missing from the schedule | major | Accepted | First block of the build day. |
| Score inflation on long threads | minor | Accepted | Score from distinct signals and stages, not hit counts; the stage requirement for "Likely scam". |
| `$1,000/day` missed | minor | Accepted | Number normalization in the pay regex. |
| Non-English detection method | minor | Accepted | ASCII-letter ratio + English stopword ratio → "Tipoff only reads English for now". |
| Promote: verification-reply template; How-it-works page; cheap link inspector (free-mail + shorteners) | — | Accepted | Moved into the MVP. Lookalike-domain detection stays stretch. |
