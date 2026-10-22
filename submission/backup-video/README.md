# Silent backup demo video

`tipoff-demo-silent.webm`: 1280 × 800, about 1:40, no audio, about 9.0 MB.

This is a fallback in case a live narrated take fails. It isn't the main demo video. The narrated video in `submission/demo-script.md` is still yours to record.

## How it was made

- `scripts/record-demo.mjs` drives the production build (`npm run build`, then `vite preview`) in Playwright's Chromium and records the browser window. It opens with a 9-second title card (the problem, who it's for, and that it runs in the browser), then follows the same scenes as `submission/demo-script.md`:
  - the demo conversation message by message
  - the prediction coming true
  - "Likely scam" with an honest reason
  - the action plan
  - a highlight opening its card
  - the failure case (the $95 "membership" message, which Tipoff misses)
  - the published accuracy
- **The black caption bar is added by the recording script, not part of Tipoff.** It's there so the video reads without narration.
- Nothing is mocked. The script types the failure-case text into the real input and clicks the real buttons.
- At every scene the script also asserts what should be on screen: the verdict, the step, the next-move text, the selected card and the accuracy numbers. If any assertion fails, the recording stops with an error.

## Runs

**Round 2 (2026-10-22, app built from a73a2e0).** Three takes, every assertion passing each time:
- **Take 1** was checked frame by frame. A caption changed after its scroll instead of before. Fixed.
- **Take 2:** the accuracy numbers were cut off at the top of the frame. Fixed.
- **Take 3** became the round 2 backup video.

**Round 3 (2026-10-22).** A critic said the round 2 video had small text, no opening context and slow scrolling. The recorder now adds the title card, sets the page text to 112.5% and scrolls instantly. Every assertion passed in all three takes:
- **Take 4** was checked frame by frame and looked right, but was built before the last round 3 copy changes.
- **Take 5** was built before a one-line fix to the "Worth a closer look" reason text.
- **Take 6** is the file here, built from the round 3 code as committed. Five frames were checked by eye.

`run-log.txt` is take 6's log of what was on screen at each scene.

To re-record:

```bash
npm run build
npx vite preview --port 4199 --strictPort --host 127.0.0.1 &
node scripts/record-demo.mjs http://127.0.0.1:4199/ submission/backup-video
```

## Uploading

Devpost's video field usually takes a YouTube, Vimeo or Youku link; check the form. YouTube and Vimeo accept `.webm`. Uploading and publishing are steps for you (the owner); the agent hasn't uploaded anything.
