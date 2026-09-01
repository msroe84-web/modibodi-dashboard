import { TODAY } from './mockOverview';
import type { TimeSeriesPoint } from '../lib/dateRange';

export const MARKETING_CHANNELS = ['Meta', '네이버', '구글', '틱톡'] as const;
export type MarketingChannel = (typeof MARKETING_CHANNELS)[number];

export interface ChannelDailyMetrics {
  date: string;
  channel: MarketingChannel;
  spend: number;
  revenue: number;
  clicks: number;
  conversions: number;
}

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

const rand = mulberry32(20260901 + 7);

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const RANGE_DAYS = 120;

/** Per-channel baseline economics — daily spend level, blended ROAS, avg CPC, and click->conversion rate. */
const CHANNEL_PROFILE: Record<MarketingChannel, { dailySpend: number; roas: number; cpc: number; cvr: number }> = {
  Meta: { dailySpend: 175_000, roas: 3.3, cpc: 350, cvr: 0.045 },
  네이버: { dailySpend: 105_000, roas: 2.6, cpc: 420, cvr: 0.052 },
  구글: { dailySpend: 60_000, roas: 2.9, cpc: 480, cvr: 0.038 },
  틱톡: { dailySpend: 33_000, roas: 2.0, cpc: 210, cvr: 0.03 },
};

/** Flat daily rows, one per channel per day — mirrors mockOverview's channelRevenueSeries shape. */
export const marketingDailySeries: ChannelDailyMetrics[] = (() => {
  const rows: ChannelDailyMetrics[] = [];
  for (let i = RANGE_DAYS - 1; i >= 0; i--) {
    const d = new Date(TODAY);
    d.setUTCDate(d.getUTCDate() - i);
    const date = toISODate(d);
    // gentle upward growth trend as ad spend ramps up toward launch
    const growth = 1 + ((RANGE_DAYS - i) / RANGE_DAYS) * 0.4;

    for (const channel of MARKETING_CHANNELS) {
      const profile = CHANNEL_PROFILE[channel];

      const spendNoise = 0.8 + rand() * 0.4;
      const spend = Math.round(profile.dailySpend * growth * spendNoise);

      const roasNoise = 0.85 + rand() * 0.3;
      const revenue = Math.round(spend * profile.roas * roasNoise);

      const clicksNoise = 0.9 + rand() * 0.2;
      const clicks = Math.max(1, Math.round((spend / profile.cpc) * clicksNoise));

      const cvrNoise = 0.85 + rand() * 0.3;
      const conversions = Math.max(0, Math.round(clicks * profile.cvr * cvrNoise));

      rows.push({ date, channel, spend, revenue, clicks, conversions });
    }
  }
  return rows;
})();

/** Extract a single channel's daily series for one numeric field, in the {date,value} shape dateRange utils expect. */
export function channelSeries(
  channel: MarketingChannel,
  field: 'spend' | 'revenue' | 'clicks' | 'conversions',
): TimeSeriesPoint[] {
  return marketingDailySeries
    .filter((r) => r.channel === channel)
    .map((r) => ({ date: r.date, value: r[field] }));
}

function sumAcrossChannels(field: 'spend' | 'revenue' | 'clicks' | 'conversions'): TimeSeriesPoint[] {
  const byDate = new Map<string, number>();
  for (const row of marketingDailySeries) {
    byDate.set(row.date, (byDate.get(row.date) ?? 0) + row[field]);
  }
  return Array.from(byDate.entries()).map(([date, value]) => ({ date, value }));
}

export const totalAdSpendSeries: TimeSeriesPoint[] = sumAcrossChannels('spend');
export const totalAttributedRevenueSeries: TimeSeriesPoint[] = sumAcrossChannels('revenue');
export const totalConversionsSeries: TimeSeriesPoint[] = sumAcrossChannels('conversions');

/** Daily blended ROAS (revenue/spend) and CPA (spend/conversions) — for sparklines only; headline
 *  totals should be computed as sum(revenue)/sum(spend) etc. over the selected range, not averaged
 *  from these per-day ratios. All three totals above are derived from the same source rows in the
 *  same date order, so zipping by index is safe. */
export const totalRoasSeries: TimeSeriesPoint[] = totalAdSpendSeries.map((p, i) => {
  const revenue = totalAttributedRevenueSeries[i]?.value ?? 0;
  return { date: p.date, value: p.value > 0 ? revenue / p.value : 0 };
});

export const totalCpaSeries: TimeSeriesPoint[] = totalAdSpendSeries.map((p, i) => {
  const conversions = totalConversionsSeries[i]?.value ?? 0;
  return { date: p.date, value: conversions > 0 ? p.value / conversions : 0 };
});
