# PROGRESS.md

The resumable state of the build. If you start in a fresh context, first read this file, then `DECISIONS.md`, `tests.json` and `devpost/checklist.md`. Run `npm ci && npm test && npm run e2e`, then continue from the latest passing tag (`git tag`).

## Current status

- **Phase:** 2 (build), approaching v1.0
- **Live:** https://shreymp.github.io/buildwithai/ (gh-pages branch; GitHub's "pages build and deployment" workflow has succeeded)
- **Tests:** `npm test` passes 60 engine tests; `npm run e2e` passes 40 (20 specs × desktop and mobile)
- **Waiting on:** the held-out corpus (`eval/corpus-heldout.json`) and the adversarial findings (`eval/adversarial-findings.json`) from independent sub-agents

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

## Next candidates
- Run `npm run eval` on the frozen rules and record the blind result. Tag v1.0.
- Triage the adversarial findings in Phase 3, round 1.
