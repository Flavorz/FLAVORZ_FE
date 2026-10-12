import { expect, test } from '@playwright/test';

/**
 * The interactive app surface: shell, sortable/selectable table, validated
 * form. These assert BEHAVIOUR, not just rendering — the table looked fine
 * while sorting silently did nothing, because columns must opt in with
 * `sortable` and the plugin alone is not enough.
 */

test.describe('app shell', () => {
  test('renders nav and content, and collapses', async ({ page }) => {
    await page.goto('/app/flavorz/');
    await expect(page.getByRole('heading', { name: 'Bookings', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bookings' })).toBeVisible();

    await page.getByRole('button', { name: /Collapse navigation/i }).click();
    await expect(page.getByRole('button', { name: 'Bookings' })).toHaveCount(0);
  });

  test('switches sections', async ({ page }) => {
    await page.goto('/app/flavorz/');
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Venue details' })).toBeVisible();
  });
});

test.describe('data table', () => {
  const guests = (page: import('@playwright/test').Page) =>
    page.locator('tbody tr td:nth-child(2)').allTextContents();

  test('sorts when a column header is clicked', async ({ page }) => {
    await page.goto('/app/flavorz/');
    const before = await guests(page);

    await page.getByRole('columnheader', { name: /Guest/ }).click();
    await expect
      .poll(async () => (await guests(page)).join(','))
      .not.toBe(before.join(','));

    const after = (await guests(page)).map((s) => s.trim());
    expect(after).toEqual([...after].sort((a, b) => a.localeCompare(b)));
  });

  test('selecting rows reveals the selection toolbar', async ({ page }) => {
    await page.goto('/app/flavorz/');
    const boxes = page.locator('tbody input[type=checkbox]');
    await boxes.nth(0).click();
    await boxes.nth(1).click();
    await expect(page.getByText(/2 selected/i)).toBeVisible();
  });

  test('select-all checks every row', async ({ page }) => {
    await page.goto('/app/flavorz/');
    await page.locator('thead input[type=checkbox]').first().click();
    const boxes = page.locator('tbody input[type=checkbox]');
    const n = await boxes.count();
    for (let i = 0; i < n; i += 1) await expect(boxes.nth(i)).toBeChecked();
  });
});

test.describe('form validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/flavorz/');
    await page.getByRole('button', { name: 'Settings' }).click();
  });

  test('blocks an empty required field', async ({ page }) => {
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText(/is required/i).first()).toBeVisible();
  });

  test('rejects a malformed email', async ({ page }) => {
    await page.getByLabel('Restaurant name').fill('Flavorz');
    await page.getByLabel('Contact email').fill('nope');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('submits when valid', async ({ page }) => {
    await page.getByLabel('Restaurant name').fill('Flavorz');
    await page.getByLabel('Contact email').fill('hello@flavorz.com');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Saved.')).toBeVisible();
  });
});

test('the app surface is themed per brand', async ({ page }) => {
  await page.goto('/app/flavorz/');
  const a = await page.evaluate(
    () => getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim(),
  );
  await page.goto('/app/verdant/');
  const b = await page.evaluate(
    () => getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim(),
  );
  expect(a).not.toBe(b);
});

test('the app surface renders without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/app/flavorz/');
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});
