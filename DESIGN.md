# DESIGN.md — Tipoff

Design research and the starting design system for Tipoff. Written 2026-10-22.

**How the research was done.** Web pages could not be opened from this sandbox (WebFetch returned `ENOTFOUND`, for example on design-system.service.gov.uk). Every finding below comes from **web search result snippets only**. Each source URL is one the search returned. Items marked **(unverified)** come from secondary sources or my own product knowledge and should be checked before anyone quotes them. Fonts were checked against the npm registry. Contrast ratios were computed with a script, not estimated.

---

## 1. Purpose & user

**Who it is for.** Job seekers looking for remote or entry-level work: students, recent graduates and career changers. A "recruiter" texts or DMs them. They are often on a phone, often anxious, and sometimes already partway into the conversation. Some have already deposited a check.

**What the screen has to do, in priority order:**
1. **Verdict band.** Three levels: *No known scam pattern found* / *Worth a closer look* / *Likely scam*. Tipoff never says "safe".
2. **Scam script timeline (the hero).** Five steps of the playbook it matched, with *You are here* and *What they'll likely ask next*.
3. **Evidence.** The user's own messages with highlighted phrases. Tapping a highlight selects the matching explanation card in the list below it. There are no popovers.
4. **What to do now.** Steps plus official reporting links (e.g. ReportFraud.ftc.gov, which the FTC names as the place to report job scams — [FTC business blog](https://ftc.gov/business-guidance/blog/2023/01/taking-ploy-out-employment-scams)).
5. **"Verify them" reply** that the user can copy.
6. **How it works.** The rules, plus measured accuracy.

**Tone.** A knowledgeable friend: calm and plain, specific rather than dramatic. The interface must not add to the user's anxiety, and it must not play down a real threat either.

---

## 2. Reference products (quality bar)

| Product | What it does well | Decision for Tipoff | Source |
|---|---|---|---|
| **Grammarly** (inline suggestions + sidebar) | Color-coded underlines by category (red = correctness, blue = clarity, etc.). Clicking an underline opens a card with actions and "Learn more". A sidebar lists every suggestion, grouped by theme, so users can review without hunting through the text. | Use the **mark-plus-list** model. Every highlight has a matching card in an always-visible list; the mark selects the card and the card scrolls back to the mark. **Not adopted:** hover cards and color-only categories. Our severity uses underline *style* as well as color (see §8). | [Grammarly support](https://support.grammarly.com/hc/en-us/articles/5321259769357-I-don-t-see-the-full-list-of-suggestions-when-using-the-Grammarly-browser-extension), [Pocketnow on the sidebar](https://pocketnow.com/grammarlys-advanced-editing-tools-arrive-on-google-docs-alongside-a-nifty-sidebar) |
| **Have I Been Pwned** | One input and one button lead to a one-line verdict ("Good news — no pwnage found!" / "Oh no — pwned!"), then the details. Coverage notes that a "no pwnage" result does not prove you are safe. | One input feeds one result, with the **verdict sentence first** and the details after it. HIBP's green "good news" framing is **deliberately not** copied: our lowest band is neutral, with no checkmark and no green, because we cannot prove a negative. | [haveibeenpwned.com](https://haveibeenpwned.com/), [Journal du Geek](https://www.journaldugeek.com/2016/02/01/have-i-been-pwned-donnees-piratees/) |
| **Google Messages Scam Detection** | Labels a conversation "likely scam" and offers two plain next actions: report and block, or "not a scam". Analysis runs on the device. | Borrow the wording ("Likely scam"), the **two-action pattern** on the verdict, and the **on-device privacy promise**, stated once near the input. | [Google blog](https://blog.google/security/new-ai-powered-scam-detection-features/), [CNN](https://edition.cnn.com/2025/05/13/tech/unpaid-toll-scam-text-message-detection-google-android) |
| **Chrome security warnings** (Felt et al. redesign) | Uses "opinionated design": the safe choice is visually prominent and the risky path is de-emphasized. The redesign shipped in Chrome. | The **safe action is the visually dominant button** in "What to do now" (e.g. *Copy the verify-them reply*, *Report it*). Risky actions such as "reply anyway" never get a button. | [Google Research, CHI 2015](https://research.google/pubs/improving-ssl-warnings-comprehension-and-adherence/) |
| **Stripe docs** | Prose and its matching code sit side by side, and hovering a paragraph highlights the code it describes. Teardowns credit the authoring discipline more than the grid. | On desktop (≥960px), messages sit on the left and explanation cards on the right, with **linked selection in both directions**. On mobile the layout stacks. *How it works* reads like docs: one rule per section, each with a real example. | [Moesif teardown](https://www.moesif.com/blog/best-practices/api-product-management/the-stripe-developer-experience-and-docs-teardown/), [KnowledgeOwl](https://www.knowledgeowl.com/blog/posts/code-examples-shine-like-stripe) |

**Not used as a model: VirusTotal.** Its "X / Y vendors" ratio shows that a zero score is still not a clearance (forum discussions: [Palo Alto community](https://live.paloaltonetworks.com/t5/virustotal/false-positive-on-virustotal/td-p/233066)). It is a lesson in caution, not a layout to copy.

**Empty, loading and error states (unverified).** None of these products' empty, loading or error states could be verified from search snippets. The Tipoff state decisions are in §6 and rest on the design-system guidance, not on these products.

---

## 3. Design-system guidance

| Finding | Decision for Tipoff | Source |
|---|---|---|
| GOV.UK **Warning text**: an icon plus a visually hidden "Warning" label, reserved for serious consequences. Lower-stakes information uses inset text instead. | The verdict banner has an icon, a **visible text label**, and a hidden prefix for screen readers ("Verdict:"). The full warning treatment is reserved for *Likely scam*. *Worth a closer look* uses a quieter bordered panel. | [GOV.UK warning text](https://design-system.service.gov.uk/components/warning-text) |
| GOV.UK **Textarea**: for multi-line input. The label can be the page heading. The hint is tied to the field with `aria-describedby`. | The input is a `<textarea>` labelled "Paste the message or conversation" (this label is the h1). The hint reads "Nothing you paste leaves your device. Include earlier messages if you have them." | [GOV.UK textarea](https://design-system.service.gov.uk/components/textarea/) |
| GOV.UK **Error message / Error summary**: say what went wrong and how to fix it, with a hidden "Error:" prefix. The NHS adds that focus moves to the summary. | The only real input error is an empty submit: "Paste a message to check it." It appears inline and focus returns to the textarea. Error wording never blames the user. | [GOV.UK error message](https://design-system.service.gov.uk/components/error-message), [NHS error summary](https://service-manual.nhs.uk/design-system/components/error-summary) |
| USWDS **Process list**: for high-level sequential steps, 3–10 of them. Use a **Step indicator** for form progress instead. | The scam timeline is a **process list**, not a step indicator: it describes the scammer's sequence, not the user's progress through a form. It is a semantic `<ol>` with 5 steps, and the current step carries `aria-current="step"`. | [USWDS process list](https://designsystem.digital.gov/components/process-list), [USWDS step indicator](https://designsystem.digital.gov/components/step-indicator/) |
| USWDS **Alert**: status types (info, warning, success, error). Inline feedback is preferred over a single top alert. | The verdict banner is placed inline at the top of the results. Tipoff uses **no toasts**: the only transient feedback is the "Copied" confirmation. | [USWDS alert](https://designsystem.digital.gov/components/alert/) |
| Material 3 **color roles**: *container* fills pair with *on-container* text, and container colors are not used for text. | Each verdict gets a `*-subtle` fill, a `*-text` color and a `*-border` color (for icons and borders), and every pair is measured (§9). | [Compose ColorScheme](https://kotlinlang.org/api/compose-multiplatform/material3/androidx.compose.material3/-color-scheme/), [Wear color roles](https://developer.android.com/design/ui/wear/guides/styles/color/roles-tokens) |
| Material **state layers**: hover, focus and press shown as overlays at set opacities, one layer at a time. The exact M3 percentages were **unverified** (≈8% hover, 10% press from memory). | Tokens use an 8% hover overlay and a 12% press overlay of the content color. Focus uses a **ring**, not an overlay, so it meets the 3:1 contrast requirement. | [M2 states](https://m2.material.io/go/design-states), [Liri StateTokens](https://docs.liri.io/sdk/fluid/develop/structFluid_1_1StateTokens.html) |
| Touch targets: Material **48×48dp**, Apple **44×44pt** (secondary sources), WCAG 2.2 **2.5.8 Target Size (Minimum)**: 24×24 CSS px, with exceptions for inline text and equivalent controls. | All controls are at least 44px tall, and the primary button is 48px. Highlights are inline text (exempt), but they get extra vertical padding and an **equivalent control** in the card list, so we pass on both counts. | [Android touch target](https://support.google.com/accessibility/android/answer/7101858), [Roselli on 44pt](https://adrianroselli.com/2019/06/target-size-and-2-5-5.html), [W3C What's new in 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22) |
| WCAG 2.2 **2.4.11 Focus Not Obscured (Minimum)**: a focused item must not be entirely hidden by author content such as sticky headers or bars. | The mobile sticky action bar sets `scroll-padding-bottom` equal to its height, and cards use `scroll-margin`. Tipoff has no sticky header. | [W3C What's new in 2.2](https://w3.org/WAI/standards-guidelines/wcag/new-in-22/), [TetraLogical](https://tetralogical.com/blog/2023/10/05/whats-new-wcag-2.2) |
| WCAG **1.4.11 Non-text Contrast**: 3:1 for UI component boundaries and state indicators. **1.4.1 Use of Color**: color alone must not carry meaning. | Input borders, focus rings, highlight underlines and verdict icons are all at least 3:1 (§9). Each verdict has its **own icon shape plus a text label**, and severity in the marks is shown by underline **style** (solid vs dashed). | [W3C Understanding 1.4.11](https://w3.org/WAI/WCAG22/Understanding/non-text-contrast) |
| WCAG **3.3.2 Labels or Instructions**: give labels and needed format help, but don't clutter. | One label, one hint line, and example chips. There is no long instruction block. | [W3C Understanding 3.3.2](https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions) |
| WCAG **2.3.3 Animation from Interactions** (AAA) and technique C39 (`prefers-reduced-motion`). | All movement is disabled under reduced motion, and `scrollIntoView` falls back to `behavior: 'auto'` (§9). | [W3C C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39.html), [Deque 2.3.3](https://dequeuniversity.com/resources/wcag2.1/2.3.3-animations-from-interactions) |
| Apple HIG: maintain a legible minimum size and support Dynamic Type. A 17pt default body is widely cited **(unverified against Apple's own table)**. | Body text is 17px and sizes use `rem`, so browser zoom and text settings scale them. No text is smaller than 13px. | [Apple typography](https://developer.apple.com/design/human-interface-guidelines/typography.md), [Figma forum](https://forum.figma.com/t/apple-human-interface-font-sizes/26267) |

---

## 4. Risk-communication findings

1. **Warning design changes what people do.** In a field study of more than 25 million warning impressions, people clicked through malware and phishing warnings 9–23% of the time. For SSL warnings the rate was 33% in Firefox and 70% in Chrome ([Akhawe & Felt, USENIX Security 2013](https://usenix.org/conference/usenixsecurity13/technical-sessions/paper/akhawe)). **Decision:** the verdict design is treated as behavior design, and we test the copy, not just the colors.
2. **Opinionated design improves adherence; comprehension is harder.** Nearly 30% more users stayed safe with Chrome's redesigned warning, but the authors report that "comprehension rates remain lower than desired" ([Felt et al., CHI 2015](https://research.google/pubs/improving-ssl-warnings-comprehension-and-adherence/)). **Decision:** do both. The safe action is the dominant button, *and* each card explains *why* in one sentence that points to the user's own words.
3. **Warnings people skim past fail.** In a lab study of phishing warnings, 79% of participants heeded active warnings, while only one participant heeded the passive indicator ([Egelman, Cranor & Hong, CHI 2008](https://kilthub.cmu.edu/articles/journal_contribution/You_ve_Been_Warned_An_Empirical_Study_of_the_Effectiveness_of_Web_Browser_Phishing_Warnings/6626570)). **Decision:** the verdict is the first thing in the results and receives focus. It is never a small badge.
4. **Habituation.** fMRI and eye-tracking work shows attention to repeated, identical warnings declines, and "polymorphic" warnings whose appearance changes resist this ([Vance et al., MISQ 2018](https://misq.org/tuning-out-security-warnings-a-longitudinal-examination-of-habituation-through-fmri-eye-tracking-and-field-experiments.html)). **Decision:** no generic boilerplate. The banner sentence names the matched playbook ("This follows the fake-check job script"), and the timeline differs for each playbook.
5. **Main message first, plus why and how.** The CDC Clear Communication Index scores whether the main message is visible without scrolling, whether a recommendation explains *why*, and whether it gives specific *how* steps ([CDC index](https://www.cdc.gov/ccindex/widget.html), [scoring detail](https://stacks.cdc.gov/view/cdc/21458/cdc_21458_DS1.pdf)). **Decision:** on a 375×667 screen, the verdict label, its one-sentence reason and the first action sit above the fold. Each action has a *why* line.
6. **Numbers.** The CDC recommends natural frequencies ("1 in 4") paired with words. The research is mixed: "1 in X" is quicker to read but can inflate perceived risk ([CDC CCI item](https://www.cdc.gov/ccindex/tool/page-20.html), [SMDM 2011](https://smdm.confex.com/smdm/2011ch/webprogram/Paper6247.html)). **Decision:** the How-it-works page shows "caught 19 of 20 test scams" *and* the percentage, and states that the test set was synthetic. Results never show a confidence percentage.
7. **Signal words.** DANGER, WARNING and CAUTION are the conventional high-to-low hazard words, and signal words plus icons raise conspicuity (snippet from [Wogalter et al. 2002 listing](https://ci.lib.ncsu.edu/profiles/vcconzol); full text not seen). **Decision:** three fixed, distinct band labels written as plain sentences, each with its own icon shape.
8. **Error messages** should be visible, near their source, written in plain language, constructive, and free of blame ([NN/g](https://www.nngroup.com/videos/error-message-communication-guidelines/)).

---

## 5. Typography

All packages were verified with `npm view` on 2026-10-22, and all are OFL-1.1.

| Role | Family | Package (version) | Why |
|---|---|---|---|
| UI and body | **Atkinson Hyperlegible Next** | `@fontsource-variable/atkinson-hyperlegible-next` (5.3.0); static: `@fontsource/atkinson-hyperlegible-next` (5.3.0) | Made by the Braille Institute for legibility. The 2025 release has 7 weights, a variable version and 150+ languages ([Wikipedia](https://en.wikipedia.org/wiki/Atkinson_Hyperlegible), [Ophthalmology Mgmt](https://ophthalmologymanagement.com/news/2025/applied-design-and-braille-institute-partner-to-launch-typeface-for-making-reading-easier/)). It is distinctive without being trendy. Telling look-alike characters apart (l/I/1, 0/O) matters when users read spoofed domains; this is the font's widely described aim **(not confirmed in snippets)**. |
| Headings, verdict title | **Source Serif 4** | `@fontsource-variable/source-serif-4` (5.3.1). Import `opsz.css` for the optical-size axis | An open-source Adobe serif with an optical-size axis, so it reads well at both 20px and 36px ([Adobe blog](https://blog.adobe.com/en/publish/2021/03/04/source-serif-gets-optical-sizes)). It gives a calm, editorial "knowledgeable friend" voice rather than a security-dashboard look. |
| Reply template, URLs (optional) | Atkinson Hyperlegible Mono | `@fontsource-variable/atkinson-hyperlegible-mono` (5.3.0) | Same family as the body. Use it only for literal strings such as domains and the copyable reply. |

**Why not Inter.** It is a fine font, but it is the default of the generic AI-built look (§7), and Atkinson's character disambiguation is directly useful for this product.

**Budget.** The Latin `wght` subset of Atkinson Next is about 34 KB woff2 (from the `npm pack` listing). Load Latin subsets only, with `font-display: swap`.

---

## 6. Component states checklist

"—" means the state does not apply.

| Component | Default | Hover | Focus | Active | Disabled | Loading | Empty | Error | Success |
|---|---|---|---|---|---|---|---|---|---|
| **Text area** | 1px `border-strong`, min-height 8 lines, label as h1 plus hint | Border changes to `text-muted` | 2px `focus` ring with 2px offset | — | Never disabled | Read-only while analysis runs for more than 300ms | Placeholder-free; hint and sample chips below | 2px `danger-border`, inline "Paste a message to check it." with hidden "Error:" prefix, focus returned | — |
| **Primary button** ("Check message") | `accent` fill, 48px tall, full width on mobile | `accent-hover` | Ring | 12% overlay, no scale | Not used: an empty submit shows the error instead (GOV.UK pattern) | Label becomes "Checking…" with `aria-busy`. Spinner only if over 300ms; typical runs are under 15ms. Large pastes measured ~772ms in the spike (DECISIONS.md) | — | — | Focus moves to the results heading |
| **Highlight mark** | `mark-danger`/`mark-caution` fill plus 2px underline (solid = high, dashed = medium). It is a `<button>` inside the text | Underline grows to 3px | Ring | Selected: 2px `accent` outline, and the card is selected | — | — | — | — | Selected stays visible until another mark is selected |
| **Explanation card** | `surface`, 1px `border`, left 4px rule in the severity color, signal name, quote, one-line why | 8% overlay | Ring | Selected: 2px `accent` border, "Selected" shown as text, `aria-current` | — | — | "No phrases matched our rules." plus a link to How it works | — | — |
| **Timeline step** | Number in a circle plus title plus one line | — (not interactive) | Focusable only if expandable | — | — | — | No playbook matched: the timeline is hidden and replaced by a "Common job-scam scripts" link | — | *You are here*: filled `accent` dot, text label, `aria-current="step"`. Past steps: check plus "Already happened". *Likely next*: dashed border plus label |
| **Verdict banner** | Band icon plus label (Source Serif 600) plus one-sentence reason plus 2 actions | — | Heading gets `tabindex=-1` focus on render | — | — | No skeleton; results render in one pass | Not shown before a check | Engine failure: "Something went wrong on our side. Your text was not sent anywhere. Try again." | — |
| **Copy button** | Secondary: `surface` fill, `border-strong`, at least 44px | 8% overlay | Ring | 12% overlay | — | — | — | Clipboard blocked: select the text and show "Press and hold to copy" | Label becomes "Copied" with a check for 2s, announced via `aria-live="polite"` |
| **Sample chip** | Pill with `border`, labelled "Example: fake check job", at least 44px tall | `accent-subtle` fill | Ring | 12% overlay | — | — | Shown when the textarea is empty | — | Fills the textarea and runs the check. A banner says "This is an example message" |

---

## 7. Anti-patterns ("AI-generated look") and what Tipoff does instead

| Avoid | Tipoff instead |
|---|---|
| Purple-to-blue gradients, gradient text, glassmorphism | Flat paper-toned surfaces and one deep teal accent |
| Inter plus Tailwind slate as the default type and color | Atkinson Hyperlegible Next and Source Serif 4 on warm neutrals |
| Sparkle icons, "AI-powered" badges, robot mascots | Say what it is: "rules based on FTC descriptions of job scams" |
| Fake "Analyzing with AI…" progress theater | Instant results. A loader appears only past 300ms |
| A hero with three icon feature cards | The input *is* the hero, and the first screen is a usable tool |
| "Confidence: 87%" pseudo-precision | Three bands plus the evidence that triggered them |
| A green shield or checkmark for "no pattern found" | Neutral band, info icon, "Scammers change scripts; here's how to verify anyway" |
| Hooded-hacker illustrations, red alarm screens, ALL CAPS | Calm serif headline and a specific sentence about *their* message |
| Floating tooltips and popovers over text | Selection linked to a persistent card list |
| Toasts for important information | Inline results. Only "Copied" is transient |
| `rounded-2xl` plus large soft shadows everywhere | Radius 6–12px, hairline borders, one elevation level for sticky UI |
| Emoji in headings, exclamation marks | Plain sentences in sentence case |
| Centered everything | Left-aligned reading column (max ~68ch) |

---

## 8. Verdict bands (not distinguished by color alone)

| Band | Label (exact) | Icon shape | Tokens |
|---|---|---|---|
| High | **Likely scam** | Octagon with "!" (stop) | `danger-*` |
| Medium | **Worth a closer look** | Triangle with "!" | `caution-*` |
| Low | **No known scam pattern found** | Circle with "i" (never a check) | `clear-*` (neutral slate-green, deliberately not "success green") |

---

## Design system (tokens)

A short proposal for the full token system to build on. There is **one accent** (deep teal), used for the primary action, links, focus and selection. The verdict colors are reserved for verdicts and are never used for decoration.

**Color, light / dark**

| Token | Light | Dark |
|---|---|---|
| `bg` | `#FAF8F5` | `#161513` |
| `surface` | `#FFFFFF` | `#211F1C` |
| `surface-sunken` | `#F2EFEA` | `#1B1A17` |
| `border` (decorative) | `#E4E0D9` | `#34312C` |
| `border-strong` (inputs) | `#7A7369` | `#8A8379` |
| `text` | `#1C1A17` | `#EEEAE4` |
| `text-muted` | `#5E5850` | `#B5AEA4` |
| `text-disabled` | `#A39C91` | `#6B655D` |
| `accent` / `accent-hover` | `#0F5F5A` / `#0B4A46` | `#6CC4B9` / `#8FD6CC` |
| `on-accent` | `#FFFFFF` | `#0B1F1D` |
| `accent-subtle` | `#E3F0EE` | `#1C2E2C` |
| `focus` | `#0F5F5A` | `#6CC4B9` |
| `danger-text` / `danger-border` / `danger-subtle` | `#9E2219` / `#C2362B` / `#FCECEA` | `#FFB4AB` / `#F2776B` / `#3B1A16` |
| `caution-text` / `caution-border` / `caution-subtle` | `#6E4300` / `#A86200` / `#FDF2D8` | `#F5CF7A` / `#D99A2B` / `#33270F` |
| `clear-text` / `clear-border` / `clear-subtle` | `#2F4440` / `#4E6A64` / `#EAF0EE` | `#C4D6D1` / `#86A69F` / `#1E2826` |
| `mark-danger` / `mark-caution` | `#F9DCD8` / `#FBE7B5` | `#5A231D` / `#4A3812` |

**Measured contrast.** These figures come from the WCAG 2.x relative-luminance formula, computed by `/tmp/claude-0/-home-user-buildwithai/a48eb073-c6b3-5f76-a2f9-5996019a01e2/scratchpad/contrast.mjs`. All 49 required pairs pass (51 rows including the two exempt disabled rows; the table below is condensed). The thresholds are 4.5:1 for text and 3:1 for UI boundaries and icons.

| Pair | Light | Dark |
|---|---|---|
| text / bg | 16.38 | 15.23 |
| text / surface | 17.36 | 13.72 |
| text-muted / bg | 6.63 | 8.30 |
| text-muted / surface | 7.03 | 7.48 |
| text-muted / surface-sunken | 6.13 | 7.92 |
| on-accent / accent | 7.49 | 8.33 |
| on-accent / accent-hover | 10.09 | 10.31 |
| accent link / surface | 7.49 | 8.01 |
| accent link / bg (light) | 7.06 | — |
| accent text / accent-subtle | 6.40 | 6.93 |
| text / accent-subtle (dark, chip hover) | — | 11.87 |
| danger-text / danger-subtle | 6.80 | 9.19 |
| caution-text / caution-subtle | 7.65 | 9.80 |
| clear-text / clear-subtle | 9.00 | 10.01 |
| text / mark-danger | 13.44 | 10.35 |
| text / mark-caution | 14.22 | 9.39 |
| *UI (3:1):* border-strong / surface | 4.68 | 4.39 |
| border-strong / bg (light) | 4.42 | — |
| focus / bg | 7.06 | 8.89 |
| danger-border / danger-subtle | 4.75 | 5.67 |
| danger-border / surface (light) | 5.45 | — |
| caution-border / caution-subtle | 4.28 | 5.99 |
| caution-border / surface (light) | 4.76 | — |
| clear-border / clear-subtle | 5.10 | 5.75 |
| mark underline danger / mark-danger | 4.22 | 4.51 |
| mark underline caution / mark-caution | 3.90 | 4.61 |
| selected outline (accent) / mark-danger | 5.80 | 6.05 |
| selected outline (accent) / mark-caution | 6.13 | 5.49 |
| text-disabled / surface | 2.72 (exempt) | 2.85 (exempt) |

Dark `surface-sunken` and `accent-subtle` were measured in a follow-up one-liner using the same formula. `border` (decorative) carries no meaning and is exempt from 1.4.11.

**Type scale** (rem on a 16px root; serif marked S)

| Token | Size / line-height | Use |
|---|---|---|
| `text-xs` | 13 / 18 | Metadata only |
| `text-sm` | 15 / 22 | Hints, card meta |
| `text-base` | 17 / 26 | Body, messages |
| `text-lg` | 20 / 28 | Card titles, S 600 |
| `text-xl` | 24 / 30 | Verdict label, S 600 |
| `text-2xl` | 30 / 36 | Page h1, S 600 |
| `text-3xl` | 36 / 42 | Desktop h1 only |

**Spacing** (4/8 base): `1`=4, `2`=8, `3`=12, `4`=16, `5`=24, `6`=32, `7`=48, `8`=64. The mobile gutter is 16. The gap between cards is 12. The gap between sections is 32 mobile and 48 desktop.

**Radius:** `sm` 4 (marks), `md` 8 (inputs, buttons), `lg` 12 (cards, banner), `pill` 999 (chips).

**Elevation:** `0` uses a border, not a shadow (the default). `1` = `0 1px 2px rgb(28 26 23 / .08)` is for selected cards. `2` = `0 -2px 8px rgb(28 26 23 / .10)` is for the mobile sticky action bar only. Dark mode uses borders instead of shadows.

**Focus:** `outline: 2px solid var(--focus); outline-offset: 2px`, applied through `:focus-visible`.

**Motion:** `fast` 120ms (hover, press), `base` 200ms (selection, card highlight), `slow` 320ms (results reveal, opacity plus an 8px rise). Easing is `cubic-bezier(0.2, 0, 0, 1)` (M3 "standard" from memory, **unverified**). Under `@media (prefers-reduced-motion: reduce)`: no transforms, no smooth scroll, durations drop to 0ms except opacity fades of 120ms or less, and `scrollIntoView({behavior:'auto'})`.
