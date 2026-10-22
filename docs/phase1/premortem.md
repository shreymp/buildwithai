# Premortem — "It's Oct 31. Tipoff didn't place. Why?"

1. **"Just another scam checker."** Judges saw a paste-box-and-verdict app, compared it in their heads to ChatGPT/Norton Genie, and scored Innovation low. The playbook timeline and "what they'll ask next" were buried after the verdict, so the distinctive moment never landed in the first 30 seconds of the video.
   *Fix in plan:* the script timeline + next-move card is the hero of the results screen, not a sidebar. The video opens on the prediction, then shows the next real message confirming it. The README and description lead with "it tells you the scammer's next move."

2. **A judge typed their own message and it misfired.** A normal recruiter note got "Caution" because it said "background check" and "start immediately", or a blunt scam with fresh wording scored "Low". Credibility collapsed, and so did Design and Impact.
   *Fix in plan:* a fresh held-out corpus written after rule freeze, plus an adversarial agent that writes inputs designed to fool the rules. Single weak signals never escalate past "Worth a closer look". The verdict never says "safe". The lowest band reads "No known scam pattern found — here's what to verify anyway". Every highlight shows its reason so a wrong flag is visibly a heuristic, not an accusation.

3. **It read as AI-generated and the process docs looked thin.** The UI used default component-library styling, and scope/prd/spec read like filler, which risked the Stage 1 pass/fail and dragged Design.
   *Fix in plan:* the docs follow the Skill Pack templates exactly and record the user's real decisions from the approval conversation. A token-based design system is researched against reference products (DESIGN.md). A no-context design critic reviews screenshots, with before/after pairs kept.

**Also considered (known risks, not fixed):**
- The submission prose must be human-written under the Skill Pack's 6-ship rule. If the user runs out of time to write it, the entry is weak there. *Mitigation:* a fact sheet plus a demo script with timings, so writing it takes about 20 minutes.
- If a usage-limit pause lasts long enough, Phase 3 rounds get cut. *Mitigation:* v1.0 is tagged early and every round is small.
