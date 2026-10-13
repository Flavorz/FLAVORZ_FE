/**
 * Domain types for the Flavorz marketplace.
 *
 * Shapes follow the Figma design (Dev Flavorz). They are deliberately plain
 * so the API layer can satisfy them later without reshaping components.
 */

export interface Maker {
  id: string;
  name: string;
  /** City shown under the name, e.g. "Madurai". */
  place: string;
  /** Follower count, pre-formatted for display, e.g. "2.4k". */
  followers: string;
}

export interface Product {
  id: string;
  name: string;
  /** Pack size as shown, e.g. "250 g", "3 kg". */
  size: string;
  priceInr: number;
  /** Struck-through original price, when discounted. */
  wasInr?: number;
  maker: Pick<Maker, 'name'>;
  /** Corner tag: "Harvest", "Fresh batch", "15% off". */
  tag?: string;
  /** Social proof line, e.g. "12 bought in the last hour". */
  proof?: string;
  postedAgo?: string;
}

export interface Reel {
  id: string;
  /** Activity label: Making, Harvest, Packing, Unboxing. */
  kind: string;
  maker: Pick<Maker, 'name'>;
  caption: string;
  product: Pick<Product, 'name' | 'priceInr'>;
}

export interface KitchenVideo {
  id: string;
  kind: string;
  title: string;
  maker: Pick<Maker, 'name'>;
  watchMinutes: number;
  cheered: number;
  product: Pick<Product, 'name' | 'size' | 'priceInr'>;
}

export interface LeaderEntry {
  rank: number;
  name: string;
  /** Tier badge ("Platinum") or a metric ("48 comments"). */
  detail: string;
  isViewer?: boolean;
}

export interface Leaderboard {
  title: string;
  entries: LeaderEntry[];
}

export interface ActivityItem {
  id: string;
  text: string;
}

export interface Category {
  id: string;
  label: string;
}

export interface ShopperTier {
  name: string;
  spentInr: number;
  nextTier: string;
  nextTierAtInr: number;
  tiers: Array<{ name: string; atInr: number }>;
}
