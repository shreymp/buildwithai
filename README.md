# Tipoff — see a job scam’s next move before it happens

**Live app:** https://shreymp.github.io/buildwithai/  
**Demo video:** see the Devpost submission for this project (under 3 minutes)  
**License:** MIT

Tipoff is a free, private web app for job seekers. Paste a recruiter's text, DM or email, or the whole conversation. Tipoff then:

1. **Names the script.** Job scams follow a few well-documented scripts: the fake check for "equipment", pay-to-unlock "task" work, package reshipping, paying for training, and identity harvesting. Tipoff tells you which one this conversation follows.
2. **Shows where you are in it.** A five-step timeline (the hook, off the platform, the fast "hire", the setup, the ask) marks *you are here*.
3. **Warns what they'll likely ask next**, so you can stop before the step that costs you money or your identity.
4. **Points at the exact words.** Every flagged phrase is highlighted, and tapping it explains why scammers say it.
5. **Tells you what to do.** You get an action plan with official reporting links, plus a polite "verify them" reply that a real recruiter can answer easily and a scammer usually can't.

It runs entirely in your browser. There's no server, no account and no AI service, and the production page's Content Security Policy forbids network connections (`connect-src 'none'`). It never calls a message "safe": the lowest result is "No known scam pattern found", followed by what to verify anyway.

