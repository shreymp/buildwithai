# Silent backup demo video

`tipoff-demo-silent.webm`: 1280 × 800, about 1:35, no audio, about 9.8 MB.

This is a fallback in case a live narrated take fails. It isn't the main demo video. The narrated video in `submission/demo-script.md` is still yours to record.

## How it was made

- `scripts/record-demo.mjs` drives the production build (`npm run build`, then `vite preview`) in Playwright's Chromium and records the browser window. It follows the same scenes as `submission/demo-script.md`:
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

## Runs (2026-10-22, app built from a73a2e0; the recorder script was the only uncommitted file)

The script was run three times against the same build. Every assertion passed each time, including the failure case.
- **Take 1** was checked frame by frame. A caption changed after its scroll instead of before. Fixed.
- **Take 2:** the accuracy numbers were cut off at the top of the frame. Fixed.
- **Take 3** is the file here.

`run-log.txt` is take 3's log of what was on screen at each scene.

To re-record:

```bash
npm run build
npx vite preview --port 4199 --strictPort --host 127.0.0.1 &
node scripts/record-demo.mjs http://127.0.0.1:4199/ submission/backup-video
```

## Uploading

Devpost's video field usually takes a YouTube, Vimeo or Youku link; check the form. YouTube and Vimeo accept `.webm`. Uploading and publishing are steps for you (the owner); the agent hasn't uploaded anything.
