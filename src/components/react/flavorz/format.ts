/**
 * Indian-locale formatting.
 *
 * Prices use the Indian digit grouping (1,580 / 1,00,000), which differs from
 * the Western thousands grouping — en-IN handles it correctly.
 */
const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatInr(value: number): string {
  return inr.format(value);
}

/** Plain grouped number, for "₹1,580 to Gold" style copy. */
const plain = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function formatNumber(value: number): string {
  return plain.format(value);
}
