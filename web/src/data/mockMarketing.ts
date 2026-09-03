import { TODAY } from './mockOverview';
import type { TimeSeriesPoint } from '../lib/dateRange';
import type { CampaignRow } from '../lib/types';

export const MARKETING_CHANNELS = ['Meta', '네이버', '구글', '틱톡'] as const;
export type MarketingChannel = (typeof MARKETING_CHANNELS)[number];

export interface ChannelDailyMetrics {
  date: string;
  channel: MarketingChannel;
  spend: number;
  revenue: number;
  impressions: number;
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
const CHANNEL_PROFILE: Record<
  MarketingChannel,
  { dailySpend: number; roas: number; cpc: number; cvr: number; ctr: number }
> = {
  Meta: { dailySpend: 175_000, roas: 3.3, cpc: 350, cvr: 0.045, ctr: 0.014 },
  네이버: { dailySpend: 105_000, roas: 2.6, cpc: 420, cvr: 0.052, ctr: 0.009 },
  구글: { dailySpend: 60_000, roas: 2.9, cpc: 480, cvr: 0.038, ctr: 0.021 },
  틱톡: { dailySpend: 33_000, roas: 2.0, cpc: 210, cvr: 0.03, ctr: 0.017 },
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

      // Impressions derived from clicks (not the other way around) so CTR = clicks/impressions
      // stays exactly consistent with the already-established spend->clicks relationship above,
      // instead of introducing a second independently-noisy number that could drift apart from it.
      // The ctr ratio itself gets its own daily noise here (like cvrNoise below) — without it,
      // impressions would be an exact constant multiple of clicks every day, making CTR a flat
      // line with zero day-to-day movement, which defeats the point of charting it as a trend.
      const ctrNoise = 0.8 + rand() * 0.4;
      const impressions = Math.max(clicks, Math.round(clicks / (profile.ctr * ctrNoise)));

      const cvrNoise = 0.85 + rand() * 0.3;
      const conversions = Math.max(0, Math.round(clicks * profile.cvr * cvrNoise));

      rows.push({ date, channel, spend, revenue, impressions, clicks, conversions });
    }
  }
  return rows;
})();

/** Cumulative (all-time, not date-range filtered) campaign rows — 2 per channel. Only
 *  impressions/ctr/cpc/conversions/revenue are hand-set; clicks/spend/cpa/roas are always
 *  derived from these wherever they're displayed (see marketingSeries.ts helpers), never stored
 *  separately, so a table can't show numbers that don't multiply out consistently. */
export const campaigns: CampaignRow[] = [
  {
    id: 'meta-brand',
    channel: 'Meta',
    name: '브랜드 인지도 캠페인',
    impressions: 1_240_000,
    ctr: 1.3,
    cpc: 340,
    conversions: 610,
    revenue: 18_400_000,
  },
  {
    id: 'meta-retarget',
    channel: 'Meta',
    name: '리타겟팅 캠페인',
    impressions: 480_000,
    ctr: 2.1,
    cpc: 310,
    conversions: 540,
    revenue: 21_200_000,
  },
  {
    id: 'naver-powerlink',
    channel: '네이버',
    name: '파워링크 키워드',
    impressions: 610_000,
    ctr: 1.6,
    cpc: 430,
    conversions: 430,
    revenue: 12_600_000,
  },
  {
    id: 'naver-shopping',
    channel: '네이버',
    name: '쇼핑 검색광고',
    impressions: 390_000,
    ctr: 1.1,
    cpc: 400,
    conversions: 260,
    revenue: 7_900_000,
  },
  {
    id: 'google-pmax',
    channel: '구글',
    name: '퍼포먼스 맥스',
    impressions: 720_000,
    ctr: 1.8,
    cpc: 470,
    conversions: 380,
    revenue: 11_500_000,
  },
  {
    id: 'google-youtube',
    channel: '구글',
    name: '유튜브 인스트림',
    impressions: 950_000,
    ctr: 0.9,
    cpc: 260,
    conversions: 150,
    revenue: 3_700_000,
  },
  {
    id: 'tiktok-spark',
    channel: '틱톡',
    name: '스파크 애즈',
    impressions: 540_000,
    ctr: 1.7,
    cpc: 200,
    conversions: 190,
    revenue: 3_900_000,
  },
  {
    id: 'tiktok-topview',
    channel: '틱톡',
    name: '탑뷰 캠페인',
    impressions: 310_000,
    ctr: 1.5,
    cpc: 230,
    conversions: 95,
    revenue: 1_600_000,
  },
];

/** Extract a single channel's daily series for one numeric field, in the {date,value} shape dateRange utils expect. */
export type MarketingDailyField = 'spend' | 'revenue' | 'impressions' | 'clicks' | 'conversions';

export function channelSeries(channel: MarketingChannel, field: MarketingDailyField): TimeSeriesPoint[] {
  return marketingDailySeries
    .filter((r) => r.channel === channel)
    .map((r) => ({ date: r.date, value: r[field] }));
}

function sumAcrossChannels(field: MarketingDailyField): TimeSeriesPoint[] {
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
