// Bridge between the UI and the engine worker: one request at a time, 2-second timeout,
// and an in-page fallback if the browser can't start the worker at all.
import { analyze } from '../engine/judge';
import type { AnalyzeOptions, Report } from '../engine/types';

export const CHECK_TIMEOUT_MS = 2000;

let worker: Worker | null = null;
let workerBroken = false;
let nextId = 1;

function getWorker(): Worker | null {
  if (workerBroken || typeof Worker === 'undefined') return null;
  if (!worker) {
    try {
      worker = new Worker(new URL('../engine/engine.worker.ts', import.meta.url), { type: 'module' });
    } catch {
      workerBroken = true;
      return null;
    }
  }
  return worker;
}

function resetWorker() {
  worker?.terminate();
  worker = null;
}

export function runCheck(text: string, options: AnalyzeOptions = {}): Promise<Report> {
  const w = getWorker();
  if (!w) return Promise.resolve().then(() => analyze(text, options));

  const id = nextId++;
  return new Promise<Report>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      resetWorker(); // a stuck worker is replaced on the next check
      reject(new Error('timeout'));
    }, CHECK_TIMEOUT_MS);

    const onMessage = (event: MessageEvent<{ id: number; report?: Report; error?: string }>) => {
      if (event.data.id !== id) return;
      cleanup();
      if (event.data.report) resolve(event.data.report);
      else reject(new Error(event.data.error ?? 'engine error'));
    };
    const onError = (event: ErrorEvent | Event) => {
      // The worker script failed to load or crashed: fall back to running in the page.
      event.preventDefault?.();
      cleanup();
      workerBroken = true;
      resetWorker();
      try {
        resolve(analyze(text, options));
      } catch (error) {
        reject(error);
      }
    };
    function cleanup() {
      window.clearTimeout(timer);
      w!.removeEventListener('message', onMessage as EventListener);
      w!.removeEventListener('error', onError);
    }
    w.addEventListener('message', onMessage as EventListener);
    w.addEventListener('error', onError);
    w.postMessage({ id, text, options });
  });
}
