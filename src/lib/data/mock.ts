/**
 * Mock content source, backed by the JSON in src/content/.
 *
 * Used until a real API exists. Every method is async even though the data is
 * local, so swapping in `api.ts` needs no call-site changes.
 */
import makersJson from '../../content/makers.json';
import productsJson from '../../content/products.json';
import homeJson from '../../content/home.json';
import cartJson from '../../content/cart.json';
import siteJson from '../../content/site.json';
import authJson from '../../content/auth.json';
import type {
  AuthContent,
  CartContent,
  ContentSource,
  HomeContent,
  Maker,
  Product,
  ProductWithMaker,
  SiteContent,
} from './types';

const makersList = makersJson as Maker[];
const productsList = productsJson as Product[];
const makersById = new Map(makersList.map((m) => [m.id, m]));

function withMaker(product: Product): ProductWithMaker {
  const maker = makersById.get(product.makerId);
  if (!maker) {
    // A dangling makerId is a content bug; fail loudly rather than render a
    // card with a blank author.
    throw new Error(`product "${product.id}" references unknown maker "${product.makerId}"`);
  }
  return { ...product, maker };
}

export const mockSource: ContentSource = {
  async site(): Promise<SiteContent> {
    return siteJson as SiteContent;
  },

  async auth(): Promise<AuthContent> {
    return authJson as AuthContent;
  },

  async home(): Promise<HomeContent> {
    return homeJson as HomeContent;
  },

  async cart(): Promise<CartContent> {
    return cartJson as CartContent;
  },

  async makers(): Promise<Maker[]> {
    return makersList;
  },

  async maker(id: string): Promise<Maker | null> {
    return makersById.get(id) ?? null;
  },

  async products(): Promise<Product[]> {
    return productsList;
  },

  async product(slug: string): Promise<ProductWithMaker | null> {
    const found = productsList.find((p) => p.slug === slug);
    return found ? withMaker(found) : null;
  },

  async productsByIds(ids: string[]): Promise<ProductWithMaker[]> {
    // Preserve the caller's order; a missing id is skipped rather than fatal.
    return ids
      .map((id) => productsList.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p))
      .map(withMaker);
  },
};
