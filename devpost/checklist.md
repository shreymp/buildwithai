---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast. The learner approved an unattended build ("Approved, run it… Do not rely on me for anything"), so every hands-on checkpoint is run by independent critic agents that review screenshots and recordings, not by the learner. Each run is recorded in `PROGRESS.md`.

## Slices

- [ ] **1. Paste a message and see which phrases look like a job scam, and why**
  Becomes usable: A running app where pasting text and pressing Check shows highlighted phrases with explanation cards and a verdict band.
  Why now: Proves the riskiest path end to end, from parse and normalize to rules, offset mapping and highlights, on the first slice. Offset mapping is where bugs hide.
  PRD ref: `prd.md > The Core Journey` (steps 1–4), `prd.md > Reading the message (the engine)`, `prd.md > Verdict`, `prd.md > Explanations`
  Spec ref: `spec.md > Normalizer`, `spec.md > Rulebook`, `spec.md > Judge`, `spec.md > UI`, `spec.md > File Structure`
  Build: Scaffold Vite + React + TS, tokens, normalizer with offset map, rulebook v1, judge verdict bands, Highlighter and FindingList, the check page.
  Verify (mechanical): `npm test` passes the normalizer offset tests, rule fixtures and legitimate-regression fixtures. `npm run build` succeeds. A Playwright smoke test pastes a sample and sees at least 3 marks and a verdict.
  Learner check: Open the app, tap a sample, and confirm the highlights and cards make sense.
  Commit: `Check a message: rules, highlights, verdict`

- [ ] **2. See the scam's script, where you are on it, and what comes next**
  Becomes usable: The timeline and next-move card appear above the findings, and checking again with more of the thread moves the timeline forward.
  Why now: This is the unique kernel, so it comes immediately after the first working path.
  PRD ref: `prd.md > Script timeline and next move (the kernel)`
  Spec ref: `spec.md > Playbooks`, `spec.md > Judge`
  Build: Playbooks with five-step scripts, step placement, next-move logic, ScriptTimeline, NextMoveCard.
  Verify (mechanical): Engine tests show the demo thread's message 1 at step 2 and the full thread at step 4 or later on the fake-check playbook, with the step-2 prediction matching the step that message 3 reaches. E2E checks the timeline text.
  Learner check: Check the first message of the demo thread, then the full thread, and watch the prediction come true.
  Commit: `Script timeline and next-move prediction`

- [ ] **3. Paste a whole conversation and get it split by who said what**
  Becomes usable: WhatsApp exports and "Name: text" threads split into speaker-labeled messages, with a "This is me" toggle.
  Why now: Threads are how scams unfold, and the kernel needs them to show progression.
  PRD ref: `prd.md > Input and samples`
  Spec ref: `spec.md > Thread parser`
  Build: The thread parser and its fixtures, speaker chips with the me toggle, and only 'them' messages scored.
  Verify (mechanical): Parser tests for iOS and Android exports, "Salary:" not treated as a speaker, blank-line blocks, and unprefixed continuation lines. E2E toggles "This is me" and the findings update.
  Learner check: Paste a WhatsApp-style thread and confirm the split looks right.
  Commit: `Thread parsing and speaker toggle`

- [ ] **4. Know exactly what to do next**
  Becomes usable: The action plan, the copyable "Verify them" reply, sender and link notes, and signals pointing the other way.
  Why now: Turns the diagnosis into action. That's the impact story.
  PRD ref: `prd.md > Action plan and reply`, `prd.md > Sender and link notes`
  Spec ref: `spec.md > Inspector`, `spec.md > Playbooks`
  Build: The inspector, the ActionPlan, the ReplyTemplate with clipboard fallback, and the InspectorNotes.
  Verify (mechanical): Inspector unit tests. E2E for copying the reply (clipboard permission granted) and for the official links being present.
  Learner check: Check a scam sample and copy the reply.
  Commit: `Action plan, verify-them reply, sender and link notes`

- [ ] **5. Every edge state is designed, and it never freezes**
  Becomes usable: Empty, too-short, non-English, truncated, error and timeout states. The worker runs off the main thread.
  Why now: Judges will try odd input. These states protect the demo.
  PRD ref: `prd.md > States and Boundaries`
  Spec ref: `spec.md > Worker bridge`, `spec.md > Important Failure Modes`
  Build: The worker bridge with timeout and fallback, state components, the 20k cap.
  Verify (mechanical): Perf test (20k-character adversarial input checked in under 300 ms in Node). E2E for each state, plus a forced worker-failure test showing the error state.
  Learner check: Paste nonsense, a single word, and Spanish text, and see a helpful state each time.
  Commit: `Edge states, worker, input cap`

- [ ] **6. Learn how it works and how accurate it is**
  Becomes usable: The How it works page with scripts, every rule, privacy, sources, and measured accuracy from the held-out corpus.
  Why now: Credibility for judges, and it needs the frozen rulebook from slices 1–5.
  PRD ref: `prd.md > How it works`
  Spec ref: `spec.md > Data Model` (accuracy.json), `spec.md > File Structure` (eval/)
  Build: Freeze the rules. An independent agent writes `eval/corpus-heldout.json`. `npm run eval` writes `accuracy.json`. Build the HowItWorksPage.
  Verify (mechanical): `npm run eval` output matches what the page renders. Unit test: the rule list on the page equals the engine rule count.
  Learner check: Open How it works and read the accuracy section.
  Commit: `How it works page with measured accuracy`

- [ ] **7. Ship it: accessible, private, deployed**
  Becomes usable: The public URL on GitHub Pages, with verified zero network requests, axe-clean pages and keyboard-only flow.
  Why now: Final integration of the proof.
  PRD ref: `prd.md > States and Boundaries` (Privacy), `prd.md > What We're Building`
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`
  Build: Playwright network and axe suites, keyboard flow test, deploy script, README.
  Verify (mechanical): `npm run e2e` all green. Deploy pushes to gh-pages, and the GitHub API reports Pages as built.
  Learner check: Open the public URL on a phone.
  Commit: `Accessibility, privacy proof, and deploy`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after slice 2: a no-context critic agent uses the app from screenshots and the e2e recording
- [ ] Final kick-the-tires exploration and feedback completed — Phase 3 critic rounds

## Final Review

- [ ] Final review complete — feedback resolved and ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence:
Route and stops:
Edit outcome:
Reflection:
Activity mode:

## Revisions

- "Likely scam" rule widened to accept two different strong requests at the same step as corroboration — the dev set showed a task scam ("deposit to unlock" + "pay in USDT") that sits entirely at step 5 being under-called.
