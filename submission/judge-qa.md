# Judge Q&A sheet

These are short, honest answers to the questions judges are most likely to ask. Each answer points to the evidence in the repo. Numbers are as of v1.3 (commit listed in `PROGRESS.md` → Tags).

## Product and impact

**Who is this for?**
Job seekers who get unsolicited recruiter messages, especially people looking for remote or entry-level work: students, recent grads and career changers (`devpost/scope.md`). These are the targets in the FTC's job-scam guidance.

**Why not just ask ChatGPT?**
Three reasons:
- Tipoff never sends your messages anywhere. A browser test proves zero network requests, and the page's security policy forbids them (`tests/e2e/privacy.spec.ts`).
- Every flag is a readable rule with a highlighted quote, so you can see *why* and disagree.
- It shows *where you are* in a known script and *what comes next*, not only a yes or no.

We haven't run a head-to-head comparison against an LLM, so we don't claim it's more accurate.

**Does it work on real scam messages?**
- It's measured only on synthetic messages: a held-out set written by a separate AI agent that never saw the rules. On the first and only blind run it flagged 34 of 40 scams and wrongly flagged 2 of 40 genuine messages (`DECISIONS.md` §7, the How it works page).
- We haven't tested on real reported messages. That's the first thing we'd do next, with permission and with personal data removed.

**What happens when it's wrong?**
- On a miss, it says "None of Tipoff's patterns matched. That isn't proof it's safe" and still lists what to verify. The demo shows a real miss: a $95 "membership" fee.
- On a false alarm, the evidence is visible. In the blind test, both genuine messages it flagged were "Worth a closer look", never "Likely scam". One was a genuine staffing-agency email (synthetic, like the whole test set) that sends you to a background-check portal to enter your SSN. A real process can ask for that too. The highlight shows exactly which words triggered it, so the user can judge for themselves.
- It never labels anything "safe".

**Could it harm someone by giving false reassurance?**
That's the main risk, and the design works against it. There is no "safe" verdict. Clean results still show a verification checklist. The accuracy page lists every miss. When Tipoff guesses who the user is in a chat, it keeps whichever reading warns more (`DECISIONS.md`, "Speaker inference, made fail-safe").

## Innovation

**What's new here?**
It treats a scam as a *script with steps*, not a single message. It shows "you are here" plus a prediction of the next move, using five FTC-documented playbooks. The prediction is testable. In the demo thread, Tipoff predicts a chat-only "hire" after the recruiter's first message, and the recruiter's next two messages are a Telegram interview and "you've been hired" (`tests/engine/judge.test.ts > the demo thread`).

**Isn't this just keyword matching?**
The matching is simple on purpose: that's what makes it explainable and private. The work is in what's around it:
- Normalization against obfuscation, with exact offsets back to the original text.
- Chat-export and email-chain parsing.
- Legitimate-context dampening.
- Negation and scam-warning handling.
- Script and step scoring.
- A fail-safe speaker guess.

46 adversarial cases from a white-box tester are regression tests (`tests/engine/adversarial.test.ts`).

**Why no AI model in the product?**
- Privacy: nothing leaves the device.
- Explainability: every flag cites a rule and a quote.
- Cost and reliability: it works offline, with no API key and no rate limits.

The AI was used to *build* it, which is the point of this hackathon.

## Design

**How did you design it?**
- Research and tokens are in `DESIGN.md`.
- A no-context design critic reviewed every screen, and the fixes are in `docs/phase3/round1.md`.
- Blind A/B comparisons preferred the revised version in 9 of 9 differing pairs in round 1, and in 7 of 7 pairs in round 3 (`docs/phase3/round3.md`).
- Accessibility: axe WCAG 2.2 AA passes in light and dark mode at 390 px and 1440 px. The whole core workflow works with the keyboard alone. Controls are at least 24 px.

**Why is the results page so long on mobile?**
Every highlight links to its explanation card, so the cards stay expanded. The "What to do now" plan comes right after the verdict, so the action comes before the evidence. This is a known limitation (`docs/phase3/round2.md`).

## Technical

**How accurate is it, exactly?**
| | Blind v1.0 | v1.3 rerun (not blind) |
|---|---|---|
| Scams flagged | 34/40 | 35/40 |
| Genuine flagged by mistake | 2/40 | 1/40 |
| Genuine called "Likely scam" | 0/40 | 0/40 |

We report the blind number. The rerun isn't blind, because we had seen the results. The rules were never tuned on the held-out messages; the extra catch in v1.3 came from a pattern written for a critic's own test message.

**How do you know it makes no network requests?**
`tests/e2e/privacy.spec.ts` records every request while checking several messages, including one with accented letters. The production page's CSP sets `connect-src 'none'`. That test also caught a real bug: fonts used to load mid-check. It's fixed (`docs/phase3/round1.md`).

**What happens with a huge paste or catastrophic regex input?**
- Input is capped at 20,000 characters, keeping the newest part.
- Every regex quantifier is bounded.
- The engine runs in a Web Worker with a 2-second timeout and recovers if it gets stuck.
- Tests cover this: `journey.spec.ts > a stuck engine shows a recoverable error`, and the performance tests in the engine suite.

**What did you cut?**
- An AI chatbot verdict: it would send private messages off-device, and its reasoning couldn't be shown.
- Screenshot input. On-device OCR would add about 14 MB, and the default setup loads from a CDN.
- Accounts and history, because storing people's messages works against privacy.
- Later, not cut: other languages (today it shows a notice and an FTC link), a browser extension or share target, and lookalike-domain checks.

See `devpost/scope.md` and `prd.md` for the proof-of-concept boundary.

## Process and honesty

**How much did AI do?**
Nearly all of the building.
- An AI coding agent (Claude Code) planned, designed, coded and tested the project with the Skill Pack, under the owner's direction.
- Separate agents wrote the test set, ran the adversarial tests and acted as critics.
- The process is logged in `PROGRESS.md` and `DECISIONS.md`, including the agent's own mistakes.
- The submission text was agent-drafted at the owner's request, and the submission says so.

**Did you tune it on the test set?**
No. The rules were frozen (blob `5edf666`) before the held-out set was written.
- Later changes came from a separate adversarial tester and are labeled.
- Phrasings known only from held-out misses ("membership fee", "verification fee") were deliberately *not* added (`docs/phase3/round1.md`).

**What's the weakest part?**
- It has only been tested on synthetic data.
- English only.
- Rules have to be written by hand as scripts change.
- A scammer who reads the open-source rules can word around them. The visible evidence and the "never safe" stance limit the damage, but don't prevent it.
