import type { CalendarEventRow, ChannelRevenuePoint, InventoryRow, ProductSalesRow } from '../lib/types';

export const CHANNELS = ['자사몰', '무신사', '29CM', 'W컨셉', '카카오'] as const;
export const PRODUCTS = ['클래식 브리프', '심프리 하이웨스트', '스윔 보텀', '틴 브리프'] as const;

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

const rand = mulberry32(20260901);

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const TODAY = new Date('2026-09-01T00:00:00Z');
const RANGE_DAYS = 120;

const CHANNEL_BASE: Record<string, number> = {
  자사몰: 620_000,
  무신사: 380_000,
  '29CM': 210_000,
  W컨셉: 150_000,
  카카오: 90_000,
};

export const channelRevenueSeries: ChannelRevenuePoint[] = (() => {
  const rows: ChannelRevenuePoint[] = [];
  for (let i = RANGE_DAYS - 1; i >= 0; i--) {
    const d = new Date(TODAY);
    d.setUTCDate(d.getUTCDate() - i);
    const date = toISODate(d);
    const dayOfWeek = d.getUTCDay();
    const weekendLift = dayOfWeek === 0 || dayOfWeek === 6 ? 1.18 : 1;
    // gentle upward growth trend as launch ramps up
    const growth = 1 + ((RANGE_DAYS - i) / RANGE_DAYS) * 0.6;

    for (const channel of CHANNELS) {
      const base = CHANNEL_BASE[channel];
      const noise = 0.75 + rand() * 0.5;
      const revenue = Math.round(base * growth * weekendLift * noise);
      rows.push({ date, channel, revenue });
    }
  }
  return rows;
})();

/** Deterministic, cumulative (not date-range-filtered) product-page conversion rate — a real
 *  analytics integration will replace this; seeded separately from `rand` so adding/reordering
 *  other mock series above never shifts these values. */
const productConversionRate = mulberry32(20260901 + 41);

export const productSales: ProductSalesRow[] = [
  { product: '클래식 브리프', code: 'CLB-001', units: 1240, revenue: 39_680_000 },
  { product: '심프리 하이웨스트', code: 'SHW-002', units: 860, revenue: 30_960_000 },
  { product: '스윔 보텀', code: 'SWB-003', units: 310, revenue: 13_020_000 },
  { product: '틴 브리프', code: 'TNB-004', units: 540, revenue: 15_120_000 },
].map((row) => ({
  ...row,
  conversionRate: Math.round((2 + productConversionRate() * 4) * 10) / 10,
}));

/** Color-variant breakdown per product. Real per-color intake quantities aren't wired up yet
 *  (물류 API 연동 전), so these are placeholder splits — but they're the *only* place variant
 *  quantities are set: each row's `stock` below is always `sum(variants[].quantity)`, computed
 *  once here, never a second independently-set number. */
const inventoryVariants: Record<string, { color: string; quantity: number }[]> = {
  '클래식 브리프': [
    { color: '블랙', quantity: 90 },
    { color: '아이보리', quantity: 70 },
    { color: '그레이', quantity: 50 },
  ],
  '심프리 하이웨스트': [
    { color: '블랙', quantity: 190 },
    { color: '누드', quantity: 160 },
    { color: '차콜', quantity: 130 },
  ],
  '스윔 보텀': [
    { color: '블랙', quantity: 25 },
    { color: '네이비', quantity: 20 },
    { color: '핑크', quantity: 10 },
  ],
  '틴 브리프': [
    { color: '화이트', quantity: 220 },
    { color: '베이지', quantity: 210 },
    { color: '라벤더', quantity: 190 },
  ],
};

export const inventory: InventoryRow[] = [
  { product: '클래식 브리프', avgDailySales: 41 },
  { product: '심프리 하이웨스트', avgDailySales: 29 },
  { product: '스윔 보텀', avgDailySales: 10 },
  { product: '틴 브리프', avgDailySales: 18 },
].map((row) => {
  const variants = inventoryVariants[row.product] ?? [];
  return { ...row, variants, stock: variants.reduce((sum, v) => sum + v.quantity, 0) };
});

export const upcomingEvents: CalendarEventRow[] = [
  { date: '2026-09-03', title: '무신사 입점 기획전 시작', type: 'promo' },
  { date: '2026-09-05', title: 'Meta 신규 크리에이티브 세팅', type: 'ad' },
  { date: '2026-09-10', title: '클래식 브리프 재입고', type: 'restock' },
];

/** Ad spend-to-date this month, per channel — for the over-budget alert. */
export const adSpendMonthToDate: Record<string, number> = {
  Meta: 5_420_000,
  네이버: 3_180_000,
  구글: 1_760_000,
  틱톡: 980_000,
};

const dailyTotalRevenue = new Map<string, number>();
for (const row of channelRevenueSeries) {
  dailyTotalRevenue.set(row.date, (dailyTotalRevenue.get(row.date) ?? 0) + row.revenue);
}

export const totalRevenueSeries = Array.from(dailyTotalRevenue.entries()).map(([date, value]) => ({ date, value }));

const AVG_ORDER_VALUE = 34_000;

/** Orders/new-customers derived from daily revenue so sub-metrics move together plausibly. */
export const ordersSeries = Array.from(dailyTotalRevenue.entries()).map(([date, revenue]) => ({
  date,
  value: Math.max(1, Math.round((revenue / AVG_ORDER_VALUE) * (0.9 + rand() * 0.2))),
}));

export const newCustomersSeries = ordersSeries.map(({ date, value }) => ({
  date,
  value: Math.round(value * (0.55 + rand() * 0.15)),
}));

export const repeatRateSeries = ordersSeries.map(({ date }) => ({
  date,
  value: Math.round((22 + rand() * 10) * 10) / 10,
}));

/** Purchase-funnel steps (visits -> cart -> checkout -> purchase), built so the ordering is
 *  *guaranteed* rather than merely likely: `purchase` is the existing `ordersSeries` (unchanged),
 *  and each step above it is derived from the step below via a fixed conversion-rate constant
 *  (no independent per-day noise), so multiplying up the funnel can only ever increase the count.
 *  Only `visitsSeries` carries extra randomness, and it's added strictly on top of `cartSeries`
 *  (never as an independent draw), so visits >= cart >= checkout >= purchase always holds. */
const CART_TO_CHECKOUT_RATE = 0.55;
const CHECKOUT_TO_PURCHASE_RATE = 0.62;
const VISIT_TO_CART_RATE = 0.12;

export const checkoutSeries = ordersSeries.map(({ date, value }) => ({
  date,
  value: Math.round(value / CHECKOUT_TO_PURCHASE_RATE),
}));

export const cartSeries = checkoutSeries.map(({ date, value }) => ({
  date,
  value: Math.round(value / CART_TO_CHECKOUT_RATE),
}));

export const visitsSeries = cartSeries.map(({ date, value }) => ({
  date,
  value: Math.round((value / VISIT_TO_CART_RATE) * (1 + rand() * 0.25)),
}));
