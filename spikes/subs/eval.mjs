import { toTransactions, detect, normalize } from './detect.mjs';
import fs from 'node:fs';
const truth = JSON.parse(fs.readFileSync('data/truth.json'));
let tp=0, fn=0, fp=0, kindOk=0, cadOk=0, incT=0, incF=0;
for (const [file, items] of Object.entries(truth)) {
  const tx = toTransactions(fs.readFileSync('data/' + file, 'utf8'));
  const res = detect(tx);
  const used = new Set();
  for (const t of items) {
    const keys = new Set(t.descriptor_examples.map(normalize));
    const m = res.find(r => keys.has(r.key) && !used.has(r));
    if (m) { used.add(m); tp++; if (m.cadence===t.cadence) cadOk++; if ((t.kind==='subscription')===(m.kind==='subscription')) kindOk++; if (t.price_increase) (m.increases.length?incT++:incF++); }
    else { fn++; console.log('MISS', file, t.merchant, t.kind, t.cadence, t.occurrences, [...keys].join('|')); }
  }
  for (const r of res) if (!used.has(r)) { fp++; console.log('EXTRA', file, r.key, r.cadence, r.count, r.amount, r.descs[0]); }
  console.log(file, 'rows', tx.length);
}
console.log({tp, fn, fp, recall:(tp/(tp+fn)).toFixed(2), precision:(tp/(tp+fp)).toFixed(2), cadenceAcc:`${cadOk}/${tp}`, kindAcc:`${kindOk}/${tp}`, priceIncreaseFound:`${incT}/${incT+incF}`});
