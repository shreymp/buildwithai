# Build plan and time budget (for critique)

Context: Devpost "Build With AI: Basics" hackathon. Deadline Oct 26 2026 5pm EDT. Now: Oct 22 ~05:00 UTC. Builder: an AI coding agent working unattended overnight (usage limits can pause it), human available only for approval and for recording/submitting the video. Must produce devpost/scope.md, prd.md, spec.md (Skill Pack docs), a public repo with MIT license, and a <3 min video.

Product: client-side web app that analyzes pasted job-recruiter messages/conversations against 5 job-scam playbooks with explainable regex/heuristic rules (spike: 22 hand-written signals, blind test on 40-message held-out synthetic corpus → recall 0.95, precision 0.79, playbook ID 15/19). No backend, no LLM.

Stack: Vite + React + TypeScript, CSS custom-property tokens (no UI kit), Vitest (engine + corpus tests), Playwright (e2e, zero-network assertion, screenshots), axe-core. Static build; optional GitHub Pages deploy if the human authorizes.

MVP (must work for demo):
1. Input: paste one message or a full thread; thread parser for WhatsApp export lines "[date, time] Name: text", "Name: text" lines, and plain blocks; user can mark which side is "me".
2. Engine v1: ~30 signals across 5 playbooks + generic signals, weights, legit-signal dampeners, per-playbook 5-step script model; output verdict band (Not enough info / Low / Caution / High), matched phrases with character offsets, detected playbook + current step + next-step prediction.
3. Results screen: verdict header, annotated message view (inline highlights, keyboard-focusable, explanation popovers), script timeline with "you are here" + "what they'll likely ask next", action plan with report links, legit signals shown for balance.
4. Sample gallery (6 fictional, labeled samples incl. 2 legit).
5. Empty / too-short / very long / non-English input states. Responsive, WCAG 2.2 AA, keyboard-only flow.
6. Proven no network requests during analysis.

Stretch: screenshot OCR on-device (tesseract.js with bundled English data ~10 MB; spike: works offline in Node in <1 s on a rendered receipt, misread one digit); link & email inspector (free-mail domains, URL shorteners, lookalike domains of the claimed company); "verification reply" template; "How it works" page with measured accuracy on a second, frozen held-out corpus; copy-redacted-report; PWA/offline install.

Schedule: Oct 22 approval → Oct 22–23 MVP (tag v1.0 target Oct 23 18:00 UTC) → Oct 23–25 improvement rounds with critics → freeze Oct 25 22:00 UTC → human records video and submits Oct 26 morning.
