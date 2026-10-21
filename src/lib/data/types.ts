/**
 * The content contract.
 *
 * These types describe exactly what every screen needs. The mock source in
 * `./mock.ts` satisfies them from JSON today; a real API has to return the
 * same shapes, and nothing else in the app changes.
 */

export interface Maker {
  id: string;
  name: string;
  /** City shown beside the name in cards. */
  place: string;
  /** City shown on the product page; often the same as `place`. */
  city: string;
  /** Pre-formatted for display, e.g. "2.4k". */
  followers: string;
  verified: boolean;
  bio: string;
  note: string;
  rating: string;
  cheers: string;
  productCount: string;
  image: string;
}

export interface Pack {
  size: string;
  priceInr: number;
  selected?: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  blurb: string;
  makerId: string;
  priceInr: number;
  /** Struck-through original price, when discounted. */
  wasInr?: number;
  discountLabel?: string;
  size: string;
  tag?: string;
  rating: number;
  reviewCount: number;
  cheers: number;
  stockLeft: number;
  soldOut: boolean;
  chips: string[];
  packs: Pack[];
  photoCount: number;
  image: string;
  /** Social proof line, e.g. "12 bought in the last hour". */
  proof?: string;
  postedAgo?: string;
}

/** A product with its maker resolved, which is what cards actually render. */
export interface ProductWithMaker extends Product {
  maker: Maker;
}

export interface Reel {
  kind: string;
  makerId: string;
  caption: string;
  productId: string;
}

export interface KitchenVideo {
  kind: string;
  title: string;
  makerId: string;
  watchMinutes: number;
  cheered: number;
  productId: string;
}

export interface LeaderRow {
  rank: string;
  name: string;
  detail: string;
  /** Tier names render as a filled pill; metrics render as plain text. */
  isTier?: boolean;
}

export interface Leaderboard {
  title: string;
  rows: LeaderRow[];
}

export interface ShopperTier {
  name: string;
  at: string;
}

export interface Shopper {
  name: string;
  greeting: string;
  league: string;
  spentLabel: string;
  tier: string;
  progressPct: number;
  tiers: ShopperTier[];
  perks: {
    heading: string;
    lines: Array<{ tier: string; text: string }>;
    note: string;
  };
}

export interface Promo {
  tag: string;
  title: string;
  body?: string;
  cta?: string;
  tone: 'panel' | 'dark' | 'mid';
}

export interface FilterOption {
  label: string;
  count: number;
  checked?: boolean;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
}

export interface ShopContent {
  heading: string;
  deliverTo: string;
  promise: string;
  categories: string[];
  sorts: string[];
  filters: FilterGroup[];
  appliedChips: string[];
  search: {
    query: string;
    resultsHeading: string;
    resultsCount: string;
    makersHeading: string;
    suggestionHeading: string;
    suggestions: string[];
    recentHeading: string;
    recent: string[];
  };
  empty: {
    heading: string;
    body: string;
    cta: string;
    suggestionsHeading: string;
  };
}

export interface HomeContent {
  ticker: string[];
  shopper: Shopper;
  promos: Promo[];
  reels: Reel[];
  categories: string[];
  freshProductIds: string[];
  videos: KitchenVideo[];
  leaderboards: Leaderboard[];
  makerIds: string[];
  commission: { line: string; cta: string; youPay: string; makerGets: string };
  shop: ShopContent;
}

export interface CartLine {
  productId: string;
  size: string;
  price: string;
  was?: string;
  off?: string;
  lineTotal: string;
  qty: number;
}

export interface CartGroup {
  makerId: string;
  note: string;
  total: string;
  lines: CartLine[];
}

export interface PaymentMethod {
  id: string;
  label: string;
  note: string;
  /** Optional pill shown beside the label, e.g. "Instant". */
  badge?: string;
  selected?: boolean;
}

export interface PaymentContent {
  heading: string;
  subheading: string;
  methods: PaymentMethod[];
  cta: string;
  ctaNote: string;
  secureNote: string;
}

export interface CartContent {
  itemCount: number;
  makerCount: number;
  groups: CartGroup[];
  summary: {
    address: {
      label: string;
      line: string;
      phone: string;
      verified: boolean;
      delivery: string;
    };
    tier: {
      name: string;
      note: string;
      progressPct: number;
      toNext: string;
      nextTier: string;
      topTier: string;
    };
    rows: Array<{ label: string; value: string }>;
    toPay: string;
    payment: { label: string; note: string };
    zeroCommission: string;
    cta: string;
    ctaNote: string;
  };
  addOnProductIds: string[];
  payment: PaymentContent;
}

export interface SiteContent {
  brand: string;
  nav: string[];
  location: string;
  onlineCount: number;
  searchPlaceholder: string;
  languages: Array<{ code: string; label: string }>;
  viewer: { initials: string; tier: string };
  footer: { columns: Array<{ heading: string; lines: string[] }> };
}

/**
 * Everything a screen can ask for. Implement this against a real API and the
 * UI needs no changes.
 */
export interface ContentSource {
  site(): Promise<SiteContent>;
  home(): Promise<HomeContent>;
  cart(): Promise<CartContent>;
  makers(): Promise<Maker[]>;
  maker(id: string): Promise<Maker | null>;
  products(): Promise<Product[]>;
  product(slug: string): Promise<ProductWithMaker | null>;
  productsByIds(ids: string[]): Promise<ProductWithMaker[]>;
}
