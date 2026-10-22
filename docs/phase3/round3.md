# Phase 3, round 3: a judge-perspective critic

## Input

A separate agent was asked to judge Tipoff the way a hackathon judge would, scoring it against the four Stage 2 criteria. It built the app from a copy of the repo at `64bfec8`, used it in Playwright at 1440 and 390 px, ran all six examples and the demo thread, and pasted 24 messages it wrote itself. Its scores:

| Criterion | Score |
|---|---|
| Design | 7.5 / 10 |
| Potential Impact | 6.5 / 10 |
| Innovation / Idea | 7 / 10 |
| Presentation | 6 / 10 |

These are one model's opinions, not a real judging panel.

Of its 24 messages: 9 of 10 genuine messages were right (P4, a real background-check email, got a false alarm); all 12 scams were flagged, but S4, S6 and P3 were under-called as "Worth a closer look". (It also counted S1 as under-called, but in its own notes called S1's verdict right. S1 is a first contact with no request, and "Worth a closer look" is what the rules say it should get, so S1 isn't changed.)

## Findings and decisions

| Critic's finding | Decision | Change |
|---|---|---|
| **S4 under-called:** "please reply to this email with a clear photo of your driver's license…, your Social Security number, and your bank routing and account number" gets "Worth a closer look", and the SSN isn't highlighted | Fix | `identity_request` now accepts a gap between the verb and the SSN ("reply to this email with … your Social Security number"), with the same tempered gap that stops at "never", "not", "don't", "won't" and "no". New rule `bank_details` (step 5, strong) for routing and account numbers. S4 is now "Likely scam", identity harvest, with the SSN highlighted. |
| **S6 under-called:** "$65, payable via Cash App" gets "Worth a closer look", Cash App isn't highlighted, and the next-move card predicts the Cash App payment that already happened | Fix | `hard_to_trace_payment` now matches "payment / deposit / fee / payable … via / through / by / using / on" + Zelle, Cash App, Venmo, Western Union, MoneyGram, wire transfer, Bitcoin or crypto. S6 is "Likely scam" at step 5. |
| **S8:** "forward $1,900 to our equipment partner using Bitcoin" is step 5 but is shown as step 4 and isn't highlighted | Fix | "forward" and "wire" added to the payment verbs; "equipment partner / provider / company" added to `pay_the_vendor`. |
| **P2:** "Congratulations, you got the" (cut before "job"), "photos of the codes" not flagged, no script named | Fix | `instant_hire` takes the noun ("you got the job"). New pattern for photos or scans of card codes. "Onboarding / new hire / required" before "license" counts as paying for the job. P2 names the pay-for-the-job script. |
| **P3 under-called:** in a reshipping thread, "ship it out with the label" in a later message isn't step 5 | Fix | New `reship_out` patterns. A rule can now set `needsThread`, so its context condition ("packages at your home") is checked against everything the other side wrote, not just the same message. |
| **P4 false alarm:** a genuine Sterling background-check email ("enter your Social Security number … in their secure portal. There is no cost to you") gets the same screen as S4 | Fix | The match came from the noun "email" ("an email from Sterling asking you to enter your SSN"). "Email" now counts as a request verb only in "email me / us / them / it / back". P4, four more genuine messages from the critic (G1, G2, G3, G5) and one of mine are regression tests that must stay "none". |
| **Contradictory screen:** an amber "Worth a closer look" above a red "This is the end of the script. Stop here" | Fix | At step 5 without a "Likely scam" verdict, the card is now a teal "Before you answer: Before you send anything, check who's asking", which says a single request isn't proof by itself. "Stop here" is shown only with "Likely scam". |
| **"Likely scam" rule documented wrongly:** the README and How it works page say Likely needs a request, but demo message 4 is Likely without one | Fix | The second path (at least 9 points across 3 or more steps) is now documented on the How it works page and in the README. |
| **README overclaim:** "At message 4 it predicts a check for equipment", when the card says "Next, they'll ask for something" | Fix | "At message 4 it warns that they'll ask for something next, most often a check to buy equipment." |
| **Copy:** "1 warning sign that match", "across 1 steps", "the pay for the job job scam" in the timeline caption | Fix | Singular and plural are handled. One `scamName()` is used by both the reason and the timeline caption. Tests cover each case. |
| **"Clear sign" badge** can be read as "all clear" | Fix | Renamed to "Moderate sign". The legend reads "Moderate or weak sign". |
| **The in-app genuine examples are easy** (one says "We will never ask for … your Social Security number") | Fix | New genuine example "Background check after an offer": a fictional employer, a named screening company, Workday, "at no cost to you". |
| **Gift cards:** the pay-for-the-job advice doesn't say what to do if you already paid with one | Fix | Added: contact the company that issued the card right away, say it was used in a scam, and keep the card and receipt. Source: the FTC page "Report Gift Cards Used in a Scam" (ftc.gov/media/70967). The agent saw that page only through search results, because the sandbox can't open ftc.gov. |
| **Backup video:** small text, the caption bar covers content, scroll ghosting at about 0:15, and it never states the problem or the user | Fix | The recorder adds a 9-second title card (problem, user, privacy), sets the page text to 112.5%, and scrolls instantly. The caption bar still covers the bottom of the frame in some scenes. Take 6, from the final round 3 build, replaces the old video. |
| **No narrated video** | Owner step | Recording and uploading need the owner (`submission/owner-steps.md`). |
| **Results are long; the desktop left column is empty below the examples** | Not changed | Same reason as round 2: each highlight links to its card. A sticky left column is a layout change with its own risks this close to the freeze. Logged as a known limitation. |
| **No `main` branch, no repo description or homepage** | Owner step | Renaming the default branch and editing repo settings change the public repo; the agent leaves them to the owner. |
| **S3:** "Google Hangouts chat" isn't flagged as a chat-only interview | Not changed | "Hangouts" alone isn't enough to call an interview chat-only, and S3 is already "Likely scam". |
| **Accuracy is measured only on AI-written messages**; add real FTC or BBB quotes as a second test | Not changed | The agent can't open those sites from the sandbox, and it won't present quotes it couldn't check. Listed under "Not verified" in the verification report. |

