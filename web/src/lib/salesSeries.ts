import { channelRevenueSeries as mockChannelRevenueSeries } from '../data/mockOverview';
import type { RealChannelRevenueRow } from './dashboardApi';
import type { TimeSeriesPoint } from './dateRange';
import type { ChannelRevenuePoint } from './types';

/** Merges real per-channel daily revenue (from the Apps Script backend, currently 자사몰/Cafe24
 *  only) over the mock series by (channel, date) key — same rationale as marketingSeries.ts's
 *  mergeMarketingDaily: real values win where synced, mock fills everything else so channels
 *  without automation yet (무신사/29CM/W컨셉/카카오/스마트스토어) still render. */
export function mergeChannelRevenue(realRows: RealChannelRevenueRow[]): ChannelRevenuePoint[] {
  const realByKey = new Map(realRows.map((r) => [`${r.channel}|${r.date}`, r]));
  const merged = mockChannelRevenueSeries.map((mockRow) => realByKey.get(`${mockRow.channel}|${mockRow.date}`) ?? mockRow);
  const mockKeys = new Set(mockChannelRevenueSeries.map((r) => `${r.channel}|${r.date}`));
  const extra = realRows.filter((r) => !mockKeys.has(`${r.channel}|${r.date}`));
  return [...merged, ...extra];
}

export function totalRevenueSeriesFrom(rows: ChannelRevenuePoint[]): TimeSeriesPoint[] {
  const byDate = new Map<string, number>();
  for (const row of rows) byDate.set(row.date, (byDate.get(row.date) ?? 0) + row.revenue);
  return Array.from(byDate.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
