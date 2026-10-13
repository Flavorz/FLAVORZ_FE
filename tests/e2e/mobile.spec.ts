import { expect, test } from '@playwright/test';

/**
 * Mobile layout, matching the 402px frame in the Dev Flavorz design.
 *
 * Breakpoints are CSS-only so the server-rendered HTML is already correct;
 * a JS width check would flash the desktop layout before hydrating.
 */
test.use({ viewport: { width: 402, height: 900 } });

test('never scrolls horizontally', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});

test('uses the column counts from the design', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const columnsUnder = async (heading: string) =>
    page.evaluate((h) => {
      const head = [...document.querySelectorAll('h2')].find((e) => e.textContent?.trim() === h);
      let node = head?.parentElement ?? null;
      for (let i = 0; i < 5 && node; i += 1, node = node.parentElement) {
        const grid = node.querySelector('.astryx-grid, [class*=grid]');
        if (grid && getComputedStyle(grid).display === 'grid') {
          return getComputedStyle(grid).gridTemplateColumns.split(' ').length;
        }
      }
      return null;
    }, heading);

  expect(await columnsUnder('Reels')).toBe(2);
  expect(await columnsUnder("What's fresh today")).toBe(2);
  expect(await columnsUnder('Videos from the Kitchens')).toBe(2);
  expect(await columnsUnder('Shop the pantry')).toBe(4);
  expect(await columnsUnder('Meet the makers')).toBe(4);
});

test('the activity ticker stays one scrolling row', async ({ page }) => {
  await page.goto('/');
  const ticker = await page.evaluate(() => {
    const t = document.querySelector('[data-flavorz="ticker"]');
    if (!t) return null;
    return { height: t.getBoundingClientRect().height, scrolls: t.scrollWidth > t.clientWidth };
  });
  // Wrapping turned this into a tall block; one row is ~20px.
  expect(ticker?.height).toBeLessThan(48);
  expect(ticker?.scrolls).toBe(true);
});

test('leaderboards become a horizontal carousel', async ({ page }) => {
  await page.goto('/');
  const board = await page.evaluate(() => {
    const el = document.querySelector('[data-flavorz="leaderboards"]');
    if (!el) return null;
    return { display: getComputedStyle(el).display, scrolls: el.scrollWidth > el.clientWidth };
  });
  expect(board?.display).toBe('flex');
  expect(board?.scrolls).toBe(true);
});

test('no button label is truncated', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const clipped = await page.evaluate(() =>
    [...document.querySelectorAll('button')]
      .filter((b) => b.scrollWidth > b.clientWidth + 1)
      .map((b) => b.textContent?.trim()),
  );
  expect(clipped).toEqual([]);
});

test('renders without console errors on mobile', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});
