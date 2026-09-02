import { newCustomersSeries } from './mockOverview';

/** Deterministic PRNG so the mock dataset doesn't reshuffle on every render/reload. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260901 + 1);

/**
 * Repeat/재구매 customers, derived from the same daily new-customer series so the
 * two move together plausibly (repeat customers trend smaller than new, with
 * gentle noise + a slow upward drift as the membership base grows).
 */
export const repeatCustomersSeries = newCustomersSeries.map(({ date, value }, i) => {
  const growth = 1 + (i / newCustomersSeries.length) * 0.35;
  const noise = 0.8 + rand() * 0.35;
  return { date, value: Math.max(0, Math.round(value * 0.45 * growth * noise)) };
});

/** Rough current size of the active (purchased at least once) customer base — for context, not filtered by date range. */
export const totalActiveCustomers = 4820;
