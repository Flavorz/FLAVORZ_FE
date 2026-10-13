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
    const btn =
      document.querySelector('button.astryx-button[data-variant="primary"]') ??
      document.querySelector('button');
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
  await expect(page.locator('h1')).toContainText('Welcome back');
  const s = await themeState(page);
  expect(s.htmlTheme).toBe('flavorz');
  expect(s.tenantGlobal).toBe('flavorz');
  // The brand plum from Figma (#433139), not a placeholder.
  expect(s.btnBg).toBe('rgb(67, 49, 57)');
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
  expect(dark.btnBg).toBe('rgb(217, 198, 204)');
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

test('the composed page renders every block', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Reels' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Meet the makers' })).toBeVisible();
});

test('each brand loads its own typeface, not a fallback', async ({ page }) => {
  // Astryx sets the stack but never loads a file, so a missing source would
  // silently render the fallback. Assert the real font arrived.
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const flavorz = await page.evaluate(() => ({
    family: getComputedStyle(document.querySelector('h1')!).fontFamily,
    loaded: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
  }));
  expect(flavorz.family).toContain('DM Serif Display');
  expect(flavorz.loaded).toContain('DM Serif Display');

  await page.goto('/preview/verdant/');
  await page.evaluate(() => document.fonts.ready);
  const verdant = await page.evaluate(() => ({
    family: getComputedStyle(document.querySelector('h1')!).fontFamily,
    loaded: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
  }));
  expect(verdant.family).toContain('DM Sans');
  expect(verdant.loaded).toContain('DM Sans');
});

test('brands differ in type scale, not just colour', async ({ page }) => {
  await page.goto('/');
  const a = await page.evaluate(() => getComputedStyle(document.querySelector('h1')!).fontSize);
  await page.goto('/preview/verdant/');
  const b = await page.evaluate(() => getComputedStyle(document.querySelector('h1')!).fontSize);
  expect(a).not.toBe(b);
});

test('the design system gallery renders every block in-brand', async ({ page }) => {
  await page.goto('/design/flavorz/');
  await expect(page.getByRole('heading', { name: 'Design system' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Colour tokens' })).toBeVisible();

  for (const block of ['SiteHeader', 'HeroBlock', 'FeatureGrid', 'SiteFooter']) {
    await expect(page.getByRole('heading', { name: block })).toBeVisible();
  }

  // A block preview must have real height. Wrapping these in a bare <div>
  // collapsed the SiteHeader preview to 2px; Card gives it layout context.
  const headerPreview = page.getByRole('img', { name: 'Flavorz' });
  await expect(headerPreview).toBeVisible();
  const box = await headerPreview.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThan(10);
});

test('the gallery re-skins for another brand', async ({ page }) => {
  await page.goto('/design/verdant/');
  const accent = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim(),
  );
  await page.goto('/design/flavorz/');
  const other = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim(),
  );
  expect(accent).not.toBe(other);
});
