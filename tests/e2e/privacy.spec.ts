import { expect, test } from '@playwright/test';

// Proves "nothing leaves your device": after the page loads, checking messages makes no
// network requests at all, and the production page ships a CSP that forbids connections.
test('no network requests while checking messages', async ({ page, baseURL }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Warm up: the first check may lazily load the worker script from our own origin.
  await page.click('[data-sample="legit-linkedin"]');
  await expect(page.getByTestId('verdict')).toBeVisible();

  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  for (const id of ['fake-check-thread', 'task-scam', 'training-fee', 'identity-form', 'legit-recruiter']) {
    await page.click(`[data-sample="${id}"]`);
    await expect(page.getByTestId('verdict')).toBeVisible();
  }
  await page.getByLabel('Message or conversation').fill('Text me on WhatsApp, my email is hr.desk@gmail.com, see bit.ly/abc123 for the onboarding form.');
  await page.getByTestId('check').click();
  await expect(page.getByTestId('inspector')).toBeVisible();
  // Letters such as Ł live in a separate font subset (latin-ext) that browsers fetch lazily.
  await page.getByLabel('Message or conversation').fill('Hola José and Łukasz, the café coordinator role pays $45/hr with no experience needed. Message me on Telegram for the interview, señor.');
  await page.getByTestId('check').click();
  await expect(page.getByTestId('verdict')).toBeVisible();

  expect(requests, `unexpected requests: ${requests.join(', ')}`).toEqual([]);
  expect(baseURL).toBeTruthy();
});

test('every request the page ever makes stays on its own origin', async ({ page, baseURL }) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(baseURL!) && !r.url().startsWith('data:')) external.push(r.url());
  });
  await page.goto('/');
  await page.click('[data-sample="fake-check-thread"]');
  await page.goto('/#/how-it-works');
  await page.waitForLoadState('networkidle');
  expect(external).toEqual([]);
});

test('production page forbids network connections via CSP', async ({ page }) => {
  await page.goto('/');
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).toContain("connect-src 'none'");
});
