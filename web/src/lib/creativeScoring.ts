import type { AdCreativeRow, CreativeGrade } from './types';

export interface CreativeScore {
  id: string;
  ctr: number;
  cpa: number;
  grade: CreativeGrade;
}

const DEFAULT_TOP_PCT = 0.2;
const DEFAULT_BOTTOM_PCT = 0.2;

/**
 * Grades creatives by a blended CTR/CPA percentile: CTR ranked ascending (higher = better),
 * CPA ranked descending (lower = better, so the worst/highest CPA gets percentile 0). Each
 * creative's blended percentile is the average of its two rank-percentiles. Top `topPct` ->
 * 'best', bottom `bottomPct` -> 'replace', everything else -> 'good'. Creatives with zero
 * conversions get cpa = Infinity, which naturally sorts to the worst CPA percentile.
 */
export function rankCreatives(
  creatives: AdCreativeRow[],
  opts: { topPct?: number; bottomPct?: number } = {},
): CreativeScore[] {
  const topPct = opts.topPct ?? DEFAULT_TOP_PCT;
  const bottomPct = opts.bottomPct ?? DEFAULT_BOTTOM_PCT;

  const withMetrics = creatives.map((c) => ({
    id: c.id,
    ctr: c.impressions > 0 ? c.clicks / c.impressions : 0,
    cpa: c.conversions > 0 ? c.spend / c.conversions : Infinity,
  }));

  const n = withMetrics.length;
  if (n === 0) return [];

  const byCtrAsc = [...withMetrics].sort((a, b) => a.ctr - b.ctr);
  const byCpaDesc = [...withMetrics].sort((a, b) => b.cpa - a.cpa);

  const ctrPercentile = new Map<string, number>();
  byCtrAsc.forEach((c, i) => ctrPercentile.set(c.id, n === 1 ? 1 : i / (n - 1)));

  const cpaPercentile = new Map<string, number>();
  byCpaDesc.forEach((c, i) => cpaPercentile.set(c.id, n === 1 ? 1 : i / (n - 1)));

  return withMetrics.map((c) => {
    const blended = ((ctrPercentile.get(c.id) ?? 0) + (cpaPercentile.get(c.id) ?? 0)) / 2;
    let grade: CreativeGrade = 'good';
    if (blended >= 1 - topPct) grade = 'best';
    else if (blended < bottomPct) grade = 'replace';
    return { id: c.id, ctr: c.ctr, cpa: c.cpa, grade };
  });
}
