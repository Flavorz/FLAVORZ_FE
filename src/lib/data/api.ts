/**
 * Real API content source.
 *
 * Not in use yet. When the backend exists, set PUBLIC_CONTENT_SOURCE=api and
 * PUBLIC_API_BASE_URL in .env, and this replaces the mock with no changes to
 * any screen.
 *
 * Each endpoint must return the shape in ./types.ts. If the backend's shape
 * differs, map it HERE rather than changing components.
 */
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

const BASE = import.meta.env.PUBLIC_API_BASE_URL ?? '';

async function get<T>(path: string): Promise<T> {
  if (!BASE) {
    throw new Error(
      'PUBLIC_API_BASE_URL is not set. Set it, or use PUBLIC_CONTENT_SOURCE=mock.',
    );
  }
  const res = await fetch(new URL(path, BASE), { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

export const apiSource: ContentSource = {
  site: () => get<SiteContent>('/site'),
  auth: () => get<AuthContent>('/auth'),
  home: () => get<HomeContent>('/home'),
  cart: () => get<CartContent>('/cart'),
  makers: () => get<Maker[]>('/makers'),

  async maker(id) {
    try {
      return await get<Maker>(`/makers/${encodeURIComponent(id)}`);
    } catch {
      return null;
    }
  },

  products: () => get<Product[]>('/products'),

  async product(slug) {
    try {
      return await get<ProductWithMaker>(`/products/${encodeURIComponent(slug)}`);
    } catch {
      return null;
    }
  },

  productsByIds: (ids) =>
    get<ProductWithMaker[]>(`/products?ids=${encodeURIComponent(ids.join(','))}`),
};
