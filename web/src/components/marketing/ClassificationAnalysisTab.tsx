import { useMemo } from 'react';
import { ChartCard } from '../ui/ChartCard';
import { formatKRW, formatNumber, formatPercent, formatRoas } from '../../lib/format';
import { campaigns } from '../../data/mockMarketing';
import { mockAdCreatives } from '../../data/mockAdCreatives';
import type { AdCreativeRow, CreativeFormat } from '../../lib/types';

interface GroupStats {
  key: string;
  label: string;
  count: number;
  spend: number;
  revenue: number;
  clicks: number;
  impressions: number;
  conversions: number;
}

function groupBy(rows: AdCreativeRow[], keyOf: (row: AdCreativeRow) => string, labelOf: (key: string) => string): GroupStats[] {
  const map = new Map<string, GroupStats>();
  for (const row of rows) {
    const key = keyOf(row);
    const existing = map.get(key) ?? {
      key,
      label: labelOf(key),
      count: 0,
      spend: 0,
      revenue: 0,
      clicks: 0,
      impressions: 0,
      conversions: 0,
    };
    existing.count += 1;
    existing.spend += row.spend;
    existing.revenue += row.revenue;
    existing.clicks += row.clicks;
    existing.impressions += row.impressions;
    existing.conversions += row.conversions;
    map.set(key, existing);
  }
  return [...map.values()].sort((a, b) => b.spend - a.spend);
}

function GroupTable({ title, subtitle, groups }: { title: string; subtitle: string; groups: GroupStats[] }) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-white/8 text-left">
              <th className="pb-2 pr-3 font-medium text-white/55">구분</th>
              <th className="pb-2 pr-3 font-medium text-white/55">소재수</th>
              <th className="pb-2 pr-3 font-medium text-white/55">지출</th>
              <th className="pb-2 pr-3 font-medium text-white/55">매출</th>
              <th className="pb-2 pr-3 font-medium text-white/55">CTR</th>
              <th className="pb-2 font-medium text-white/55">ROAS</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.key} className="border-b border-white/8 last:border-b-0">
                <td className="py-2.5 pr-3 font-medium text-card-text">{g.label}</td>
                <td className="num-mono py-2.5 pr-3 text-white/60">{formatNumber(g.count)}개</td>
                <td className="num-mono py-2.5 pr-3 text-white/70">{formatKRW(g.spend)}</td>
                <td className="num-mono py-2.5 pr-3 text-white/70">{formatKRW(g.revenue)}</td>
                <td className="num-mono py-2.5 pr-3 text-white/55">
                  {formatPercent(g.impressions > 0 ? (g.clicks / g.impressions) * 100 : 0, 2)}
                </td>
                <td className="num-mono py-2.5 font-semibold text-card-text">
                  {formatRoas(g.spend > 0 ? g.revenue / g.spend : 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

const FORMAT_LABEL: Record<CreativeFormat, string> = { image: '이미지', video: '영상', carousel: '캐러셀' };

/** Breakdowns use only fields that actually exist on AdCreativeRow — format and campaign. No
 *  채널 breakdown: every creative here is Meta, so that dimension doesn't exist to analyze by. */
export function ClassificationAnalysisTab() {
  const campaignLabel = useMemo(() => new Map(campaigns.map((c) => [c.id, c.name])), []);

  const byFormat = useMemo(
    () => groupBy(mockAdCreatives, (r) => r.format, (key) => FORMAT_LABEL[key as CreativeFormat] ?? key),
    [],
  );
  const byCampaign = useMemo(
    () => groupBy(mockAdCreatives, (r) => r.campaignId, (key) => campaignLabel.get(key) ?? key),
    [campaignLabel],
  );

  return (
    <div className="space-y-4">
      <GroupTable title="포맷별 분석" subtitle="이미지 · 영상 · 캐러셀" groups={byFormat} />
      <GroupTable title="캠페인별 분석" subtitle="소재가 속한 캠페인 기준" groups={byCampaign} />
    </div>
  );
}
