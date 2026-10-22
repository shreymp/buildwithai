# Demo video script (target 2:40, hard limit 3:00)

Record the live site, https://shreymp.github.io/buildwithai/, or a local `npm run preview`, in a desktop browser window about 1440 × 900. Use a browser profile with no extensions showing, and zoom to 110% so the text reads on video. Every message below is fictional and already in the app, except the failure case, which you paste (the text is at the bottom). Total read time at a calm pace is about 2:35.

| Time | On screen | Say (about 150 words per minute) |
|---|---|---|
| 0:00–0:15 | The empty check page. Slowly hover the headline. | "Job scams don't arrive as one obvious message. They follow a script: a friendly hook, a move to WhatsApp or Telegram, a 'hire' after a text-only interview, then a check, a fee or a request for your SSN. Tipoff shows you that script while it's happening." |
| 0:15–0:30 | Click **Remote data entry offer**. Message 1 of 6 is checked. Point at "Worth a closer look" and the timeline. | "Here's the first message of a fictional conversation. Tipoff checks it on my device. Nothing is sent anywhere. It's 'Worth a closer look': an offer I didn't apply for, high pay, and a move to Telegram. That's steps one and two of the script." |
| 0:30–0:50 | Point at the **next move** card ("a 'hire' after a chat-only interview"). Click **Show the next message** twice. | "The important part is this card: what they'll likely do next. A text-only interview and an instant offer. Let's see what the 'recruiter' actually sent next…" (pause on message 3) "…an interview on Telegram." |
| 0:50–1:10 | Click **Show the next message**. The verdict changes to "Likely scam", and the reason says they haven't asked for money yet. | "And: 'you passed the interview and you've been hired'. Now it's 'Likely scam'. Notice it says they haven't asked for money yet. It only claims what's actually in the messages. Next, it says, they'll ask for something: most often a check to buy equipment." |
| 1:10–1:35 | Click **Show the next message** twice. The script lands on step 5, "Stop here". Scroll to **What to do now**. | "There's the check, and then the ask: send $2,400 to their vendor through Zelle. That's the fake-check scam. The check bounces days later, and the money you sent is gone. So Tipoff says: stop here, don't deposit it, and here's where to report it." |
| 1:35–1:55 | Scroll to **In the messages**. Click a red highlight (for example "mail you a company check"). Its card is selected. | "Every verdict shows its evidence. Each highlight links to a plain-English reason, and red means a strong sign. There's no AI guessing here: 26 plain rules, written from the FTC's descriptions of real job scams." |
| 1:55–2:15 | **Failure case.** Click **Clear**, paste the membership-fee message below and press **Check message**. Result: no match. | "It isn't perfect. This one is a scam: a $95 'membership' to start a job. Tipoff misses it. But look at what it says: no pattern matched, and that isn't proof it's safe. It never tells you a message is safe, because scammers change their wording." |
| 2:15–2:35 | Open **How it works** and scroll to **How accurate it is**. | "So the accuracy is published, misses included. On a blind test written by a separate AI agent that never saw the rules, it flagged 34 of 40 test scams and wrongly flagged 2 of 40 genuine recruiter messages. The test is synthetic, and the page says so." |
| 2:35–2:45 | Back to the check page. | "Tipoff: see a job scam's next move before it happens. Open source, runs entirely in your browser." |

## Failure-case text to paste (copy it to your clipboard before recording)

```
Hi Chris, great news: the hiring team approved you for the remote Claims Assistant role. Before your start date, every new associate joins our staffing network. The annual membership is $95, charged to a debit card, and it covers your placement for the year. Reply to this email when it is done.
```

This was checked against v1.1 on 2026-10-22: no match ("None of Tipoff's job-scam patterns matched this text. That isn't proof it's safe…"). If a later rule change catches it, swap in another miss, or say "this used to be missed". Don't edit the rules to make the demo look better, and don't tune them so this message stays missed.

## Before recording

- [ ] Check every number you say against the How it works page on the build you're recording: 34 of 40, 2 of 40 (blind v1.0). If the page shows different blind numbers, say those.
- [ ] Rehearse once with a stopwatch. If you run over 2:50, cut the 1:35–1:55 highlight segment first.
- [ ] Don't show personal browser tabs, bookmarks or notifications.
- [ ] A silent backup recording made by the agent is at `submission/backup-video/` (see its README). It has no narration, so you can use it if a live take fails.
