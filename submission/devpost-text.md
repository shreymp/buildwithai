# Devpost submission text (draft, ready to paste)

> **Who wrote this:** this text was drafted by the AI coding agent at the owner's request ("You design the submission text as well"). The Skill Pack's `6-ship` step expects the person submitting to write or at least own these answers. Read every line, change anything that isn't how you'd say it, and keep the AI-use disclosure. Facts marked ⚠ need a check by you before you submit (see the end of this file).

---

## Project name
Tipoff

## Tagline (short description)
See a job scam's next move before it happens. Paste a recruiter's message, and Tipoff shows which scam script it follows, where you are in it, and what they'll ask for next. It runs entirely in your browser.

## Inspiration
Job scams don't arrive as one obviously fake message. They follow a script: a friendly unsolicited offer, a move to WhatsApp or Telegram, a "hire" after a text-only interview, and then the ask — a check to deposit, a fee for training, or your Social Security number "for payroll". The FTC reports that losses to job and employment-agency scams rose from $90 million in 2020 to $501 million in 2024 ⚠. Most tools answer "is this a scam?" after the fact. We wanted to show people the script while they're still in it, so they can see the next move coming.

## What it does
- You paste a recruiter's text, DM or email, or a whole conversation. That includes WhatsApp exports and email reply chains.
- Tipoff places the conversation on a five-step job-scam script: the hook, off the platform, the fast "hire", the setup, and the ask. It shows **"You are here"** and **what they'll likely do next**.
- It names which of five FTC-documented scripts the conversation matches:
  - fake check and equipment
  - pay-to-work "tasks"
  - reshipping
  - pay for the job
  - identity harvesting
- It highlights the exact phrases that triggered each sign. Each highlight opens a plain-English explanation.
- It gives a "What to do now" plan with official links (ReportFraud.ftc.gov, IdentityTheft.gov, FBI IC3) and a reply you can send to make a real recruiter verify themselves.
- It never says a message is "safe". The verdicts are "No known scam pattern found", "Worth a closer look" and "Likely scam", and a clean result still lists what to verify.
- **Private by design.** Everything runs on your device. After the page loads it makes no network requests, which a browser test proves and the page's security policy enforces. There's no account, no server and no AI model reading your messages.

## How we built it
- **Planning.** We used the Devpost Learn Skill Pack: `scope.md`, `prd.md` and `spec.md`, then a sliced build checklist.
- **Stack.** The app is React 19, TypeScript and Vite, deployed to GitHub Pages.
- **The engine** is plain TypeScript, and it runs in a Web Worker with a 2-second timeout and an in-page fallback. It works in four stages:
  - It parses chat exports and email chains into messages, without dropping anything the other person wrote.
  - It normalizes tricks scammers use to dodge filters: "t e l e g r a m", "tra1ning", look-alike Cyrillic letters, zero-width characters and 𝗯𝗼𝗹𝗱 Unicode. Every highlight still maps back to the exact characters you pasted.
  - It runs 25 readable rules written from FTC guidance. Signs of a real hiring process soften them: a named HR system, a video interview, or the employer paying for equipment.
  - It scores the steps of the script and predicts the next one.
- **The rules are data.** The "How it works" page renders the same rule list the engine runs, so the explanation can't drift from the behavior.
- **Testing.**
  - 116 engine tests, including 46 adversarial cases from a separate agent that read the code and tried to break it.
  - 42 browser tests covering the core journey, every error state, keyboard-only use, axe accessibility checks in light and dark mode at phone and desktop sizes, and zero network requests.

## How we measured accuracy (honestly)
- After the rules were frozen, a separate AI agent that never saw them wrote a held-out test set: 40 scams across the five scripts, and 40 deliberately tricky genuine recruiter messages.
- On the first and only blind run, Tipoff flagged **34 of 40 scams**. It wrongly flagged **2 of 40 genuine messages**, both as "Worth a closer look"; none was called "Likely scam". It matched 28 of the 34 flagged scams to the right script.
- The messages are synthetic, so this isn't real-world accuracy, and the app's How it works page says so and lists every miss.
- A later rerun after fixes is shown separately and labeled "not blind", because we had seen the results.

## Challenges we ran into
- **Real conversations are messy.** Email signatures and "Pay Rate:" lines looked like chat speakers, and the first parser dropped the email body above them. An adversarial test round found this, and the parser now never drops the other person's text.
- **Knowing who "you" are.** A victim asking "Is there a Workday portal?" was being counted as a sign of a real employer. We added a guess at who the user is. A wrong guess could hide a scammer's messages, so Tipoff also judges the thread without the guess and keeps whichever reading warns more.
- **Honest numbers.** It was tempting to tune on the test set's misses. We didn't: the blind number stays the headline.

## Accomplishments that we're proud of
- **The prediction comes true in the demo.** After the recruiter's first message, Tipoff says "Next: a 'hire' after a chat-only interview". Message three is a Telegram interview, and message four is "you've been hired".
- Every warning shows its evidence.
- Our own tests caught a real privacy bug in the app's promise: pasting a name like "Łukasz" made the browser fetch a font file mid-check. Fonts now load up front, and a test checks for it.

## What we learned
- Write tests that can actually fail. Our offset test compared a highlight with itself, so it passed while every highlight after an emoji was off by one letter. A test of a real property — "a highlight never cuts a word in half" — caught that bug and another one.
- Publish the misses. A tool that never says "safe" and shows its blind error rate is more trustworthy than one with a confident score.

## What's next for Tipoff
- More languages, starting with Spanish. Today non-English messages get a notice and a link to the FTC guide.
- More scripts, such as "membership" or "verification" fees. These are known misses, listed on the How it works page.
- A browser extension or share target, so checking a message doesn't need copy and paste.
- A test on real reported messages, with permission and with personal data removed.

## Built with
TypeScript, React, Vite, Web Workers, Vitest, Playwright, axe-core, GitHub Pages

## Links
- Live app: https://shreymp.github.io/buildwithai/
- Code (MIT): https://github.com/shreymp/buildwithai
- Demo video: ⚠ add your YouTube/Vimeo link after uploading

## AI use disclosure (keep this)
An AI coding agent (Claude Code) planned, designed, coded and tested this project with the Devpost Learn Skill Pack, under the direction of the repository owner. Separate AI sub-agents wrote the held-out test set, ran the adversarial tests and acted as design critics. This submission text was drafted by the agent at the owner's request. Tipoff itself uses no AI model at runtime.

---

## ⚠ Check before you submit
1. **The FTC figure ($90M in 2020 → $501M in 2024, job and employment-agency scams).** I confirmed it only through search-result summaries of the FTC's March 10, 2025 press release ("New FTC Data Show a Big Jump in Reported Losses to Fraud to $12.5 Billion in 2024"). I could not open ftc.gov from the build sandbox. Open the release and confirm the numbers, or delete the sentence.
2. **Test counts (116 engine, 42 browser).** These are true as of commit `6a06bb1`. If you change the code, run `npm test` and `npm run e2e` and update them.
3. **The video link**, once uploaded.
