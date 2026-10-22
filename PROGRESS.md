# PROGRESS.md

The resumable state of the build. If you start in a fresh context, first read this file, then `DECISIONS.md`, `tests.json` and `devpost/checklist.md`. Run `npm ci && npm test && npm run e2e`, then continue from the latest passing tag (`git tag`).

## Current status

- **Phase:** 3, rounds 1–3 done (v1.3). Deliverables written. Remaining steps are the owner's (`submission/owner-steps.md`). Feature freeze 2026-10-25 18:00 EDT.
- **Live:** https://shreymp.github.io/buildwithai/ (gh-pages branch; GitHub's "pages build and deployment" workflow has succeeded)
- **Tests:** `npm test` passes 132 engine tests (including the 46 adversarial cases); `npm run e2e` passes 44 (22 specs × desktop and mobile)
- **Blind held-out result (v1.0):** 34/40 scams flagged, 2/40 genuine flagged (0 as likely), 28/34 right script. See DECISIONS.md §7. The latest rerun (v1.3) gave 35/40 and 1/40; it is **not blind** and is shown only as a labeled footnote.

## Log

### 2026-10-22 — Phase 1 (research, spikes, critique, proposal)
Commit `bd8ee66`. See `docs/phase1/` and `DECISIONS.md` §0–4. The user approved: "Approved, run it… host to GitHub Pages… Do not rely on me for anything."

### 2026-10-22 — Phase 2 build
1. Installed the Skill Pack (`.agents/skills`, `skills-lock.json`). Wrote `devpost/scope.md`, `prd.md`, `spec.md` and `checklist.md` from the templates.
2. Design research → `DESIGN.md`. Its sub-agent researched reference products, design systems and risk-communication studies; it measured 49 contrast pairs, all passing.
3. Engine v1 (`src/engine/`), commit `9f4e76b`:
   - Normalizer with offset map, 23 rules, 5 legitimacy contexts, 5 playbooks, thread parser, inspector, judge.
   - Dev set (the Phase 1 spike corpus, now used for tuning, **not** for accuracy claims): 20/20 scams flagged, 0/20 genuine messages flagged.
   - The builder critic's false-positive cases now come out "none".
4. UI v1 (`src/ui/`, `src/styles/`), commit `36668f8`. Screenshots are in `docs/screenshots/v0-first` and `v0-second`.
5. E2E suite (journey, states, keyboard, axe, privacy), plus the deploy script and the first deploy.
6. Rules frozen at commit `258f513` (`rules.ts` blob `5edf666`) before the held-out corpus was written.

7. Held-out corpus written by an independent sub-agent (80 items, validated: 8 per script, 40 genuine, unique ids). The three background agents (corpus, adversarial tester, design critic) hit the session usage limit; the corpus file had been written in full before that and was validated before use. The adversarial and design critiques did **not** run and are re-run in Phase 3.
8. Blind eval on the frozen rules → `src/data/accuracy.json`. Title-casing fix (`lowerFirst`, so "HR portal" keeps its capitals). 60 unit + 40 e2e pass. Tag **v1.0**.

### 2026-10-22 — Phase 3
9. Round 1 (`docs/phase3/round1.md`):
   - A no-context design critic reviewed the v1.0 screenshots; its UI fixes are in `00d0b18`.
   - A white-box adversarial tester produced 46 cases; 34 failed on v1.0 and all pass after the engine fixes in `78c4711`.
   - Bugs I caught myself: a highlight offset after an emoji (introduced and fixed before commit), amounts cut to "$2", an over-broad "forward" in a new rule, and a "Likely" reason that claimed a money request before one was made.
   - A blind A/B screenshot comparison preferred v1.1 in 9 of 9 differing pairs.
10. Round 2 (`docs/phase3/round2.md`): fixed the remaining problems the blind reviewer listed — inline highlights, consistent strength labels, per-script stop advice, a gentler reply for clean results, and copy fixes.
11. Skill Pack: `devpost/app-map.html` written (reference route; axe clean in light and dark). The checklist's hands-on, final review and code tour sections are filled in honestly: owner-only steps are left unchecked.
12. Deliverables: submission text, judge Q&A, owner steps, verification report, demo script, silent backup video (`submission/`).
13. Round 3 (`docs/phase3/round3.md`): a judge-perspective critic scored the app and pasted 24 messages of its own. Fixes: four under-called scams (SSN by email reply, fee via Cash App, Bitcoin to an "equipment partner", reshipping in a later message), a background-check false alarm, a calm "check before you send" card for a single request, the documented second path to "Likely scam", copy and badge labels, a harder genuine example, gift-card advice, and a re-recorded backup video. Blind A/B preferred v1.3 in 7 of 7 pairs.

### Tags
Pushing tags fails from this session: `git push origin v1.0` gets "the remote end hung up unexpectedly" every time (tried 4 times with backoff), while branch pushes succeed. A later `git push origin v1.2` was refused by the session's permission policy, so the agent stopped trying. Tags exist **locally**; the authoritative mapping is this table. The user can push them later with `git push origin --tags`.

| Tag | Commit | What |
|---|---|---|
| v1.0 | `53e8272` | First complete build. Blind held-out eval. Deployed (Pages run 39757132208, success). |
| v1.1 | `a4598c4` | Round 1: design-critic UI fixes and adversarial engine fixes. Blind A/B preferred over v1.0 in 9 of 9 pairs. |
| v1.2 | 6a06bb1 | Round 2: fixes from the blind reviewer's remaining problems. |

## Next candidates
- Round 3 done. Owner steps remain: the narrated video, the FTC figure check, the Devpost form and submitting.
