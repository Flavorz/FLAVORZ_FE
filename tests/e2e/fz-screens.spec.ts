import { expect, test } from '@playwright/test';

/**
 * The new screens from the Figma file: product detail and cart.
 * Phase 1 of the purchase flow, sharing one header and footer.
 */

test.describe('shared header', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('carries the elements the new screens added', async ({ page }) => {
    await page.goto('/cart/');
    // Social links, a cart with a count badge, and breadcrumbs are all new.
    await expect(page.locator('.fz-social')).toHaveCount(2);
    await expect(page.locator('.fz-cart')).toBeVisible();
    await expect(page.locator('.fz-cart__count')).toHaveText('4');
    await expect(page.locator('.fz-crumbs')).toBeVisible();
  });

  test('is 88px tall, matching the frame', async ({ page }) => {
    await page.goto('/product/idli-podi/');
    const h = await page.evaluate(
      () => Math.round(document.querySelector('.fz-header')!.getBoundingClientRect().height),
    );
    // 88 in the frame; the breadcrumb row adds its own height below.
    expect(Math.abs(h - 88)).toBeLessThan(40);
  });
});

test.describe('product detail', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('renders every block from the frame', async ({ page }) => {
    await page.goto('/product/idli-podi/');
    await expect(page.getByRole('heading', { name: 'Idli podi', level: 1 })).toBeVisible();
    await expect(page.locator('.fz-gal__main')).toBeVisible();
    await expect(page.locator('.fz-gal__thumb')).toHaveCount(5);
    await expect(page.locator('.fz-pack')).toHaveCount(3);
    await expect(page.locator('.fz-qty')).toBeVisible();
    await expect(page.getByText('Delivery by tomorrow · Pay on delivery')).toBeVisible();
    await expect(page.locator('.fz-maker')).toBeVisible();
  });

  test('marks the selected pack size', async ({ page }) => {
    await page.goto('/product/idli-podi/');
    const selected = page.locator('.fz-pack.is-selected');
    await expect(selected).toHaveCount(1);
    await expect(selected).toContainText('200 g');
    await expect(selected).toHaveAttribute('aria-pressed', 'true');
  });

  test('shows the maker stats', async ({ page }) => {
    await page.goto('/product/idli-podi/');
    await expect(page.getByText('Verified maker')).toBeVisible();
    for (const stat of ['Maker rating', 'Cheers', 'Products']) {
      await expect(page.getByText(stat, { exact: true })).toBeVisible();
    }
  });
});

test.describe('cart', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test('groups lines by maker with their totals', async ({ page }) => {
    await page.goto('/cart/');
    await expect(page.locator('.fz-mgroup')).toHaveCount(2);
    await expect(page.locator('.fz-line')).toHaveCount(3);
    await expect(page.getByText('Maker total').first()).toBeVisible();
  });

  test('renders the order summary blocks', async ({ page }) => {
    await page.goto('/cart/');
    await expect(page.getByRole('heading', { name: 'Order summary' })).toBeVisible();
    await expect(page.getByPlaceholder('Have an offer code?')).toBeVisible();
    await expect(page.getByText('To pay')).toBeVisible();
    await expect(page.getByText('Pay on delivery')).toBeVisible();
    await expect(page.getByRole('link', { name: /Place Order/ })).toBeVisible();
  });

  test('offers more products to add', async ({ page }) => {
    await page.goto('/cart/');
    await expect(page.getByRole('heading', { name: 'Fresh today, add to your order' })).toBeVisible();
    await expect(page.locator('.fz-addcard')).toHaveCount(2);
  });
});

test('the purchase flow links together', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/product/idli-podi/');
  await page.getByRole('link', { name: 'Add to cart' }).click();
  await expect(page).toHaveURL(/\/cart\/?$/);
  await expect(page.getByRole('heading', { name: 'Your cart' })).toBeVisible();
});

