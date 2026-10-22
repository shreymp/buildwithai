---
doc: prd
status: approved
---

# Tipoff — Product Requirements

Tipoff is a private, in-browser checker for job seekers who receive unsolicited recruiter messages. It shows which job-scam script a message follows, which step you're on, what comes next, and the exact words behind each conclusion.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

## The Core Journey
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

1. The person opens Tipoff. A short promise ("See the scam's next move before it happens"), a large text box, a **Paste** button, a **Check** button, and sample chips ("Try an example") are visible without scrolling on a phone.
2. They paste a message or a whole thread (or tap a sample) and tap **Check**.
3. If the text looks like a thread, Tipoff splits it into messages and shows who said what. If it guessed wrong about which side is theirs, they can tap "This is me" on a speaker.
4. The results appear on the same page, in this order:
   1. **Verdict band**: "No known scam pattern found", "Worth a closer look" or "Likely scam", with a one-sentence reason.
   2. **Script timeline**: five steps, with "You are here" on the furthest step with evidence and the scam playbook's name once known.
   3. **"What they'll likely ask next" card**: the next step, in plain words, plus what not to do.
   4. **The messages**: matched phrases highlighted. Tapping or focusing a highlight selects its explanation card.
   5. **Why we flagged this**: one card per finding, with what it is, why scammers do it, and which script step it belongs to.
   6. **What to do now**: an action plan with official reporting links that fits the verdict.
   7. **"Verify them" reply**: a polite message, copied with one tap, that asks for verifiable details.
   8. **Signals pointing the other way**: legitimate hiring practices found in the text, if any.
   9. Persistent footer: "Tipoff spots patterns. It can't guarantee a message is safe or a scam."
5. When a new message arrives, they add it to the text box and check again, and the timeline moves forward.
6. Success: the person knows what the scammer will likely do next and what to do instead, before paying or sharing anything.

## Screens and Layout
- **Check (home)**: one column on phones, two on wide screens. On desktop the input sits on the left and the results on the right, and after a check the timeline sits at the top of the results column. On phones the results stack under the input, and checking scrolls to the verdict.
- **How it works**: the five scripts and their steps, every rule Tipoff uses with its explanation, measured accuracy with sample size, false-positive rate and one honest miss, limitations, privacy, and sources.
- A top bar on both screens with the name, "Check a message" and "How it works". Navigation uses in-page hash routes; nothing reloads.

## Look and Feel
- Calm and trustworthy, like a knowledgeable friend: not alarmist, not cute, no emoji used as icons.
- Plain-language copy at about an 8th-grade reading level, with short sentences and verbs first.
- One accent color. Verdict colors are never the only signal: each band also has an icon and a text label.
- Generous reading space for messages. The highlight style reads like a marker pen, not an error underline.
- Mobile-first, every target at least 44×44 px, and no hover-only content.
- References and the full token system are in `DESIGN.md`.

## Features and Behavior

### Input and samples
- As Maya, I want to paste the whole conversation so Tipoff sees the full story.
  - [ ] Pasting a WhatsApp export (iOS `[date, time] Name: text` or Android `date, time - Name: text`) splits it into messages with speakers.
  - [ ] "Name: text" lines become speakers only when the name repeats or looks like a person's name, so "Salary: $40k" stays message text.
  - [ ] Blank-line-separated blocks without names stay together as one message from "them" (revised during the build: an email's paragraphs aren't separate messages; see `checklist.md > Revisions`).
  - [ ] When there are two or more speakers, each has a "This is me" toggle. Messages from "me" are shown but never scored.
- As a first-time visitor, I want to try it without having a scam message on hand.
  - [ ] Six labeled fictional samples: four scams covering at least three playbooks, and two legitimate recruiter messages. Tapping one fills the box and checks it.
- [ ] **Paste** reads the clipboard where the browser allows it. If it can't, focus stays in the box with a hint to long-press or use Ctrl/⌘+V.
- [ ] Text over 20,000 characters is trimmed to the most recent 20,000, with a visible notice.

### Reading the message (the engine)
- [ ] Matching works on a normalized copy of the text: curly quotes, look-alike letters from other alphabets, spaced-out letters ("t e l e g r a m"), number-for-letter swaps ("tra1ning") and hidden zero-width characters. Highlights always land on the original characters.
- [ ] Each finding records its rule, script step, playbooks, the exact original text span, and its message.
- [ ] Legitimate hiring practices reduce related findings. For example, collecting an SSN "in Workday after your offer" is not flagged like "text me your SSN".
- [ ] A check never takes longer than 2 seconds on any input up to 20,000 characters. If it does, the person sees a recoverable error.

