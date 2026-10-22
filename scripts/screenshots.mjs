// Captures every screen and state at desktop and mobile widths into docs/screenshots/<label>/.
// Usage: node scripts/screenshots.mjs <label> [baseURL]
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const label = process.argv[2] ?? 'latest';
const base = process.argv[3] ?? 'http://127.0.0.1:4173/';
const out = `docs/screenshots/${label}`;
fs.mkdirSync(out, { recursive: true });

const sizes = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const browser = await chromium.launch();
for (const [name, viewport] of Object.entries(sizes)) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: name === 'mobile' ? 2 : 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const shot = async (id, full = true) => page.screenshot({ path: `${out}/${name}-${id}.png`, fullPage: full });

  await page.goto(base);
  await page.waitForLoadState('networkidle');
  await shot('01-empty', false);

  await page.click('[data-sample="fake-check-thread"]');
  await page.waitForSelector('[data-testid="verdict"]');
  await shot('02-demo-step1');
  for (let i = 0; i < 3; i++) await page.click('[data-testid="next-message"]');
  await page.waitForTimeout(150);
  await shot('03-demo-step4');
  await page.click('[data-testid="next-message"]');
  await page.click('[data-testid="next-message"]');
  await page.waitForTimeout(150);
  await shot('04-demo-full');
  await page.locator('.mark').first().click();
  await page.waitForTimeout(150);
  await shot('05-mark-selected', false);

  for (const s of ['task-scam', 'training-fee', 'identity-form', 'legit-recruiter', 'legit-linkedin', 'legit-background-check']) {
    await page.click(`[data-sample="${s}"]`);
    await page.waitForSelector('[data-testid="verdict"]');
    await page.waitForTimeout(100);
    await shot(`06-sample-${s}`);
  }

  await page.fill('[data-testid="input"]', '');
  await page.click('[data-testid="check"]');
  await shot('07-empty-error', false);
  await page.fill('[data-testid="input"]', 'Hi, job for you');
  await page.click('[data-testid="check"]');
  await page.waitForSelector('[data-testid="notice"]');
  await shot('08-too-short', false);
  await page.fill('[data-testid="input"]', 'Hola, tenemos un trabajo desde casa para usted con un pago muy alto por día. Escríbanos por WhatsApp para más información.');
  await page.click('[data-testid="check"]');
  await page.waitForSelector('[data-testid="notice"]');
  await shot('09-not-english', false);
  await page.fill('[data-testid="input"]', 'Hi, please send me your Social Security number so I can get you set up for the role today.');
  await page.click('[data-testid="check"]');
  await page.waitForSelector('[data-testid="next-move"]');
  await shot('11-single-request');

  await page.goto(base + '#/how-it-works');
  await page.waitForTimeout(200);
  await shot('10-how-it-works');
  await ctx.close();
}
await browser.close();
console.log('saved to', out);