test('the new screens render without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  for (const url of ['/product/idli-podi/', '/cart/']) {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
  }
  expect(errors).toEqual([]);
});

test.describe('payment', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test('renders address, methods and summary', async ({ page }) => {
    await page.goto('/payment/');
    await expect(page.getByRole('heading', { name: 'Payment', level: 1 })).toBeVisible();
    await expect(page.getByText('Deliver to')).toBeVisible();
    await expect(page.locator('.fz-method')).toHaveCount(4);
    await expect(page.getByRole('heading', { name: 'Order summary' })).toBeVisible();
    // Exact: "Choose how you'd like to pay" also contains "to pay".
    await expect(page.getByText('To pay', { exact: true })).toBeVisible();
  });

  test('marks one method as selected', async ({ page }) => {
    await page.goto('/payment/');
    const selected = page.locator('.fz-method.is-selected');
    await expect(selected).toHaveCount(1);
    await expect(selected).toContainText('Pay on delivery');
    await expect(selected.locator('input')).toBeChecked();
  });

  test('lists every cart line', async ({ page }) => {
    await page.goto('/payment/');
    // Three lines across two makers, matching the cart.
    await expect(page.locator('.fz-pay-lines li')).toHaveCount(3);
  });

  test('shares the totals styling with the cart', async ({ page }) => {
    // .fz-totals and .fz-zero were scoped to OrderSummary and rendered
    // unstyled here; both are global now.
    await page.goto('/payment/');
    const styles = await page.evaluate(() => ({
      totals: getComputedStyle(document.querySelector('.fz-totals')!).display,
      zeroBg: getComputedStyle(document.querySelector('.fz-zero')!).backgroundColor,
    }));
    expect(styles.totals).toBe('grid');
    expect(styles.zeroBg).toBe('rgb(242, 225, 222)');
  });
});

test('cart links through to payment', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/cart/');
  await page.getByRole('link', { name: /Place Order/ }).click();
  await expect(page).toHaveURL(/\/payment\/?$/);
  await expect(page.getByRole('heading', { name: 'Payment', level: 1 })).toBeVisible();
});