### Verdict
- [ ] **Likely scam** requires a request for money, an identity document, or account access (step 4 or 5) plus corroboration: evidence from another script step, or a second, different strong request.
- [ ] **Worth a closer look** appears when there are weaker or early-stage signals.
- [ ] **No known scam pattern found** is the lowest band. It always lists what to verify anyway and never says "safe".
- [ ] **Not enough to go on** appears for text under 8 words. **Tipoff reads English job messages** appears for mostly non-English text.

### Script timeline and next move (the kernel)
- [ ] Five shared steps: 1 The hook, 2 Off the platform, 3 The fast "hire", 4 The setup, 5 The ask. Steps 4 and 5 take playbook-specific names once the playbook is known, for example "A check for equipment" and "Pay the 'vendor'".
- [ ] "You are here" marks the furthest step with evidence. Earlier steps show whether they were seen in this message or not.
- [ ] The next-move card describes the next step for the detected playbook. Before a playbook is known, it describes the most common next move and the main branches.
- [ ] At step 5 the card switches to "Stop here" guidance.

### Explanations
- [ ] Every highlight can be reached by keyboard (Tab) and opened by tap or Enter. Doing so selects and scrolls to its card, and the card links back to the highlight.
- [ ] Each card shows a short title, the quoted phrase, why it matters, and its script step.

### Action plan and reply
- [ ] The plan adapts to the verdict and playbook. For example, the fake-check playbook says "Don't deposit the check", and identity harvesting says "If you already sent your SSN, go to IdentityTheft.gov".
- [ ] Official links: ReportFraud.ftc.gov, IdentityTheft.gov and IC3.gov.
- [ ] "Copy reply" copies the "Verify them" text and confirms with "Copied". If copying fails, the text is selected for manual copy.

### Sender and link notes
- [ ] Emails from free webmail domains (gmail.com, outlook.com and similar) are noted when the message claims to come from a company.
- [ ] Link shorteners and direct chat-app links (t.me, wa.me) are noted.

### How it works
- [ ] Lists every rule with its explanation and step, generated from the same rule data the engine uses.
- [ ] Shows accuracy numbers produced by the evaluation script on the held-out corpus (not typed by hand), with sample size, the source of the test data, and at least one missed example.

## States and Boundaries
- **First use / empty**: the input, promise line and samples show. No results area; the space shows a short "What Tipoff looks for" preview.
- **Checking**: the button shows a progress state. Checks usually finish in milliseconds; the state appears only if a check takes more than 150 ms.
- **Results**: as described in the Core Journey.
- **Not enough to go on**: fewer than 8 words. Asks for the full message.
- **Not English**: says Tipoff reads English job messages only, for now.
- **Error**: the check failed or timed out. "Something went wrong reading this message. Try again, or check a shorter part." The input is kept.
- **Persistence**: nothing is stored. Leaving or reloading the page clears everything. This is stated on the How it works page.
- **Privacy**: no network requests after the page loads.

## Product Decisions
- **Job scams only, five playbooks** — the learner approved the job-scam direction over a subscription finder and a receipt splitter, as a sharper problem with stronger evidence.
- **Never say "safe"** — from the planning critique, approved by the learner: a miss must not read as reassurance.
- **No AI chatbot at runtime** — approved: privacy and explainability come first, and there's no API key or budget.
- **Host on GitHub Pages** — the learner asked for it explicitly.
- **The agent drafts the submission text** — the learner asked for it explicitly, which overrides the Skill Pack's default that the learner writes it. Recorded in `DECISIONS.md`.

## What We're Building
Everything under **Features and Behavior** and **States and Boundaries** above, on two screens (Check, How it works), mobile and desktop, WCAG 2.2 AA.

## Deferred From the POC
- **Screenshot input (OCR)**: needs self-hosted models (~14 MB) and loses who said what.
- **Lookalike-domain detection**: needs a list of real company domains to compare against.
- **Saving checks or history**: would mean storing private messages.
- **Other languages**: the rules and test data are English-only.

## Possible Later Enhancements
- A browser extension or mobile share target to check a message without copy-paste.
- A partner mode for campus career centers, with a printable "scripts to watch for" guide generated from the same rules.
- Community-submitted, redacted scam examples to test against real messages.

## Non-Goals
- Judging whether a specific company is legitimate. Tipoff reads patterns in the message, never accuses a named company.
- Detecting general scams (romance, tech support, bank impersonation). They're out of scope; job scams only.
- Replacing official reporting. Tipoff points to the FTC, IC3 and the bank.

## Open Questions
- None blocking `4-spec`. Real-world accuracy can only be measured with real messages, which this proof of concept doesn't have. The How it works page says so.
