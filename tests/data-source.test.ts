import { describe, expect, it } from 'vitest';
import { mockSource } from '../src/lib/data/mock';
import type { ContentSource } from '../src/lib/data/types';

/**
 * The content contract.
 *
 * These run against the mock source. A real API implementation must satisfy
 * the same assertions — that is what makes the swap safe.
 */
describe('content source', () => {
  const source: ContentSource = mockSource;

  it('returns site chrome', async () => {
    const site = await source.site();
    expect(site.brand).toBe('Flavorz');
    expect(site.nav).toContain('Shop');
    expect(site.footer.columns.length).toBeGreaterThan(0);
  });

  it('returns a complete home payload', async () => {
    const home = await source.home();
    expect(home.ticker.length).toBeGreaterThan(0);
    expect(home.promos).toHaveLength(3);
    expect(home.reels.length).toBeGreaterThan(0);
    expect(home.leaderboards).toHaveLength(3);
    expect(home.shopper.tiers).toHaveLength(3);
  });

  it('returns a cart with grouped lines', async () => {
    const cart = await source.cart();
    expect(cart.groups.length).toBeGreaterThan(0);
    const lines = cart.groups.flatMap((g) => g.lines);
    expect(lines).toHaveLength(cart.groups.reduce((n, g) => n + g.lines.length, 0));
    expect(cart.summary.toPay).toMatch(/₹/);
  });

  it('resolves a product with its maker attached', async () => {
    const product = await source.product('idli-podi');
    expect(product).not.toBeNull();
    expect(product!.maker.name).toBe('Lakshmi Amma');
    expect(product!.packs.some((p) => p.selected)).toBe(true);
  });

  it('returns null for an unknown slug rather than throwing', async () => {
    expect(await source.product('does-not-exist')).toBeNull();
    expect(await source.maker('nobody')).toBeNull();
  });

  it('keeps the caller order in productsByIds and skips unknown ids', async () => {
    const got = await source.productsByIds(['kodubale', 'nope', 'idli-podi']);
    expect(got.map((p) => p.id)).toEqual(['kodubale', 'idli-podi']);
  });

  it('has no product pointing at a missing maker', async () => {
    const products = await source.products();
    const makers = await source.makers();
    const ids = new Set(makers.map((m) => m.id));
    for (const p of products) {
      expect(ids.has(p.makerId), `${p.id} -> ${p.makerId}`).toBe(true);
    }
  });

  it('every referenced id in home content resolves', async () => {
    const home = await source.home();
    const products = await source.products();
    const makers = await source.makers();
    const productIds = new Set(products.map((p) => p.id));
    const makerIds = new Set(makers.map((m) => m.id));

    for (const id of home.freshProductIds) expect(productIds.has(id), id).toBe(true);
    for (const id of home.makerIds) expect(makerIds.has(id), id).toBe(true);
    for (const r of home.reels) {
      expect(productIds.has(r.productId), r.productId).toBe(true);
      expect(makerIds.has(r.makerId), r.makerId).toBe(true);
    }
    for (const v of home.videos) {
      expect(productIds.has(v.productId), v.productId).toBe(true);
      expect(makerIds.has(v.makerId), v.makerId).toBe(true);
    }
  });

  it('every id the cart references resolves', async () => {
    const cart = await source.cart();
    const products = await source.products();
    const makers = await source.makers();
    const productIds = new Set(products.map((p) => p.id));
    const makerIds = new Set(makers.map((m) => m.id));

    for (const g of cart.groups) {
      expect(makerIds.has(g.makerId), g.makerId).toBe(true);
      for (const l of g.lines) expect(productIds.has(l.productId), l.productId).toBe(true);
    }
    for (const id of cart.addOnProductIds) expect(productIds.has(id), id).toBe(true);
  });
});
