# Phase 3, round 1

## Inputs

1. **Design critic (no context).** A sub-agent saw only the 28 v1.0 screenshots in `docs/screenshots/v1.0/`. It wasn't allowed to read the README, DESIGN.md or the source. Its report is summarized below; scores are its own.
2. **Adversarial tester (white-box).** A sub-agent read `src/engine/` and tried to break it with realistic inputs. It was not allowed to read the held-out or dev corpora. Findings: `eval/adversarial-findings.json` (triage below).

## Design critic: summary of the report

Scores (1–10): visual design 7, clarity 6, trustworthiness 7, mobile usability 4.

Keep, per the critic: the "checked on your device" line; the stepper idea ("Already happened / You are here / Likely next"), especially the vertical mobile version; inline highlights tied to plain-English reasons; the honest accuracy section with misses listed; genuine examples next to scam ones; the palette and serif headings.

Problems, ranked by the critic, and what we did:

| # | Critic's finding | Decision | Change |
|---|---|---|---|
| 1 | Mobile: the verdict starts ~980 px down; the hero and textarea stay above it | Fix | Once results exist, the intro paragraph hides and the textarea shrinks to 4 lines below 960 px. Focus (and so scroll) already moves to the verdict after a check. The critic saw full-page screenshots, which don't show that scroll. |
| 2 | "What to do now" is buried after 11 evidence cards | Fix | New order: verdict → script and next move → **what to do now** and the reply → messages → evidence → notes. Evidence cards aren't collapsed, because each highlight links to its card. |
| 3 | "Stop replying" contradicts the "Copy reply" button | Fix | At "Likely scam" the reply is titled "Only if you need proof first" and says the safest move is to stop replying. |
| 4 | Evidence errors: SSN not highlighted, forms.gle URL cut in half, "gift cards, crypto or wire" card quoting Zelle, two step-5 cards quoting the same phrase | Fix in engine (with the adversarial findings) | See "Engine changes" below. |
| 5 | Selecting a highlight changes nothing visible | Partly | The selected mark now has a 3 px outline. Selecting already scrolls to and focuses the card; full-page screenshots can't show that. No popover: the cards are the explanation, by design (DESIGN.md). |
| 6 | Severity coding muddy; left accent bars look like a stock AI-UI pattern | Fix | Left bars removed from cards and the next-move card. Strength is a colored badge (red "Strong sign", amber "Clear/Weak sign"). A legend above the messages shows both highlight styles. The verdict banner keeps its thick edge, which is the one alert. |
| 7 | Desktop stepper cramped; pills wrap | Fix | Columns top-aligned. Pills shortened to "Happened" / "Not seen", with one note below the stepper explaining "Not seen". |
| 8 | Copy: "This is me: **Me**", "You (Me)", the legend overflowing on mobile, "Why we flagged this" over a clean result, "Also noticed" with no affordance, error title repeated in the body | Fix (all except the last, which is engine copy) | Checkbox labels are just the names, under "Tick the names that are you". The bubble says "You" for Me/You/Myself. The legend wraps. A clean result is headed "What Tipoff looked for". The softened list shows a disclosure triangle. |
| 9 | Two "fives" (five steps and five scripts); steps 4–5 rename per script | Partly | The empty state now says "Scam scripts it knows". Steps 4–5 still take script-specific names once the script is known; that's the PRD's design, so the timeline can say "A check for equipment" instead of "The setup". |
| 10 | Non-English is a dead end; slashed zeros read as code; mono reply box wraps badly; error border inside the teal ring shifts layout; desktop left column empty | Mostly fix | Non-English notice links the FTC job-scam guide. The reply uses the body font. The error state uses an inset ring with no layout shift and a red focus ring. **Not changed:** the slashed zero is Atkinson Hyperlegible's deliberate glyph, which tells 0 from O for low-vision readers, so we keep it. The empty desktop column is left as is: a sticky input column was considered, but it isn't worth the layout risk before the deadline. |

The critic also said "written by a separate AI agent" on the accuracy page undercuts trust. **Not changed:** it's the accurate description of how the test set was made, and the working rules require labeling it.

## Found while fixing: a real privacy bug in v1.0

