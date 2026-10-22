import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

test.describe('core journey', () => {
  test('the demo conversation: the prediction comes true one message later', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-sample="fake-check-thread"]');
    await expect(page.getByTestId('verdict')).toContainText('Worth a closer look');
    await expect(page.locator('.step[aria-current="step"]')).toHaveAttribute('data-step', '2');
    await expect(page.getByTestId('next-move')).toContainText('chat-only interview');

    // Messages 3 and 4: the chat interview and the instant "hire" (what was predicted).
    await page.getByTestId('next-message').click();
    await page.getByTestId('next-message').click();
    await page.getByTestId('next-message').click();
    await expect(page.locator('.step[aria-current="step"]')).toHaveAttribute('data-step', '3');
    await expect(page.getByTestId('next-move')).toContainText('check to buy equipment');

    // Message 5: the check arrives (what was predicted).
    await page.getByTestId('next-message').click();
    await expect(page.getByTestId('verdict')).toContainText('Likely scam');
    await expect(page.getByTestId('timeline')).toContainText('A check for “equipment”');
    await expect(page.getByTestId('next-move')).toContainText('pay their vendor');

    // Message 6: they ask for the money.
    await page.getByTestId('next-message').click();
    await expect(page.locator('.step[aria-current="step"]')).toHaveAttribute('data-step', '5');
    await expect(page.getByTestId('next-move')).toContainText('Stop here');
    await expect(page.getByTestId('action-plan')).toContainText('Don’t deposit the check');
  });

  test('tapping a highlight selects and reveals its explanation card', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-sample="training-fee"]');
    const mark = page.locator('.mark[data-rules~="pay_for_job"]').first();
    await mark.click();
    const card = page.locator('#card-pay_for_job');
    await expect(card).toHaveClass(/is-selected/);
    await expect(card).toBeFocused();
    await expect(card).toBeInViewport();
    await card.getByRole('button', { name: 'Show in message' }).click();
    await expect(mark).toBeFocused();
  });

  test('each scam sample is flagged with explained highlights; genuine samples are not', async ({ page }) => {
    await page.goto('/');
    for (const id of ['task-scam', 'training-fee', 'identity-form']) {
      await page.click(`[data-sample="${id}"]`);
      await expect(page.getByTestId('verdict')).not.toContainText('No known scam pattern found');
      expect(await page.locator('.mark').count()).toBeGreaterThanOrEqual(3);
      expect(await page.locator('[data-testid="finding-cards"] > li').count()).toBeGreaterThanOrEqual(3);
    }
    for (const id of ['legit-recruiter', 'legit-linkedin']) {
      await page.click(`[data-sample="${id}"]`);
      await expect(page.getByTestId('verdict')).toContainText('No known scam pattern found');
      await expect(page.getByTestId('legit')).toBeVisible();
      await expect(page.getByTestId('verdict')).not.toContainText(/\bis safe\b/i);
    }
  });

  test('typing a message and pressing Ctrl+Enter checks it', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Message or conversation').fill('Congrats you are hired! Please pay the $95 onboarding kit fee with Apple gift cards today, text me on WhatsApp.');
    await page.getByLabel('Message or conversation').press('Control+Enter');
    await expect(page.getByTestId('verdict')).toContainText('Likely scam');
    await expect(page.getByTestId('timeline')).toContainText('Pay for the job'.toLowerCase());
  });

  test('marking a speaker as yourself removes their messages from scoring', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Message or conversation').fill('Alex: Hi, we came across your resume. Add me on Telegram for an interview.\nSam: I will never send my SSN or pay a training fee.\nAlex: Sure, the interview will be via chat.');
    await page.getByTestId('check').click();
    await expect(page.locator('.speakers')).toBeVisible();
    const samMarks = () => page.locator('[data-testid="message"]').nth(1).locator('.mark');
    await page.getByRole('checkbox', { name: 'Sam', exact: true }).check();
    await expect(page.locator('[data-testid="message"]').nth(1)).toContainText('You (Sam)');
    expect(await samMarks().count()).toBe(0);
  });

  test('the action plan links to official help', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-sample="identity-form"]');
    const plan = page.getByTestId('action-plan');
    await expect(plan.locator('a[href^="https://www.identitytheft.gov"]').first()).toBeVisible();
    await expect(plan.locator('a[href^="https://reportfraud.ftc.gov"]').first()).toBeVisible();
  });

  test('copying the verify-them reply', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await page.click('[data-sample="identity-form"]');
    await page.getByRole('button', { name: 'Copy reply' }).click();
    await expect(page.getByTestId('reply')).toContainText('Reply copied to your clipboard.');
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain('official HR system');
  });
});

