---
doc: scope
status: approved
---

# Tipoff

A private, in-browser checker that reads a job recruiter's message, or a whole conversation, and tells you which job-scam script it follows, how far along you are, and what the scammer will most likely ask for next.

## The Unique Kernel
Most scam checkers say *whether* a message looks like a scam. Tipoff says *which script* it follows, *which step of that script* you're on, and *what comes next*, and it points to the exact words that gave it away. Job scams run on a few well-documented scripts: the fake check for "equipment", pay-to-unlock "task" work, package reshipping, upfront training fees, and identity harvesting. Knowing the script turns a vague worry into a specific warning you can act on before the costly step.

## Who It's For
Maya, 23, graduated in May. She's applying to remote entry-level jobs and gets a text: "$45/hr remote data entry, no experience needed, interview on Telegram." She half-suspects it but isn't sure, and the pay would cover rent. Today she would google pieces of it, ask a friend, or paste it into a chatbot and get a generic "this could be a scam."

More broadly: students, recent grads, career changers, and anyone looking for remote work who receives unsolicited recruiter texts, WhatsApp/Telegram messages, LinkedIn DMs or emails.

## The Core Loop
1. Paste a message, or the whole thread so far, and check it.
2. See the verdict, the script step you're on, and the phrases that triggered it. Tap a phrase to see why it matters.
3. When the "recruiter" writes again, paste the new message and watch the script advance. Before replying or sending anything, use the "Verify them" reply or follow the action plan.

They come back every time a new message arrives in the conversation, or when a friend forwards one.

## Inspiration & Identity
Calm, trustworthy, plain-spoken, like a knowledgeable friend, not an alarm siren. References: Grammarly's inline marks with explanation cards (https://www.grammarly.com), the single-input flow of Have I Been Pwned (https://haveibeenpwned.com), and the plain-language public-service patterns of the GOV.UK Design System (https://design-system.service.gov.uk) and USWDS (https://designsystem.digital.gov). Mobile-first, because these messages arrive on phones. See `DESIGN.md` for the researched design direction.

## Why This Matters to the Learner
The learner (repository owner `shreymp`) chose this direction from three spiked options during the planning review and approved the plan in full: "Approved, run it." They delegated design, the submission write-up and hosting to the agent. They gave no personal story, so none is invented here. The public-interest stake is documented: the FTC reports job-scam losses rose from $90M in 2020 to $501M in 2024.

## What "Working" Looks Like
Someone opens the page, pastes Maya's first text and taps **Check**. Tipoff shows "Worth a closer look", highlights "interview on Telegram" and "no experience needed", puts her at step 2 of the script, and warns: *next, they'll "hire" you after a chat-only interview.* She pastes the rest of the thread, where they hire her by chat and offer to mail a check for equipment from their "approved vendor". The verdict becomes "Likely scam", the timeline names the fake-check playbook, and the card says *next they'll ask you to pay the vendor or send back the "extra".* **The "oh, that's cool" beat: the prediction came true one message later.** A genuine recruiter email checked right after gets "No known scam pattern found", along with what to verify anyway.

## The POC Boundary
- English text pasted or typed into one page, with a single message or a pasted thread split into messages.
- Five job-scam playbooks, each a five-step script, plus shared early-stage signals.
- Results: verdict band, script timeline with a next-move card, highlighted phrases with explanations, an action plan with official reporting links, a copyable "Verify them" reply, and notes on senders and links.
- A "How it works" page: the rules in readable form and accuracy measured on a held-out test set.
- Runs entirely in the browser. No account, no server, and nothing sent anywhere.

## Later
- Screenshot reading (on-device OCR) so people can drop in a screenshot of a text.
- Lookalike-domain detection against the company a message claims to be from.
- Spanish and other languages.
- A share-sheet or browser-extension entry point.
- Shareable redacted reports for career centers.

## Explicitly Cut
- **An AI chatbot verdict.** It would need a paid API and a server, it would send private messages off-device, and its reasoning couldn't be shown. Transparency and privacy are the point.
- **On-device OCR.** By default tesseract.js loads its worker from a CDN, which breaks "nothing leaves your device". It also adds about 14 MB and loses who said what. Moved to Later.
- **Installable offline app (PWA).** A service worker can serve judges a stale build.
- **Accounts and history.** Storing people's messages works against privacy.
- **Telling people a message is "safe".** No tool can promise that; the lowest band says "No known scam pattern found".