Moving the reply box out of monospace changed when the monospace font first loaded. The zero-network test then caught the browser fetching a font file mid-check. Digging further showed it was also true in v1.0: pasted text with letters like "Ł" made the browser fetch a latin-ext font subset during the check. That contradicts the promise of "no network requests after it loads". It was same-origin with no user data, but the claim must be exactly true.

- Fix: `src/main.tsx` loads every font face pasted text can use at page load.
- Test: `privacy.spec.ts` now checks a message containing "Ł". Verified failing on the old `main.tsx` (both the mono and latin-ext files requested) and passing on the new one.

## Adversarial tester: triage

The tester returned 46 cases: 35 problems (17 rated high, 15 medium, 3 low) and 11 that already worked. Every case is now a regression test in `tests/engine/adversarial.test.ts`, with the outcome a careful person would expect. The 11 passing cases are included so they stay passing.

- **Before (v1.0 engine, measured by running the new suite against commit `00d0b18`):** 34 of the 46 tests failed.
- **After:** all 46 pass (one with a changed expectation, logged in DECISIONS.md), along with every older unit, dev-set and end-to-end test.
- **Not fixed, by decision:** `fp_olivia_chatbot`, a real hiring chatbot's "Reply YES to start a chat-based screening", is still "Worth a closer look". Telling it apart from a scam's chat interview would need a list of chatbot vendors, and a closer look is a mild outcome for an unusual message. It's listed in the test file as accepted.

## Engine changes

Grouped by what went wrong. All are general fixes, none keyed to a test's wording.

**The parser dropped text the other person wrote** (labels_drop_body, fn_next_steps_labels, outlook_chain_sent, fp_labels_drop_workday, wa_copy_time_first, gmail_quoted_reply, truncation_email_newest_on_top)
- One-off "Pay Rate:" or "Next Steps:" lines in an email were read as chat speakers, and the email body before them was thrown away. Now a "Name: text" transcript needs a speaker who writes twice, or "Me" plus one other person. Text before the first speaker line is always kept.
- Email reply chains (Gmail "On … wrote:", Outlook "From:/Sent:" headers, "Original Message") are split into messages. The user is taken to be the recipient of the first quoted email.
- WhatsApp Desktop's "[time, date] Name:" format is recognized.
- Very long pastes keep the top of an email chain, where the newest message is, instead of the end.
- **A guess at who the user is, made fail-safe.** In "Lisa HR: Hello Jordan, …" followed by "Jordan Lee: …", Jordan is probably the user, so Jordan's "Is there a Workday portal?" shouldn't count as a sign of a real employer. The guess only applies when there are exactly two speakers and nobody is marked "Me". Because a guess can be wrong (a victim saying "Hi Lisa" would make the scammer "the user"), Tipoff judges the thread both ways and keeps the reading that warns more. The speaker checkboxes show the guess and override it. One adversarial expectation changed as a result (`wa_copy_time_first`, logged in DECISIONS.md).

**Text that hides from the rules** (bold_unicode_full, bold_unicode_post, chat_WA_abbrev, telegram_handle_only, terse_sms_not_english)
- Math-bold, full-width and circled letters ("𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽") are folded to plain letters before matching. Accented letters are left alone.
- "WA +1 555…", "Telegram: @handle" and "WhatsApp +1 (555)…" count as moving you to a chat app.
- Terse English ad copy was misread as "not English" because it has few common words. The check now compares common English words with common words from other languages. It also only calls text non-English when most letters aren't Latin.
- An email address's "@" is no longer read as the letter "a".

**Negation and warnings** (neg_dont_forget_id, neg_dont_hesitate_chat, fn_no_video_needed, fp_fraud_footer, fp_fraud_footer2)
- "Don't forget", "do not hesitate" and "without delay" no longer count as negations.
- "There is no need for a video call" no longer counts as a sign of a real interview.
- Scam-warning footers ("We will never ask you to pay a fee, buy from a vendor or share your bank login") list the very phrases the rules look for. Matches inside such a sentence are now ignored.