## The blind A/B

Seven matched screenshot pairs, v1.2 against v1.3, each in random A/B order (key: `round3-blind-key.json`). The reviewer saw only the 14 images, with no labels or context. The cases were S4, S6, a lone SSN request, P4, P2, the "Moderator job with a training kit" sample and the demo thread.

**v1.3 was preferred in 7 of 7 pairs:** 5 with high confidence, 1 medium (the training-kit sample: labels and the "job job" typo) and 1 low (the demo thread: only the badge labels differ). The v1.3 screens were captured before two later copy changes, which the reviewer didn't see: the gift-card advice (it appears in pair 5's action plan) and "matches the start of" becoming "matches part of" in the amber reason, because a lone step-5 sign is the end of a script, not its start. Neither changes a verdict, a highlight or a card.

Problems the reviewer still saw in v1.3, and what was done:

| Problem | Decision |
|---|---|
| The teal "check who's asking" card uses generic text ("money, a hard-to-undo payment, or your personal or bank details") for a message that only asks for an SSN | Not changed. The card is shared by every script; it's still accurate. |
| A "Strong sign" badge under a "Worth a closer look" verdict | Not changed. The sign is strong; the verdict needs more than one. The How it works page explains this. |
| The step-5 cards put the badge on its own line | Not changed. Cosmetic: the step label is longer there. |
| "Don't tell your bank" is only a moderate sign | Not changed in this round. A weight change shifts verdicts across the whole rulebook, and the held-out set can no longer measure that blind. |
| The S4 highlight is long and runs over three lines | Not changed. It covers the request and the SSN, which is the evidence. |

## Measurement

The held-out set has been burned for tuning since v1.0, and nothing in this round came from it. The rerun on v1.3 is **not blind**: 35 of 40 scams flagged (13 as "Likely scam"), 1 of 40 genuine messages flagged, 29 of 35 matched to the right script. The extra catch is h70 ("payment through crypto"), caught by the new payment pattern written for S6, not tuned for h70. The remaining false positive, h50 ("give consent and enter your SSN"), wasn't tuned, by the held-out rule. The blind v1.0 numbers (34 of 40, 2 of 40) stay the headline.

## Verification

- Unit tests: 132 pass. That's 116 from v1.2, 15 new in `tests/engine/round3.test.ts` (the critic's five under-calls, the copy, the lone-request card, and six genuine messages that must stay unflagged) and 1 from the samples test for the new example.
- E2E: 44 pass on desktop and mobile. New: the genuine background-check example stays unflagged, a single request shows the calm "check before you send" card, and axe covers that state.
- Typecheck clean.
- Screenshots: `docs/screenshots/v1.3/` (32: 16 screens × desktop and mobile), from the final build. The single-request screen was checked by eye.
- Backup video: take 6, from the same build. Every scene assertion passed, and five frames were checked by eye.
