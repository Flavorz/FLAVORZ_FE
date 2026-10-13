import { expect, test } from '@playwright/test';

/**
 * The real Flavorz home page, built from the Dev Flavorz design.
 * These assert the design's content and tokens actually reach the browser.
 */

test('renders every section from the design', async ({ page }) => {
  await page.goto('/');
  for (const heading of [
    'Reels',
    'Shop the pantry',
    "What's fresh today",
    'Videos from the Kitchens',
    'Community leaders',
    'Meet the makers',
  ]) {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
});

test('uses the brand tokens from Figma, not placeholders', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  const t = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return {
      accent: cs.getPropertyValue('--color-accent').trim(),
      body: cs.getPropertyValue('--font-family-body').trim(),
      heading: cs.getPropertyValue('--font-family-heading').trim(),
      bg: cs.getPropertyValue('--color-background-body').trim(),
    };
  });

  expect(t.accent).toContain('#433139'); // Primary button
  expect(t.body).toContain('DM Sans');
  expect(t.heading).toContain('DM Serif Display');
  expect(t.bg).toContain('#ffffff');
});

test('loads both brand typefaces', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() =>
    [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
  );
  expect(loaded).toContain('DM Sans');
  expect(loaded).toContain('DM Serif Display');
});

test('formats prices with Indian digit grouping', async ({ page }) => {
  await page.goto('/');
  // ₹1,580 not ₹1580; the welcome panel shows a grouped figure.
  await expect(page.getByText(/₹\d,\d{3}/).first()).toBeVisible();
  await expect(page.getByText('₹899')).toBeVisible();
});

test('shows maker attribution on products', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Lakshmi Amma').first()).toBeVisible();
  await expect(page.getByText('12 bought in the last hour')).toBeVisible();
});

test('the progress bar uses a brand colour, not Astryx blue', async ({ page }) => {
  await page.goto('/');
  const bg = await page.evaluate(() => {
    const fill = document.querySelector('.astryx-progress-bar-fill');
    return fill ? getComputedStyle(fill).backgroundColor : null;
  });
  // The accent variant compiles Astryx's status blue into StyleX, which no
  // token or CSS override can reach — neutral keeps the brand ramp.
  expect(bg).not.toBe('rgb(0, 116, 226)');
});

test('offers the Kannada language toggle', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('radio', { name: 'ಕನ್ನಡ' })).toBeVisible();
});

test('renders without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});