**Signals a scammer can fake** (fn_phish_onboarding_portal, fp_adp_direct_deposit)
- Any link can be called an "onboarding portal". Only named HR and payroll systems (Workday, Greenhouse, ADP, Gusto and similar) still soften the identity rules. A generic "portal" mention now softens only the three weakest signs.

**Rule wording gaps** (identity_need_ssn, upfront_program_fee, upfront_purchase_our_software, upfront_registration_giftcard, reshipping_logistics, pass_reshipping, task_short_ask)
- New phrasings: "I'll need your SSN", "you have been selected for the … position", "the program fee is $249", "purchase our software", "Logistics Coordinator", a negative balance ("-$356.20") or "shortfall".
- **New rule `reship_out` (step 5):** relabeling or shipping the packages on. Before this, a reshipping scam could never reach step 5, so the timeline couldn't say "you are at the ask".
- **New rule `account_access` (step 5):** bank login or card number. It's never softened, because no payroll system needs either. Routing and account numbers stay in the softenable identity rule, since real payroll forms ask for them.
- A tie between two scripts now names neither, instead of picking the first. Buying from "their vendor" now counts toward both fake-check and pay-for-the-job.

**Rules that fired on normal messages** (fp_signon_bonus_check, fp_confidential_search, fp_small_biz_zelle, fp_it_vendor, fp_contract_rate, fp_mailroom_post)
- "Your bonus will be paid via check" no longer counts as the fake-check setup.
- "Keep this confidential" only counts as secrecy when the message also talks about money or a bank.
- "We pay every Friday via Zelle" (an employer paying you) is no longer a hard-to-trace payment *from* you.
- "Our equipment vendor, CDW, will ship your laptop" no longer counts. Only an "approved", "designated" or similar vendor does.
- "$95/hr, fully remote" is no longer "too good" just because it's remote.
- Forwarding packages and printing labels only count as reshipping when the message mentions doing it from home.

## Found while fixing: highlight bugs

The design critic said some quotes were wrong ("SSN not highlighted", "forms.gle URL cut in half", a "gift cards, crypto or wire" card quoting Zelle, two cards quoting the same words). Looking into it found two more problems:

- **A bug this round introduced and caught before commit:** the new Unicode folding mis-mapped offsets after an emoji, so in the "rating hotels" sample every highlight after 😊 was shifted by one letter ("imple tasks"). The existing test only compared a quote with the text at its own offsets, which can't catch a shift. Fixed, plus a normalizer test and a new check on every sample and adversarial case: **no highlight may start or end inside a word.**
- That check then caught highlights that stopped at the first digit of an amount ("$2" for "$280"). Amounts and phone numbers are now captured whole.
- Quote fixes: the full forms.gle link is highlighted. "…and your SSN" at the end of a long list is highlighted. The hard-to-reverse payment card quotes the payment method itself ("through Zelle", "gift cards", "USDT") and is retitled "Paying in a way you can’t undo".

- **Caught in self-review before commit:** the first version of the new `reship_out` rule made the object after "forward" optional, so "I’ve forwarded your resume… work from home" would have been a strong step-5 sign. "Forward" now needs packages, parcels or items after it, and a test covers the resume case.

## Accuracy after the changes (not blind)

The held-out corpus results had been seen before these changes (DECISIONS.md §7), so a rerun can't be blind. It is reported only next to the blind v1.0 number, never in place of it.

| | Blind v1.0 | v1.1 rerun (not blind) |
|---|---|---|
| Scams flagged | 34 of 40 | 34 of 40 |
| …of those, "Likely scam" | 11 | 12 |
| Genuine messages flagged | 2 of 40 | 1 of 40 |
| Genuine messages called "Likely scam" | 0 | 0 |
| Right script | 28 of 34 | 29 of 34 |

The genuine message that is no longer flagged (h69) cleared because of the Zelle change, which came from the adversarial case `fp_small_biz_zelle`. But h69 was already known to be a false positive, so this isn't independent evidence. The six misses are unchanged. Three of them hinge on "membership" or "verification" fees, and those phrasings were deliberately **not** added, because they're known only from the held-out set.

The How it works page shows the blind numbers as the headline. The rerun is a labeled footnote (`src/data/accuracy-rerun.json`), and an end-to-end test checks the label.
