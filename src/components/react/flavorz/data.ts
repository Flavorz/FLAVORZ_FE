/**
 * Demo content, transcribed from the Dev Flavorz design.
 *
 * This is placeholder data in the shape the API will eventually return —
 * see ./types.ts. Swap the source, keep the components.
 */
import type {
  ActivityItem,
  Category,
  KitchenVideo,
  Leaderboard,
  Maker,
  Product,
  Reel,
  ShopperTier,
} from './types';

export const ACTIVITY: ActivityItem[] = [
  { id: 'a1', text: 'Meena in Mysuru just bought Sambar mix · 2 min ago' },
  { id: 'a2', text: 'Super shopper · ₹1,580 to Gold' },
  { id: 'a3', text: 'Leading comments · Meena shared 12 helpful tips' },
  { id: 'a4', text: 'Delivery by tomorrow · Pay on delivery' },
];

export const TIER: ShopperTier = {
  name: 'Silver',
  spentInr: 3420,
  nextTier: 'Gold',
  nextTierAtInr: 5000,
  tiers: [
    { name: 'Silver', atInr: 1000 },
    { name: 'Gold', atInr: 5000 },
    { name: 'Platinum', atInr: 10000 },
  ],
};

export const REELS: Reel[] = [
  {
    id: 'r1',
    kind: 'Making',
    maker: { name: 'Lakshmi Amma' },
    caption: 'Grinding idli podi',
    product: { name: 'Idli podi', priceInr: 120 },
  },
  {
    id: 'r2',
    kind: 'Harvest',
    maker: { name: 'Ganesh K' },
    caption: 'Avarekalu this morning',
    product: { name: 'Avarekalu', priceInr: 160 },
  },
  {
    id: 'r3',
    kind: 'Packing',
    maker: { name: 'Savitri Rao' },
    caption: 'Packing gongura pickle',
    product: { name: 'Gongura', priceInr: 210 },
  },
  {
    id: 'r4',
    kind: 'Unboxing',
    maker: { name: 'Rekha K' },
    caption: 'Opening her jaggery order',
    product: { name: 'Jaggery', priceInr: 150 },
  },
];

export const CATEGORIES: Category[] = [
  { id: 'c1', label: 'Podis' },
  { id: 'c2', label: 'Pickles' },
  { id: 'c3', label: 'Snacks' },
  { id: 'c4', label: 'Millets' },
  { id: 'c5', label: 'Produce' },
  { id: 'c6', label: 'Sweets' },
  { id: 'c7', label: 'Ready mixes' },
  { id: 'c8', label: 'Bundles' },
];

export const FRESH: Product[] = [
  {
    id: 'p1',
    name: 'Badami mangoes',
    size: '3 kg',
    priceInr: 899,
    wasInr: 990,
    maker: { name: 'Lakshmi Amma' },
    tag: 'Harvest',
    postedAgo: '2h ago',
    proof: '12 bought in the last hour',
  },
  {
    id: 'p2',
    name: 'Kodubale',
    size: '250 g',
    priceInr: 240,
    maker: { name: 'Savitri Rao' },
    tag: 'Fresh batch',
    postedAgo: '3h ago',
    proof: '96 cheered',
  },
  {
    id: 'p3',
    name: 'Avarekalu',
    size: '500 g',
    priceInr: 120,
    maker: { name: 'Ganesh K' },
    tag: 'Harvest',
    postedAgo: '3h ago',
  },
  {
    id: 'p4',
    name: 'Idli podi',
    size: '200 g',
    priceInr: 160,
    wasInr: 190,
    maker: { name: 'Radha Devi' },
    tag: '15% off',
    proof: '48 neighbours bought this',
  },
];

export const VIDEOS: KitchenVideo[] = [
  {
    id: 'v1',
    kind: 'Making',
    title: 'How Lakshmi Amma stone-grinds idli podi',
    maker: { name: 'Lakshmi Amma' },
    watchMinutes: 2,
    cheered: 214,
    product: { name: 'Idli podi', size: '200 g', priceInr: 120 },
  },
  {
    id: 'v2',
    kind: 'Harvest',
    title: 'A morning in the avarekalu fields',
    maker: { name: 'Ganesh K' },
    watchMinutes: 3,
    cheered: 141,
    product: { name: 'Avarekalu', size: '500 g', priceInr: 120 },
  },
  {
    id: 'v3',
    kind: 'Packing',
    title: 'Gongura pickle, jar by jar',
    maker: { name: 'Savitri Rao' },
    watchMinutes: 2,
    cheered: 96,
    product: { name: 'Gongura', size: '300 g', priceInr: 210 },
  },
];

export const LEADERBOARDS: Leaderboard[] = [
  {
    title: 'Super shoppers',
    entries: [
      { rank: 1, name: 'Meena', detail: 'Platinum' },
      { rank: 2, name: 'Rekha K', detail: 'Gold' },
      { rank: 3, name: 'You', detail: 'Silver', isViewer: true },
    ],
  },
  {
    title: 'Leading comments',
    entries: [
      { rank: 1, name: 'Meena', detail: '48 comments' },
      { rank: 2, name: 'Ganesh M', detail: '31 comments' },
      { rank: 3, name: 'Rekha K', detail: '22 comments' },
    ],
  },
  {
    title: 'Content leaders',
    entries: [
      { rank: 1, name: 'Lakshmi Amma', detail: '12 posts' },
      { rank: 2, name: 'Savitri Rao', detail: '9 posts' },
      { rank: 3, name: 'Radha Devi', detail: '7 posts' },
    ],
  },
];

export const MAKERS: Maker[] = [
  { id: 'm1', name: 'Lakshmi Amma', place: 'Madurai', followers: '2.4k' },
  { id: 'm2', name: 'Savitri Rao', place: 'Guntur', followers: '1.9k' },
  { id: 'm3', name: 'Ganesh K', place: 'Dharwad', followers: '1.2k' },
  { id: 'm4', name: 'Radha Devi', place: 'Mysore', followers: '640' },
];
