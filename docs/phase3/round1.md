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

## Engine changes

(Pending the adversarial tester's report. Rules are no longer frozen after this round. The blind v1.0 number stays as the headline accuracy, and any post-change number is labeled as such.)
