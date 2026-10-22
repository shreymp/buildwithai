import { defineConfig } from 'vitest/config';

// `npm run eval` — scores the rulebook on the held-out corpus and prints the result.
// With EVAL_VERSION set, it also writes src/data/accuracy-rerun.json (see eval/run-eval.test.ts).
// The default reporter is pinned so the scores print even where Vitest would pick a quieter one.
export default defineConfig({
  test: { include: ['eval/run-eval.test.ts'], environment: 'node', reporters: ['default'] },
});
