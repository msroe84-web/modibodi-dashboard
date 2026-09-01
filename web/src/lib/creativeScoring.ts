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
 * conversions get cpa = Infinity, which naturally sorts to the worst CPA percentile, and are
 * always forced to 'replace' regardless of CTR (a creative that spent budget and converted
 * zero times is a replace candidate no matter how good its click-through rate looks).
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

  const ctrPercentile = averageRankPercentile(withMetrics, (m) => m.ctr, 'asc');
  const cpaPercentile = averageRankPercentile(withMetrics, (m) => m.cpa, 'desc');

  return withMetrics.map((c) => {
    const blended = ((ctrPercentile.get(c.id) ?? 0) + (cpaPercentile.get(c.id) ?? 0)) / 2;
    let grade: CreativeGrade = 'good';
    if (blended >= 1 - topPct) grade = 'best';
    else if (blended < bottomPct) grade = 'replace';
    if (!Number.isFinite(c.cpa)) grade = 'replace';
    return { id: c.id, ctr: c.ctr, cpa: c.cpa, grade };
  });
}

/**
 * Rank-percentile with ties averaged: equal values get the same percentile (the average of
 * the positions they'd span if broken apart), so identical/tied metrics land in the same
 * grade instead of being spuriously split purely by array order. Also handles two `Infinity`
 * values safely (treated as equal, not `Infinity - Infinity = NaN`).
 */
function averageRankPercentile<T extends { id: string }>(
  items: T[],
  metric: (item: T) => number,
  direction: 'asc' | 'desc',
): Map<string, number> {
  const n = items.length;
  const sorted = [...items].sort((a, b) => {
    const av = metric(a);
    const bv = metric(b);
    if (av === bv) return 0;
    return direction === 'asc' ? av - bv : bv - av;
  });

  const percentile = new Map<string, number>();
  let i = 0;
  while (i < n) {
    let j = i;
    while (j < n && metric(sorted[j]) === metric(sorted[i])) j++;
    const avgIndex = (i + j - 1) / 2;
    const p = n === 1 ? 1 : avgIndex / (n - 1);
    for (let k = i; k < j; k++) percentile.set(sorted[k].id, p);
    i = j;
  }
  return percentile;
}
