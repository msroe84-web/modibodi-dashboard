import type { AppSettings } from '../../context/settingsDefaults';
import type { ProductSalesRow } from '../../lib/types';

export interface ChannelPnlRow {
  channel: string;
  /** aggregated revenue for the selected date range */
  revenue: number;
  /**
   * "확정 여부" flag, tracked explicitly and separately from `feeRate` itself —
   * derived as `settings.feeRates[channel] !== null`, but kept as its own named
   * field (not just inferred inline at render time) so finalized/unfinalized
   * state is a first-class, inspectable concept.
   */
  isFeeFinalized: boolean;
  /** raw commission rate, 0-1 fraction. null = 미확정 (not yet finalized) */
  feeRate: number | null;
  /** revenue * feeRate. null when the rate isn't finalized. */
  fee: number | null;
  /** blended COGS ratio applied to this channel's revenue (see computeBlendedCogsRatio) */
  cogsRatio: number;
  /** estimated cost = revenue * cogsRatio. Always computed, regardless of fee finalization. */
  cost: number;
  /** revenue - fee - cost. null when the fee rate isn't finalized (fee is unknown). */
  netProfit: number | null;
}

export interface PnlTotals {
  /** total revenue across all channels */
  revenue: number;
  /** total fee across finalized channels only */
  fee: number;
  /** total estimated cost across all channels */
  cost: number;
  /** total net profit across finalized channels only */
  netProfit: number;
  /** revenue of only the finalized channels (the denominator for netMarginPct) */
  finalizedRevenue: number;
  /** blended net margin %, computed over finalized-channel revenue only */
  netMarginPct: number;
  /** channels excluded from fee/netProfit totals because their rate isn't finalized */
  unfinalizedChannels: string[];
}

/**
 * Blended COGS ratio = sum(units * unit cost) / sum(revenue), derived from
 * mockOverview.productSales + settings.pricing. There is no channel×product
 * revenue breakdown in the mock data, so this single blended ratio is applied
 * uniformly to every channel's revenue as an estimated cost — an approximation,
 * not a per-channel actual.
 */
export function computeBlendedCogsRatio(
  productSales: ProductSalesRow[],
  pricing: AppSettings['pricing'],
): number {
  let totalCost = 0;
  let totalRevenue = 0;
  for (const row of productSales) {
    const unitCost = pricing[row.product]?.cost ?? 0;
    totalCost += row.units * unitCost;
    totalRevenue += row.revenue;
  }
  return totalRevenue > 0 ? totalCost / totalRevenue : 0;
}

/** Builds one channel's P&L row from its aggregated revenue, its fee rate, and the blended COGS ratio. */
export function computeChannelPnlRow(
  channel: string,
  revenue: number,
  feeRate: number | null,
  cogsRatio: number,
): ChannelPnlRow {
  const isFeeFinalized = feeRate !== null;
  const fee = isFeeFinalized ? revenue * feeRate : null;
  const cost = revenue * cogsRatio;
  const netProfit = isFeeFinalized ? revenue - (fee as number) - cost : null;
  return { channel, revenue, isFeeFinalized, feeRate, fee, cogsRatio, cost, netProfit };
}

export function computePnlTotals(rows: ChannelPnlRow[]): PnlTotals {
  const revenue = rows.reduce((acc, r) => acc + r.revenue, 0);
  const cost = rows.reduce((acc, r) => acc + r.cost, 0);

  const finalizedRows = rows.filter((r) => r.isFeeFinalized);
  const finalizedRevenue = finalizedRows.reduce((acc, r) => acc + r.revenue, 0);
  const fee = finalizedRows.reduce((acc, r) => acc + (r.fee ?? 0), 0);
  const netProfit = finalizedRows.reduce((acc, r) => acc + (r.netProfit ?? 0), 0);
  const netMarginPct = finalizedRevenue > 0 ? (netProfit / finalizedRevenue) * 100 : 0;

  const unfinalizedChannels = rows.filter((r) => !r.isFeeFinalized).map((r) => r.channel);

  return { revenue, fee, cost, netProfit, finalizedRevenue, netMarginPct, unfinalizedChannels };
}
