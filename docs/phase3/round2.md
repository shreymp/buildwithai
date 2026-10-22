# Phase 3, round 2: fixes from the blind reviewer's remaining problems

## Input

The blind A/B reviewer from round 1 listed the problems it still saw in the better versions. All of them are below, with what was done. Feature freeze is 2026-10-25 18:00 EDT.

| Problem the reviewer saw | Decision | Change |
|---|---|---|
| Sign strength is labeled two ways: the legend says "Strong / Weaker", the cards say "Strong / Clear / Weak", and "Clear" uses the "Weaker" color | Fix | The legend now reads "Strong sign" and "Clear or weak sign", matching the two highlight styles and the three card labels. |
| Long highlights act like blocks on phones and leave punctuation stranded at the start of the next line | Fix | Root cause: highlights were `<button>`s, which Chrome lays out as inline blocks. They are now `<mark role="button" tabindex="0">` elements that wrap like text, with Enter and Space handled. The keyboard-only e2e test opens a card from a highlight with Enter, and still passes. |
| "This follows the pay for the job job scam" | Fix | The reason no longer adds "job" after a script name that ends in "job". Test: no sample's reason contains "job job". |
| "Where this ends" always says "don't deposit anything they send", even for identity and fee scams | Fix | Each script has its own advice. For example, identity: "Don't send your SSN, ID photos or bank details…". Test: no script uses the generic line, and the identity and fee scripts don't mention deposits. |
| The verify reply asks a genuine recruiter for a video interview they already offered | Fix | With no warning signs, the reply asks only for the careers-site link and a company email. |
| A safety-warning quote is cut at "…or your Social Security" | Fix | The pattern now takes "number", "bank details" and similar endings. |
| The examples footnote says all examples come from FTC scam descriptions, but two are genuine | Fix | "Examples are fictional. The scam examples follow the FTC's descriptions of real job scams." |
| The "What they'll likely ask next" heading sits over content that isn't an ask | Fix | Now "What they'll likely do next". The page intro uses the same words. |
| A plan link's external-link icon is pushed to the far right when the link wraps | Fix | The link is inline, and the icon follows the text. |
| The "English only" notice is written only in English | Not changed | Translating the app is out of scope for the proof of concept (PRD). The notice links the FTC guide. |
| Mobile result pages are very long (10,000+ px) with 10+ evidence cards | Not changed | Each highlight links to its card, so the cards can't be collapsed without breaking that link. The action plan already comes before the evidence. Logged as a known limitation. |
| The task-scam reply template asks for a careers-site link and an interview | Not changed | A real employer can answer both, so the request still separates real from fake. Lower priority than the rest. |

## Verification

- Unit tests: 116 pass. New tests: "copy fits the case" (job job, per-script stop advice, the clean-result reply, the full safety quote).
- E2E: 42 pass on desktop and mobile, including keyboard-only, axe in light and dark, the 24 px target check, and zero network requests.
- Screenshots: `docs/screenshots/v1.2/`. The mobile message thread was checked by eye: highlights wrap like text and the punctuation stays on its line.
