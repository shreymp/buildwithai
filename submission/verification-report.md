# Verification report

Every claim below points to evidence you can re-run. "Pass" means the agent ran the check and saw it pass, at the commit stated. The rest of the document is labeled: simulated or synthetic, not verified, or a known limitation.

State checked: commit `5504a89` (code identical to v1.2 `6a06bb1`, plus the eval/README fixes in `a73a2e0`), 2026-10-22.

## 1. Requirements: criterion → evidence → status

| # | Criterion | Evidence | Status |
|---|---|---|---|
| R1 | Stage 1: `devpost/scope.md`, `prd.md`, `spec.md` in the repo, from the Skill Pack templates | Files present with `status: approved` (`tests.json` C10) | Pass |
| R2 | Public repo with an OSS license | GitHub API: `visibility: public`, `license: MIT` | Pass |
| R3 | Setup instructions work | Fresh-agent walkthrough from a clean clone, using only the README (`tests.json` C1). Its README findings are fixed in `a73a2e0` | Pass (on Node 22; Node 20 not tested) |
| R4 | New working proof of concept, built with the Skill Pack | Repo created 2026-10-22; Skill Pack in `.agents/skills/` and `skills-lock.json`; build history in `PROGRESS.md` | Pass |
| R5 | Text description | `submission/devpost-text.md`, drafted by the agent at the owner's request and labeled as such | Drafted; owner must review and submit |
| R6 | Demo video under 3 minutes | Script: `submission/demo-script.md` (about 2:45). Silent captioned backup: `submission/backup-video/` (about 1:35) | Narrated video **not recorded** (owner step) |
| R7 | Live deployment (optional) | GitHub Actions "pages build and deployment" run 39801492120: success, for gh-pages commit "Deploy 6a06bb1" | Deploy pass; **page load not verified from the sandbox** (proxy 403) |

## 2. Product acceptance criteria (`tests.json`)

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| C1 | A clean clone builds, runs and passes tests from the README | Fresh-agent walkthrough; see R3 | Pass |
| C2 | Each scam sample flagged with at least 3 explained highlights and the right script; genuine samples not flagged | `tests/engine/judge.test.ts` › samples; `journey.spec.ts` › each scam sample… | Pass |
| C3 | Demo thread: the prediction comes true in later messages | `judge.test.ts` › the demo thread; `journey.spec.ts` › the demo conversation; backup-video run log | Pass |
| C4 | Held-out accuracy published, target at least 0.85 recall and precision | Blind v1.0: recall 0.85 (34/40), precision 0.944 (2/40 genuine flagged), on a synthetic corpus | Pass, on synthetic data |
| C5 | Zero network requests while checking; CSP forbids connections | `tests/e2e/privacy.spec.ts` (3 tests) | Pass |
| C6 | axe: 0 serious or critical issues on every screen and state, light and dark, 390 and 1440 px; keyboard-only core flow | `tests/e2e/a11y.spec.ts` | Pass (automated checks only, see §5) |
| C7 | Every edge state renders: empty, too short, more than 20k characters, non-English, no match, engine timeout, worker failure | `judge.test.ts` › states; `journey.spec.ts` › states | Pass |
| C8 | Never freezes: 300 ms or less on adversarial 20k inputs; bounded regexes | `judge.test.ts` › performance and safety | Pass |
| C9 | Deployed to GitHub Pages | See R7 | Pass (deploy); page load unverified from here |
| C10 | Stage 1 docs | See R1 | Pass |

Final runs at `5504a89`:
- `npm test`: 116 passed
- `CI=1 npm run e2e`: 42 passed in 1.4 min, on a freshly built server; `CI` stops Playwright from reusing a stale one
- `npm run typecheck`: clean
- `npm run eval`: 34/40 scams flagged, 1/40 genuine flagged (v1.1 rerun, not blind)

## 3. Brief deliverables

| Deliverable | Where | Status |
|---|---|---|
| Working product at the last passing tag | v1.2 = `6a06bb1`, deployed. Later commits change only docs, eval tooling and the recorder | Done. The tags are local only; the owner can recreate them (`submission/owner-steps.md` step 8) |
| Submission materials, not submitted | `submission/devpost-text.md`, `owner-steps.md` | Done; nothing submitted |
| Demo script with timing | `submission/demo-script.md` | Done |
| Judge Q&A sheet | `submission/judge-qa.md`, every file and test reference checked | Done |
| DESIGN.md and final screenshots | `DESIGN.md`; `docs/screenshots/v1.2/` (28: 14 screens × desktop and mobile) | Done |
| PROGRESS.md round log | `PROGRESS.md`, `docs/phase3/round1.md`, `round2.md` | Done |
| Verification report | This file | Done |
| Backup video | `submission/backup-video/tipoff-demo-silent.webm` + README + run log | Done |
| Seeded demo data | `src/data/samples.ts`: 6 fictional examples (4 scam scripts, 2 genuine), one of them a 6-message thread | Done |
| Fresh-agent README test | `tests.json` C1 | Done; findings fixed |
| Demo run including a failure case | `scripts/record-demo.mjs` asserts every scene, including the $95 "membership" miss; 3 runs, all passed (`submission/backup-video/README.md`) | Done |

## 4. Simulated or synthetic (and labeled as such)

- **All example messages are fictional.** The app's footnote says so.
- **The held-out test set is synthetic.** A separate AI agent wrote it. The app, README and Devpost text all say it isn't real-world accuracy.
- **The "stuck engine" and "worker can't load" states are triggered in tests by blocking or stalling the worker.** The UI handling is real; the failures are induced.
- **The caption bar in the backup video is drawn by the recording script**, and the video's README says so.
- **Nothing in the product is mocked.** There's no fake network call, no hard-coded verdict and no special case for demo inputs. The demo thread goes through the same `analyze()` as pasted text.

## 5. Not verified

- **The live site loading in a browser.** The sandbox can't reach github.io. The owner should open it (owner step 1).
- **Real-world accuracy** on actual reported scam messages.
- **Browsers other than Chromium** (Safari, Firefox) and real phones. E2E runs Chromium at a phone-sized viewport.
- **Screen readers** (VoiceOver, NVDA). Only axe and keyboard-only checks were run.
- **Node 20.** The walkthrough used Node 22. Also untested: `npx playwright install` on a bare machine.
- **The FTC loss figures** ($90M in 2020 → $501M in 2024). Seen only in search summaries of the FTC release, which couldn't be opened from the sandbox. Flagged ⚠ for the owner.
- **The hackathon rules** (deadline, eligibility). The rules page was blocked, so these come from search snippets. Flagged for the owner.

## 6. Known limitations

- English only. Other languages get a notice and an FTC link.
- Fixed rules miss new wording. 6 of 40 blind-test scams were missed (listed on the How it works page). The demo shows one: a $95 "membership" fee.
- A scammer who reads the open-source rules can word around them.
- The guess at who "you" are in a two-person chat is a heuristic. It's fail-safe: Tipoff keeps the reading that warns more.
- Mobile result pages are long when there are many signs (round 2, not changed).
- No screenshot or image input.
- The next-move text is written from FTC descriptions, not learned from real conversations.
