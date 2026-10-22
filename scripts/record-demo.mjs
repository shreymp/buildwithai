// Records the silent backup demo video and checks every on-screen claim of submission/demo-script.md.
// Usage: npm run build && npx vite preview --port 4199 --strictPort --host 127.0.0.1
//        node scripts/record-demo.mjs [baseURL] [outDir]
// The caption bar is drawn by this script (not part of Tipoff) so the video reads without narration.
import fs from 'node:fs';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';

const base = process.argv[2] ?? 'http://127.0.0.1:4199/';
const outDir = path.resolve(process.argv[3] ?? 'submission/backup-video');
const MISS = 'Hi Chris, great news: the hiring team approved you for the remote Claims Assistant role. Before your start date, every new associate joins our staffing network. The annual membership is $95, charged to a debit card, and it covers your placement for the year. Reply to this email when it is done.';
const size = { width: 1280, height: 800 };

fs.mkdirSync(outDir, { recursive: true });
const tmpVideo = fs.mkdtempSync(path.join(outDir, '.rec-'));
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: size, recordVideo: { dir: tmpVideo, size }, colorScheme: 'light', reducedMotion: 'no-preference' });
const page = await context.newPage();
const log = [];
const t0 = Date.now();
const stamp = () => { const s = Math.round((Date.now() - t0) / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const note = (msg) => { log.push(`${stamp()}  ${msg}`); };
const wait = (ms) => page.waitForTimeout(ms);

async function caption(text) {
  await page.evaluate((t) => {
    let el = document.getElementById('rec-caption');
    if (!el) {
      el = document.createElement('div');
      el.id = 'rec-caption';
      el.setAttribute('aria-hidden', 'true');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);max-width:80%;z-index:99999;pointer-events:none;'
        + 'background:rgba(0,0,0,.82);color:#fff;font:500 20px/1.4 system-ui,sans-serif;padding:10px 18px;border-radius:6px;text-align:center';
      document.body.appendChild(el);
    }
    el.textContent = t;
    el.style.display = t ? 'block' : 'none';
  }, text);
}
async function show(locator, block = 'center') {
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate((el, b) => el.scrollIntoView({ block: b, behavior: 'smooth' }), block);
  await wait(700);
}
const nextMessage = async () => { await page.getByTestId('next-message').click(); await wait(600); };
const verdict = () => page.getByTestId('verdict');
const nextMove = () => page.getByTestId('next-move');
const step = () => page.locator('.step[aria-current="step"]');

await page.goto(base);
await page.evaluate(() => document.fonts.ready);

// 0:00 the hook
await caption('Job scams follow a script. Tipoff shows you where you are in it, and what comes next.');
note('empty check page');
await wait(6000);

// 0:15 message 1
await page.click('[data-sample="fake-check-thread"]');
await expect(verdict()).toContainText('Worth a closer look');
await expect(step()).toHaveAttribute('data-step', '2');
const firstSigns = await page.locator('[data-testid="finding-cards"] > li h3').allInnerTexts();
note(`message 1: "Worth a closer look", step 2; signs: ${firstSigns.join(' | ')}`);
await caption('Message 1 of a fictional conversation, checked on this device. “Worth a closer look”: steps 1–2 of the script.');
await show(page.getByTestId('timeline'));
await wait(6000);

// 0:30 the prediction, then messages 2–3
await expect(nextMove()).toContainText('chat-only interview');
await caption('The prediction: next comes a “hire” after a chat-only interview.');
await show(nextMove());
note(`next move: ${(await nextMove().innerText()).split('\n')[0]}`);
await wait(5000);
await nextMessage();
await nextMessage();
await expect(page.locator('main')).toContainText('interview you on Telegram');
await caption('Message 3: an interview on Telegram, as predicted.');
note('message 3: Telegram interview shown');
await wait(5000);

// 0:50 message 4: "hired" → Likely scam
await nextMessage();
await expect(verdict()).toContainText('Likely scam');
await expect(verdict()).toContainText('haven’t asked for money');
await caption('Message 4: “you’ve been hired”. Now “Likely scam”, and it says they haven’t asked for money yet.');
await show(verdict());
note(`message 4: Likely scam; reason: ${(await verdict().innerText()).replace(/\s+/g, ' ').slice(0, 160)}`);
await wait(6000);
await expect(nextMove()).toContainText('check to buy equipment');
await caption('Next, it predicts, they’ll ask for something: most often a check to buy equipment.');
await show(nextMove());
await wait(5000);

// 1:10 messages 5–6: the check and the ask
await nextMessage();
await expect(page.getByTestId('timeline')).toContainText('A check for “equipment”');
await caption('Message 5: the check arrives.');
note('message 5: check for equipment, step 4');
await wait(4000);
await nextMessage();
await expect(step()).toHaveAttribute('data-step', '5');
await expect(nextMove()).toContainText('Stop here');
await caption('Message 6: “send $2,400 to the vendor through Zelle”. Step 5: stop here.');
await show(nextMove());
note('message 6: step 5, Stop here');
await wait(5000);
await expect(page.getByTestId('action-plan')).toContainText('Don’t deposit the check');
await caption('What to do now: don’t deposit the check, and where to report it.');
await show(page.getByTestId('action-plan'));
await wait(6000);

// 1:35 evidence
const anyMark = page.locator('.mark.mark--high').first();
await caption('Every verdict shows its evidence. Each highlight opens a plain-English reason.');
await show(anyMark);
await wait(2500);
await anyMark.click();
const selected = page.locator('[data-testid="finding-cards"] > li.is-selected');
await expect(selected).toHaveCount(1);
note(`highlight "${(await anyMark.innerText()).slice(0, 60)}" opened card "${(await selected.locator('h3').innerText())}"`);
await wait(6000);

// 1:55 the failure case
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
await wait(800);
await page.getByRole('button', { name: 'Clear' }).click();
await caption('A miss: this “membership fee” message is a scam, and Tipoff doesn’t catch it.');
await page.getByLabel('Message or conversation').fill(MISS);
await wait(2500);
await page.getByRole('button', { name: 'Check message' }).click();
await expect(verdict()).toContainText('No known scam pattern found');
await expect(verdict()).toContainText('isn’t proof it’s safe');
await caption('It says no pattern matched, and that this isn’t proof it’s safe. It never calls a message safe.');
await show(verdict());
note(`failure case: ${(await verdict().innerText()).replace(/\s+/g, ' ').slice(0, 160)}`);
await wait(7000);

// 2:15 published accuracy
await page.getByRole('link', { name: 'How it works' }).first().click();
await page.getByRole('link', { name: 'How accurate it is' }).click();
const acc = page.getByTestId('accuracy');
await expect(acc).toContainText('34');
await caption('Accuracy is published, misses included: blind test, 34 of 40 scams flagged, 2 of 40 genuine messages flagged by mistake.');
await show(acc, 'start');
note(`accuracy section: ${(await acc.innerText()).replace(/\s+/g, ' ').slice(0, 220)}`);
await wait(8000);

// 2:35 close
await page.getByRole('link', { name: /Tipoff/ }).first().click();
await caption('Tipoff: see a job scam’s next move before it happens. Open source; runs entirely in your browser.');
await wait(6000);
note('end');

const video = page.video();
await context.close();
await browser.close();
const out = path.join(outDir, 'tipoff-demo-silent.webm');
fs.renameSync(await video.path(), out);
fs.rmSync(tmpVideo, { recursive: true, force: true });
fs.writeFileSync(path.join(outDir, 'run-log.txt'), `${log.join('\n')}\n`);
console.log(log.join('\n'));
console.log(`Saved ${out}`);