test.describe('shop listing', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test('default view shows categories, filters and a grid', async ({ page }) => {
    await page.goto('/shop/');
    await expect(page.getByRole('heading', { name: 'Shop the pantry', level: 1 })).toBeVisible();
    await expect(page.locator('.fz-catstrip li')).toHaveCount(8);
    await expect(page.locator('.fz-filtergroup')).toHaveCount(4);
    await expect(page.locator('.fz-shopcard').first()).toBeVisible();
  });

  test('shows applied filter chips and checked options', async ({ page }) => {
    await page.goto('/shop/');
    await expect(page.locator('.fz-filterchip')).toHaveCount(2);
    // Podis and the ₹100-₹250 band are pre-checked in the content.
    const checked = page.locator('.fz-filtergroup input:checked');
    await expect(checked).toHaveCount(2);
  });

  test('results view adds maker chips', async ({ page }) => {
    await page.goto('/shop/results/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Results for');
    await expect(page.locator('.fz-makerchip')).toHaveCount(5);
  });

  test('suggestions view lists searches', async ({ page }) => {
    await page.goto('/shop/suggestions/');
    await expect(page.locator('.fz-suggest')).toBeVisible();
    // Five suggestions plus three recent searches.
    await expect(page.locator('.fz-suggest a')).toHaveCount(8);
  });

  test('no-results view shows the empty state with alternatives', async ({ page }) => {
    await page.goto('/shop/no-results/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('No results');
    await expect(page.getByRole('link', { name: 'Browse the pantry' })).toBeVisible();
    // The empty state still suggests three products.
    await expect(page.locator('.fz-shopcard')).toHaveCount(3);
  });

  test('marks a sold-out product and disables its button', async ({ page }) => {
    await page.goto('/shop/');
    const soldOut = page.locator('.fz-shopcard.is-soldout');
    await expect(soldOut).toHaveCount(1);
    await expect(soldOut.locator('.fz-shopcard__out')).toHaveText('Sold out');
    await expect(soldOut.locator('button')).toBeDisabled();
  });

  test('tags read in sentence case, as the frames do', async ({ page }) => {
    await page.goto('/shop/');
    const tags = await page.evaluate(() =>
      [...document.querySelectorAll('.fz-shopcard .fz-tag')].map((e) => e.textContent?.trim()),
    );
    expect(tags).toContain('Fresh batch');
    expect(tags).not.toContain('FRESH BATCH');
  });

  test('cards link to their product page', async ({ page }) => {
    await page.goto('/shop/');
    await page.locator('.fz-shopcard__name a').first().click();
    await expect(page).toHaveURL(/\/product\/[a-z-]+\/?$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('sign in', () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test('every step from the content has a route', async ({ page }) => {
    const steps = [
      ['customer/phone', 'Sign in or create an account'],
      ['customer/otp', 'Enter the code'],
      ['customer/profile', 'Tell us your name'],
      ['maker/phone', 'Start selling on Flavorz'],
      ['maker/otp', 'Enter the code'],
      ['maker/kitchen', 'Tell us about your kitchen'],
      ['maker/documents', 'Upload your documents'],
      ['maker/review', "We're checking your kitchen"],
    ] as const;

    for (const [slug, heading] of steps) {
      await page.goto(`/signin/${slug}/`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    }
  });

  test('the split panel shows the brand aside and progress', async ({ page }) => {
    await page.goto('/signin/customer/phone/');
    await expect(page.locator('.fz-auth__aside')).toBeVisible();
    await expect(page.locator('.fz-auth__points li')).toHaveCount(3);
    await expect(page.getByText('Step 1 of 3')).toBeVisible();
  });

  test('the phone field carries a +91 prefix', async ({ page }) => {
    await page.goto('/signin/customer/phone/');
    await expect(page.locator('.fz-field__prefix')).toHaveText('+91');
    await expect(page.locator('#phone')).toHaveAttribute('type', 'tel');
  });

  test('the code step renders six labelled boxes', async ({ page }) => {
    await page.goto('/signin/customer/otp/');
    const boxes = page.locator('.fz-otp__boxes input');
    await expect(boxes).toHaveCount(6);
    await expect(boxes.first()).toHaveAttribute('aria-label', 'Digit 1');
    await expect(boxes.first()).toHaveAttribute('inputmode', 'numeric');
  });

  test('the kitchen step is the wide form, not the split panel', async ({ page }) => {
    await page.goto('/signin/maker/kitchen/');
    await expect(page.locator('.fz-auth__aside')).toHaveCount(0);
    await expect(page.locator('.fz-kitchen__section')).toHaveCount(3);
    await expect(page.locator('.fz-field')).toHaveCount(11);
  });

  test('the documents step offers three uploads', async ({ page }) => {
    await page.goto('/signin/maker/documents/');
    await expect(page.locator('.fz-upload')).toHaveCount(3);
    await expect(page.getByText('Optional').first()).toBeVisible();
  });

  test('the review step shows progress through the checks', async ({ page }) => {
    await page.goto('/signin/maker/review/');
    const steps = page.locator('.fz-status__steps li');
    await expect(steps).toHaveCount(3);
    await expect(page.locator('.fz-status__steps li.is-done')).toHaveCount(1);
  });

  test('customer and maker flows cross-link', async ({ page }) => {
    await page.goto('/signin/customer/phone/');
    await page.getByRole('link', { name: 'Sign in as a maker' }).click();
    await expect(page).toHaveURL(/\/signin\/maker\/phone\/?$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Start selling on Flavorz');
  });

  test('the auth screens render without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    for (const slug of ['customer/phone', 'maker/kitchen', 'maker/review']) {
      await page.goto(`/signin/${slug}/`);
      await page.waitForLoadState('networkidle');
    }
    expect(errors).toEqual([]);
  });
});
