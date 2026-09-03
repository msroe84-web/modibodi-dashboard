import { marketingDailySeries as mockMarketingDailySeries, type ChannelDailyMetrics, type MarketingChannel } from '../data/mockMarketing';
import type { RealMarketingDailyRow } from './dashboardApi';
import type { TimeSeriesPoint } from './dateRange';

type Field = 'spend' | 'revenue' | 'impressions' | 'clicks' | 'conversions';

/** Merges real daily rows (from the Apps Script backend) over the mock series by (channel, date)
 *  key — real values win where present, mock fills every day/channel not yet synced. This keeps
 *  charts fully populated while automation for a given channel is partial (e.g. only recent days
 *  have synced, or only Meta is wired up so far) instead of showing holes. */
export function mergeMarketingDaily(realRows: RealMarketingDailyRow[]): ChannelDailyMetrics[] {
  const realByKey = new Map(realRows.map((r) => [`${r.channel}|${r.date}`, r]));
  // Field-level merge (real values win per-field where present, mock fills the rest) rather than
  // swapping in the whole real row — a real row synced before every field is wired up (e.g.
  // impressions arriving later than spend/clicks) would otherwise silently blank out the fields
  // it doesn't carry yet instead of falling back to mock for just those.
  const merged = mockMarketingDailySeries.map((mockRow) => {
    const real = realByKey.get(`${mockRow.channel}|${mockRow.date}`);
    return real ? { ...mockRow, ...real } : mockRow;
  });
  const mockKeys = new Set(mockMarketingDailySeries.map((r) => `${r.channel}|${r.date}`));
  const extra: ChannelDailyMetrics[] = realRows
    .filter((r) => !mockKeys.has(`${r.channel}|${r.date}`))
    .map((r) => ({ ...r, impressions: r.impressions ?? 0 }));
  return [...merged, ...extra];
}

export function channelSeriesFrom(rows: ChannelDailyMetrics[], channel: MarketingChannel, field: Field): TimeSeriesPoint[] {
  return rows.filter((r) => r.channel === channel).map((r) => ({ date: r.date, value: r[field] }));
}

function sumAcrossChannels(rows: ChannelDailyMetrics[], field: Field): TimeSeriesPoint[] {
  const byDate = new Map<string, number>();
  for (const row of rows) byDate.set(row.date, (byDate.get(row.date) ?? 0) + row[field]);
  return Array.from(byDate.entries()).map(([date, value]) => ({ date, value }));
}

export function totalAdSpendSeriesFrom(rows: ChannelDailyMetrics[]): TimeSeriesPoint[] {
  return sumAcrossChannels(rows, 'spend');
}

export function totalAttributedRevenueSeriesFrom(rows: ChannelDailyMetrics[]): TimeSeriesPoint[] {
  return sumAcrossChannels(rows, 'revenue');
}

export function totalConversionsSeriesFrom(rows: ChannelDailyMetrics[]): TimeSeriesPoint[] {
  return sumAcrossChannels(rows, 'conversions');
}

/** Daily blended ROAS/CPA, zipped from the totals above by index — see mockMarketing.ts note on
 *  why headline totals should be sum(revenue)/sum(spend) over a range, not averaged per-day ratios. */
export function totalRoasSeriesFrom(spendSeries: TimeSeriesPoint[], revenueSeries: TimeSeriesPoint[]): TimeSeriesPoint[] {
  return spendSeries.map((p, i) => {
    const revenue = revenueSeries[i]?.value ?? 0;
    return { date: p.date, value: p.value > 0 ? revenue / p.value : 0 };
  });
}

export function totalCpaSeriesFrom(spendSeries: TimeSeriesPoint[], conversionsSeries: TimeSeriesPoint[]): TimeSeriesPoint[] {
  return spendSeries.map((p, i) => {
    const conversions = conversionsSeries[i]?.value ?? 0;
    return { date: p.date, value: conversions > 0 ? p.value / conversions : 0 };
  });
}
