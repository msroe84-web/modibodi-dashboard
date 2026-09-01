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

export const productSales: ProductSalesRow[] = [
  { product: '클래식 브리프', units: 1240, revenue: 39_680_000 },
  { product: '심프리 하이웨스트', units: 860, revenue: 30_960_000 },
  { product: '스윔 보텀', units: 310, revenue: 13_020_000 },
  { product: '틴 브리프', units: 540, revenue: 15_120_000 },
];

export const inventory: InventoryRow[] = [
  { product: '클래식 브리프', stock: 210, avgDailySales: 41 },
  { product: '심프리 하이웨스트', stock: 480, avgDailySales: 29 },
  { product: '스윔 보텀', stock: 55, avgDailySales: 10 },
  { product: '틴 브리프', stock: 620, avgDailySales: 18 },
];

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
