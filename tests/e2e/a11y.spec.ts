import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function axe(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${label}: ${v.id} (${v.nodes.length}) ${v.help}`)).toEqual([]);
}

test.describe('accessibility (axe, WCAG 2.2 AA)', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test(`every screen and state, ${scheme} mode`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
      await page.goto('/');
      await axe(page, 'empty');
      for (const id of ['fake-check-thread', 'task-scam', 'training-fee', 'identity-form', 'legit-recruiter', 'legit-linkedin', 'legit-background-check']) {
        await page.click(`[data-sample="${id}"]`);
        await expect(page.getByTestId('verdict')).toBeVisible();
        await axe(page, id);
      }
      await page.click('[data-sample="fake-check-thread"]');
      await page.getByTestId('next-message').click();
      await page.locator('.mark').first().click();
      await axe(page, 'mark selected');
      await page.getByLabel('Message or conversation').fill('');
      await page.getByTestId('check').click();
      await axe(page, 'input error');
      await page.getByLabel('Message or conversation').fill('Hi, job for you');
      await page.getByTestId('check').click();
      await axe(page, 'too short');
      await page.getByLabel('Message or conversation').fill('Hi, please send me your Social Security number so I can get you set up for the role today.');
      await page.getByTestId('check').click();
      await expect(page.getByTestId('next-move')).toBeVisible();
      await axe(page, 'a single request');
      await page.goto('/#/how-it-works');
      await axe(page, 'how it works');
    });
  }
});

test('the core workflow works with the keyboard alone', async ({ page }) => {
  await page.goto('/');
  // Skip link, then into the message box.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  let guard = 0;
  while (!(await page.getByLabel('Message or conversation').evaluate((el) => el === document.activeElement)) && guard++ < 10) {
    await page.keyboard.press('Tab');
  }
  await expect(page.getByLabel('Message or conversation')).toBeFocused();
  await page.keyboard.type('Hi! You have been hired. Add me on Telegram. Please pay the $75 training fee via Zelle today.');
  await page.keyboard.press('Tab'); // Check message
  await expect(page.getByTestId('check')).toBeFocused();
  await page.keyboard.press('Enter');
  // Focus moves to the verdict heading.
  await expect(page.locator('#verdict-title')).toBeFocused();
  await expect(page.locator('#verdict-title')).toContainText('Likely scam');
  // Tab forward to the first highlight and open its card with Enter.
  guard = 0;
  while (!(await page.evaluate(() => document.activeElement?.classList.contains('mark'))) && guard++ < 40) {
    await page.keyboard.press('Tab');
  }
  const rule = await page.evaluate(() => (document.activeElement as HTMLElement).dataset.rule);
  await page.keyboard.press('Enter');
  await expect(page.locator(`#card-${rule}`)).toBeFocused();
  // Reach the copy button.
  guard = 0;
  while ((await page.evaluate(() => document.activeElement?.textContent)) !== 'Copy reply' && guard++ < 60) {
    await page.keyboard.press('Tab');
  }
  await expect(page.getByRole('button', { name: 'Copy reply' })).toBeFocused();
});

// Inline links inside sentences and highlights inside message text are exempt (WCAG 2.5.8 "inline").
test('controls are at least 24px', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-sample="fake-check-thread"]');
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, a, input, textarea, summary')]
      .filter((el) => el.offsetParent !== null && !el.classList.contains('mark') && !(el.tagName === 'A' && el.closest('p')) && !el.closest('.bubble__text') && !el.classList.contains('skip-link'))
      .map((el) => ({ el: el.outerHTML.slice(0, 80), r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.height < 24 || r.width < 24)
      .map(({ el, r }) => `${Math.round(r.width)}x${Math.round(r.height)} ${el}`),
  );
  expect(small).toEqual([]);
});
