import { analyze } from './engine.mjs';
import fs from 'node:fs';
const c = JSON.parse(fs.readFileSync(new URL('./corpus.json', import.meta.url)));
let tp=0,fp=0,tn=0,fn=0,pbok=0,pbn=0; const bad=[];
for (const x of c) { const r = analyze(x.messages); const flagged = r.level !== 'low';
  if (x.label==='scam') { flagged?tp++:fn++; if(flagged){pbn++; if(r.playbook===x.playbook)pbok++;} if(!flagged) bad.push(['FN',x.id,x.playbook,r.score,r.signals.join(',')]); }
  else { flagged?fp++:tn++; if(flagged) bad.push(['FP',x.id,r.score,r.level,r.signals.join(',')]); } }
console.log({tp,fn,fp,tn, recall:(tp/(tp+fn)).toFixed(2), precision:(tp/(tp+fp)).toFixed(2), playbookAcc:`${pbok}/${pbn}`});
bad.forEach(b=>console.log(b.join(' | ')));