> Losses reported to the FTC from job and employment-agency scams rose from $90 million in 2020 to $501 million in 2024 ([FTC, March 2025](https://www.ftc.gov/news-events/news/press-releases/2025/03/new-ftc-data-show-big-jump-reported-losses-fraud-125-billion-2024)). Reports of gamified "task" job scams grew from about 5,000 in all of 2023 to about 20,000 in the first half of 2024 ([FTC Data Spotlight](https://www.ftc.gov/news-events/data-visualizations/data-spotlight/2024/12/paying-get-paid-gamified-job-scams-drive-record-losses)).

## Try it in 30 seconds

1. Open the live app.
2. Under **Try an example**, tap **Remote data entry offer**.
3. Press **Show the next message** a few times. At message 1 Tipoff predicts a chat-only "hire". At message 4 it predicts a check for equipment. Message 5 is exactly that.
4. Tap any highlighted phrase to read why it was flagged.
5. Try **Interview invite after applying**, a genuine recruiter email: *No known scam pattern found*, plus the signs of a normal hiring process.

## Run it locally

Requirements: Node.js 20 or newer, and npm.

```bash
git clone https://github.com/shreymp/buildwithai.git
cd buildwithai
npm ci
npm run dev          # development server, then open the printed URL
```

Production build and preview (the same files that are deployed):

```bash
npm run build
npm run preview      # then open http://localhost:4173
```

### Tests

| Command | What it checks |
|---|---|
| `npm test` | Engine unit tests: normalizer offsets, thread parsing, link inspector, every sample, the demo thread's predictions, hard genuine-recruiter regressions, edge states, performance on adversarial input, and dev-set regression |
| `npm run e2e` | Playwright in Chromium at 1440 px and 390 px: the full journey, highlight-to-card linking, edge and error states, the keyboard-only flow, axe-core WCAG 2.2 AA in light and dark mode, target sizes, and **zero network requests while checking** |
| `npm run eval` | Scores the rules on the held-out corpus (`eval/corpus-heldout.json`) and writes `src/data/accuracy-rerun.json`. The blind v1.0 result in `src/data/accuracy.json` is never overwritten |
| `npm run typecheck` | TypeScript |

`npm run e2e` needs a Playwright Chromium. If one isn't installed, run `npx playwright install chromium` first.

### Deploy

`npm run deploy` builds with `BASE=/buildwithai/` and pushes `dist/` to the `gh-pages` branch, which GitHub Pages serves.

## How it works

```
paste ──► thread parser ──► normalizer ──► rulebook ──► judge ──► report ──► UI
          (who said what)   (undo tricks,   (plain       (verdict, script,
                             keep offsets)   rules)       next move, plan)
```

- **`src/engine/thread.ts`** splits WhatsApp exports (iOS and Android) and "Name: text" transcripts into messages. Your own messages are never scored.
- **`src/engine/normalize.ts`** builds a cleaned copy for matching: look-alike letters from other alphabets, "t e l e g r a m", "tra1ning", hidden characters and curly quotes. It keeps a character map back to the original, so highlights land on exactly what was pasted.
- **`src/engine/rules.ts`** holds the rulebook. Each rule has bounded patterns, a plain-language explanation, a script step, and the playbooks it points to. Signs of a genuine hiring process, such as a video interview, an HR portal, or the employer paying for equipment, soften related rules.
- **`src/engine/playbooks.ts`** holds the five scripts, their step names, the next-move text for every step, the action plans, and the reply template. All of it is written from FTC consumer guidance.
- **`src/engine/judge.ts`** produces the verdict. **Likely scam** needs a request for money, identity documents or account access, backed by another step of the script or a second, different request. Otherwise the verdict is *Worth a closer look* or *No known scam pattern found*.
- **`src/engine/engine.worker.ts`** runs the check in a Web Worker with a 2-second timeout, so the page never freezes. Input is capped at 20,000 characters.

The **How it works** page in the app lists every rule, generated from the same data the engine uses, along with the measured accuracy.

## How accurate is it? (honestly)

`npm run eval` measures Tipoff against a **held-out set of 80 synthetic messages**: 40 scams across the five scripts and 40 deliberately tricky genuine recruiter messages. A separate AI agent wrote the set **after the rules were frozen**, without ever seeing them. The numbers are on the How it works page and in `src/data/accuracy.json`.

Blind result for v1.0 (the first and only run before any change, 2026-10-22):

| Measure | Result |
|---|---|
| Scams flagged ("Worth a closer look" or "Likely scam") | 34 of 40 (85%) |
| Genuine messages flagged by mistake | 2 of 40, both "Worth a closer look" |
| Genuine messages called "Likely scam" | 0 of 40 |
| Flagged scams matched to the right script | 28 of 34 |

After that run, a white-box adversarial test (46 cases written by a separate agent that read the engine and tried to break it) led to rule and parser fixes in v1.1. All 46 are now regression tests in `tests/engine/adversarial.test.ts`. The v1.1 rerun on the same held-out set gives 34 of 40 scams flagged and 1 of 40 genuine messages flagged. That rerun **isn't blind**, because the v1.0 results had already been seen, so the blind table above is the one to trust. Details: `docs/phase3/round1.md`.


What this is not: a measure of real-world accuracy. The test messages are synthetic, and real scammers use wording these rules haven't seen. That's why Tipoff shows its evidence and never says a message is safe. Development history, including the blind first spike, is in `DECISIONS.md` and `PROGRESS.md`.

## Built with the Devpost Learn Skill Pack

This project was planned and built with the [Devpost Learn "Build With AI: Basics" Skill Pack](https://github.com/challengepost/learn-ai-basics), installed in this repo with `npx skills add challengepost/learn-ai-basics --all -y` (see `.agents/skills/` and `skills-lock.json`). The planning documents it produces are in `devpost/`:

- [`devpost/scope.md`](devpost/scope.md): the kernel, the user, and the proof-of-concept boundary
- [`devpost/prd.md`](devpost/prd.md): the core journey, behaviors, states and acceptance criteria
- [`devpost/spec.md`](devpost/spec.md): architecture, components, data, file structure, failure modes
- [`devpost/checklist.md`](devpost/checklist.md): the slice-by-slice build plan and its revisions

## Project structure

```
src/engine/     pure TypeScript engine (no DOM): thread, normalize, rules, playbooks, inspect, judge, worker
src/ui/         React components (check page, timeline, highlights, cards, plan, reply, how it works)
src/styles/     design tokens and component CSS (see DESIGN.md)
src/data/       fictional samples and measured accuracy
tests/engine/   Vitest unit and regression tests
tests/e2e/      Playwright journey, accessibility and privacy tests
eval/           held-out corpus and evaluation script
spikes/         Phase 1 feasibility experiments (kept for transparency)
docs/           proposal, critiques, screenshots, demo script, submission materials
devpost/        Skill Pack planning documents
```

## Disclosures

- **AI use.** The project was planned, designed, coded and tested by an AI coding agent (Claude Code) working from the Skill Pack, under the direction of the repository owner. Critique, test-data writing and adversarial testing were done by separate AI sub-agents. The submission text was drafted by the agent at the owner's request.
- **Pre-existing work.** None. The repository was created empty on 2026-10-22, during the submission period. Everything here was written for this project.
- **Third-party code and assets.** All are used under their licenses, via npm:
  - React (MIT)
  - Vite, Vitest, TypeScript, Playwright, axe-core (dev tools; MIT, Apache-2.0 and MPL-2.0)
  - Atkinson Hyperlegible Next, Atkinson Hyperlegible Mono and Source Serif 4 fonts (SIL Open Font License 1.1, via Fontsource)
- **Data.** All example messages are fictional. The scam scripts follow public FTC descriptions. Tipoff isn't affiliated with the FTC or any government agency.

## Limits

- English only.
- It reads patterns in text, not whether a company is real.
- Fixed rules miss new wording.
- No screenshot input yet.
- The next-move text is authored from public descriptions, not learned from real conversations.
