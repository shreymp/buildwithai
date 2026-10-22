import { createWorker } from 'tesseract.js';
import path from 'node:path';
const t0 = Date.now();
const worker = await createWorker('eng', 1, { langPath: path.resolve('node_modules/@tesseract.js-data/eng/4.0.0'), gzip: true, cachePath: '/tmp/claude-0/-home-user-buildwithai/a48eb073-c6b3-5f76-a2f9-5996019a01e2/scratchpad' });
const { data } = await worker.recognize(process.argv[2] || 'receipt.png');
console.log(data.text); console.log('ms', Date.now() - t0); await worker.terminate();
