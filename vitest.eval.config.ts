import { defineConfig } from 'vitest/config';

// `npm run eval` — scores the frozen rulebook on the held-out corpus and writes src/data/accuracy.json.
export default defineConfig({
  test: { include: ['eval/run-eval.test.ts'], environment: 'node' },
});
