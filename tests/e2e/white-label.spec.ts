import { expect, test } from '@playwright/test';

/**
 * End-to-end proof of the white-label mechanism.
 *
 * These assert the thing that actually matters commercially: one build, many
 * brands, each visually distinct and correctly themed. They caught two real
 * bugs during development (a parked stylesheet on preview routes, and islands
 * reverting to the base theme), so keep them.
 */

async function themeState(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const btn = document.querySelector('button');
    return {
      htmlTheme: document.documentElement.getAttribute('data-astryx-theme'),
      accent: cs.getPropertyValue('--color-accent').trim(),
      bodyBg: cs.getPropertyValue('--color-background-body').trim(),
      btnBg: btn ? getComputedStyle(btn).backgroundColor : null,
      tenantGlobal: (window as unknown as { __FLAVORZ_TENANT__?: { id: string } })
        .__FLAVORZ_TENANT__?.id,
    };
  });
}

test('default host resolves to the default tenant and paints its brand', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Food that tastes like somewhere');
  const s = await themeState(page);
  expect(s.htmlTheme).toBe('flavorz');
  expect(s.tenantGlobal).toBe('flavorz');
  // Terracotta, not the Astryx default blue.
  expect(s.btnBg).toBe('rgb(181, 38, 19)');
});

test('a preview route pins its tenant regardless of hostname', async ({ page }) => {
  await page.goto('/preview/verdant/');
  await expect(page.locator('h1')).toHaveText('Plant-forward, every plate');
  const s = await themeState(page);
  expect(s.htmlTheme).toBe('verdant');
  expect(s.tenantGlobal).toBe('verdant');
  expect(s.btnBg).toBe('rgb(0, 110, 56)');
});

test('two brands render visibly different palettes from one build', async ({ page }) => {
  await page.goto('/');
  const a = await themeState(page);
  await page.goto('/preview/verdant/');
  const b = await themeState(page);

  expect(a.accent).not.toBe(b.accent);
  expect(a.bodyBg).not.toBe(b.bodyBg);
  expect(a.btnBg).not.toBe(b.btnBg);
});

test('dark mode resolves the dark half of each token pair', async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto('/');
  const dark = await themeState(page);
  // Flavorz dark accent, not the light one.
  expect(dark.btnBg).toBe('rgb(255, 180, 160)');
  await ctx.close();
});

test('pages render without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});

test('the active tenant stylesheet is the only one applied', async ({ page }) => {
  await page.goto('/preview/verdant/');
  const media = await page.evaluate(() =>
    [...document.querySelectorAll('link[data-tenant-theme]')].map((l) => ({
      id: l.getAttribute('data-tenant-theme'),
      media: (l as HTMLLinkElement).media,
    })),
  );
  const active = media.find((m) => m.id === 'verdant');
  const inactive = media.filter((m) => m.id !== 'verdant');
  expect(active?.media).toBe('all');
  for (const other of inactive) expect(other.media).toBe('print');
});
