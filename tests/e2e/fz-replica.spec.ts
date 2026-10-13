import { expect, test } from '@playwright/test';

/**
 * Pixel-faithful replica of the Dev Flavorz Figma frames (/fz).
 *
 * Built from the design's own values rather than a component library's scale,
 * so these assert the Figma spec directly: published style colours, the text
 * styles' sizes, the 1200px content column, and each frame's column counts.
 */

test.describe('desktop (1440 frame)', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test('uses the published style colours exactly', async ({ page }) => {
    await page.goto('/fz/');
    const read = (sel: string, prop: string) =>
      page.evaluate(
        ([s, p]) => {
          const el = document.querySelector(s as string);
          return el ? getComputedStyle(el)[p as never] : null;
        },
        [sel, prop],
      );

    expect(await read('body', 'backgroundColor')).toBe('rgb(255, 255, 255)'); // Site bg
    expect(await read('.fz-btn--primary', 'backgroundColor')).toBe('rgb(67, 49, 57)'); // #433139
    expect(await read('.fz-btn--primary', 'color')).toBe('rgb(236, 234, 235)'); // #eceaeb
    expect(await read('.fz-board', 'backgroundColor')).toBe('rgb(242, 225, 222)'); // #f2e1de
    expect(await read('.fz-footer', 'backgroundColor')).toBe('rgb(202, 187, 184)'); // #cabbb8
  });

  test('uses the design type styles', async ({ page }) => {
    await page.goto('/fz/');
    await page.evaluate(() => document.fonts.ready);
    const type = await page.evaluate(() => {
      const h1 = getComputedStyle(document.querySelector('h1')!);
      const body = getComputedStyle(document.body);
      return { h1Family: h1.fontFamily, h1Size: h1.fontSize, bodyFamily: body.fontFamily };
    });
    expect(type.h1Family).toContain('DM Serif Display');
    expect(type.h1Size).toBe('28px'); // H1 style
    expect(type.bodyFamily).toContain('DM Sans');
  });

  test('loads both typefaces, not fallbacks', async ({ page }) => {
    await page.goto('/fz/');
    await page.evaluate(() => document.fonts.ready);
    const loaded = await page.evaluate(() =>
      [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
    );
    expect(loaded).toContain('DM Sans');
    expect(loaded).toContain('DM Serif Display');
  });

  test('keeps the 1200px content column', async ({ page }) => {
    await page.goto('/fz/');
    const w = await page.evaluate(
      () => document.querySelector('.fz-shell')?.getBoundingClientRect().width,
    );
    expect(Math.round(w ?? 0)).toBe(1200);
  });

  test('matches the frame column counts', async ({ page }) => {
    await page.goto('/fz/');
    const cols = (sel: string) =>
      page.evaluate((s) => {
        const el = document.querySelector(s);
        return el ? getComputedStyle(el).gridTemplateColumns.split(' ').length : null;
      }, sel);

    expect(await cols('.fz-reels')).toBe(4);
    expect(await cols('.fz-pantry')).toBe(8);
    expect(await cols('.fz-fresh')).toBe(4);
    expect(await cols('.fz-videos')).toBe(3);
    expect(await cols('.fz-boards')).toBe(3);
    expect(await cols('.fz-makers')).toBe(4);
  });

  test('renders every section from the design', async ({ page }) => {
    await page.goto('/fz/');
    for (const h of [
      'Reels',
      'Shop the pantry',
      "What's fresh today",
      'Videos from the Kitchens',
      'Community leaders',
      'Meet the makers',
    ]) {
      await expect(page.getByRole('heading', { name: h })).toBeVisible();
    }
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');
  });
});

test.describe('mobile (402 frame)', () => {
  test.use({ viewport: { width: 402, height: 900 } });

  test('never scrolls horizontally', async ({ page }) => {
    await page.goto('/fz/');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    ).toBe(false);
  });

  test('switches to the Mobile/* type styles', async ({ page }) => {
    await page.goto('/fz/');
    const size = await page.evaluate(
      () => getComputedStyle(document.querySelector('h1')!).fontSize,
    );
    expect(size).toBe('18px'); // Mobile/Logo font H1
  });

  test('matches the mobile frame column counts', async ({ page }) => {
    await page.goto('/fz/');
    const cols = (sel: string) =>
      page.evaluate((s) => {
        const el = document.querySelector(s);
        return el ? getComputedStyle(el).gridTemplateColumns.split(' ').length : null;
      }, sel);

    expect(await cols('.fz-reels')).toBe(2);
    expect(await cols('.fz-fresh')).toBe(2);
    expect(await cols('.fz-videos')).toBe(2);
    expect(await cols('.fz-pantry')).toBe(4);
    expect(await cols('.fz-makers')).toBe(4);
  });

  test('leaderboards become a carousel', async ({ page }) => {
    await page.goto('/fz/');
    const display = await page.evaluate(
      () => getComputedStyle(document.querySelector('.fz-boards')!).display,
    );
    expect(display).toBe('flex');
  });
});

test('renders without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/fz/');
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});
