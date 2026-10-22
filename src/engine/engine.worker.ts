/// <reference lib="webworker" />
// Runs the engine off the main thread so a long paste never freezes the page.
import { analyze } from './judge';
import type { AnalyzeOptions } from './types';

self.onmessage = (event: MessageEvent<{ id: number; text: string; options: AnalyzeOptions }>) => {
  const { id, text, options } = event.data;
  try {
    self.postMessage({ id, report: analyze(text, options) });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