test.describe('states', () => {
  test('empty submit shows an inline error and keeps focus in the box', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('check').click();
    await expect(page.locator('#message-error')).toContainText('Paste a message to check it.');
    await expect(page.getByLabel('Message or conversation')).toBeFocused();
  });

  test('too short and non-English inputs get helpful notices', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Message or conversation').fill('Hi, job for you');
    await page.getByTestId('check').click();
    await expect(page.getByTestId('notice')).toContainText('Not enough to go on');
    await page.getByLabel('Message or conversation').fill('Hola, tenemos un trabajo desde casa para usted con un pago muy alto por día. Escríbanos por WhatsApp para más información.');
    await page.getByTestId('check').click();
    await expect(page.getByTestId('notice')).toContainText('English');
  });

  test('a stuck engine shows a recoverable error and keeps the text', async ({ page }) => {
    // Make the worker script hang so the 2-second timeout fires.
    await page.route('**/engine.worker*', () => new Promise(() => {}));
    await page.goto('/');
    await page.getByLabel('Message or conversation').fill('Add me on Telegram for the interview, then pay the training fee by Zelle.');
    await page.getByTestId('check').click();
    await expect(page.getByTestId('error')).toContainText('Something went wrong', { timeout: 5000 });
    await expect(page.getByLabel('Message or conversation')).toHaveValue(/Telegram/);
  });

  test('if the worker cannot load, checking still works in the page', async ({ page }) => {
    await page.route('**/engine.worker*', (route) => route.abort());
    await page.goto('/');
    await page.click('[data-sample="training-fee"]');
    await expect(page.getByTestId('verdict')).toContainText('Likely scam');
  });

  test('very long input is trimmed with a notice, without freezing', async ({ page }) => {
    await page.goto('/');
    const long = 'Some ordinary words about our team and the role. '.repeat(600) + 'Pay the $60 training fee in gift cards and add me on Telegram.';
    await page.getByLabel('Message or conversation').fill(long);
    await page.getByTestId('check').click();
    await expect(page.getByTestId('results')).toContainText('most recent 20,000 characters');
    await expect(page.getByTestId('verdict')).not.toContainText('No known scam pattern found');
  });
});

test.describe('how it works', () => {
  test('lists every rule from the engine and the measured accuracy section', async ({ page }) => {
    await page.goto('/#/how-it-works');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('How Tipoff works');
    const { RULES } = await import('../../src/engine/rules');
    await expect(page.getByTestId('rule')).toHaveCount(RULES.length);
    await expect(page.getByTestId('accuracy')).toBeVisible();
    // The numbers come from `npm run eval`, not typed by hand.
    const acc = JSON.parse(readFileSync('src/data/accuracy.json', 'utf8')) as { measured: boolean; scamsCaught?: number; scamsTotal?: number; legitFlagged?: number; legitTotal?: number };
    if (acc.measured) {
      await expect(page.getByTestId('accuracy')).toContainText(`${acc.scamsCaught} of ${acc.scamsTotal}`);
      await expect(page.getByTestId('accuracy')).toContainText(`${acc.legitFlagged} of ${acc.legitTotal}`);
    }
  });

  test('table-of-contents links scroll to their section', async ({ page }) => {
    await page.goto('/#/how-it-works');
    await page.getByRole('link', { name: 'Privacy' }).click();
    await expect(page.locator('#privacy')).toBeInViewport();
  });
});
