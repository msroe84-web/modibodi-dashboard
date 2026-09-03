import { ChartCard } from '../ui/ChartCard';
import { formatKRW, formatNumber, formatPercent, formatRoas } from '../../lib/format';
import type { CampaignRow } from '../../lib/types';

/** Only impressions/ctr/cpc/conversions/revenue come from the row itself — clicks/spend/cpa/roas
 *  are computed here every render so they can never disagree with the fields they're built from. */
function deriveCampaignStats(row: CampaignRow) {
  const clicks = Math.round(row.impressions * (row.ctr / 100));
  const spend = Math.round(clicks * row.cpc);
  const cpa = row.conversions > 0 ? spend / row.conversions : 0;
  const roas = spend > 0 ? row.revenue / spend : 0;
  return { clicks, spend, cpa, roas };
}

export function CampaignPerformanceTable({ rows }: { rows: CampaignRow[] }) {
  const sorted = [...rows].sort((a, b) => b.revenue - a.revenue);

  return (
    <ChartCard title="캠페인 성과" subtitle="채널별 캠페인 · 누적 기준">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-white/8 text-left">
              <th className="pb-2 pr-3 font-medium text-white/55">채널</th>
              <th className="pb-2 pr-3 font-medium text-white/55">캠페인</th>
              <th className="pb-2 pr-3 font-medium text-white/55">노출수</th>
              <th className="pb-2 pr-3 font-medium text-white/55">CTR</th>
              <th className="pb-2 pr-3 font-medium text-white/55">클릭수</th>
              <th className="pb-2 pr-3 font-medium text-white/55">CPC</th>
              <th className="pb-2 pr-3 font-medium text-white/55">광고비</th>
              <th className="pb-2 pr-3 font-medium text-white/55">구매수</th>
              <th className="pb-2 pr-3 font-medium text-white/55">CPA</th>
              <th className="pb-2 pr-3 font-medium text-white/55">매출</th>
              <th className="pb-2 font-medium text-white/55">ROAS</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const { clicks, spend, cpa, roas } = deriveCampaignStats(row);
              return (
                <tr key={row.id} className="border-b border-white/8 last:border-b-0">
                  <td className="py-2.5 pr-3 text-white/60">{row.channel}</td>
                  <td className="py-2.5 pr-3 font-medium text-card-text">{row.name}</td>
                  <td className="num-mono py-2.5 pr-3 text-white/70">{formatNumber(row.impressions)}</td>
                  <td className="num-mono py-2.5 pr-3 text-white/70">{formatPercent(row.ctr)}</td>
                  <td className="num-mono py-2.5 pr-3 text-white/70">{formatNumber(clicks)}</td>
                  <td className="num-mono py-2.5 pr-3 text-white/55">{formatKRW(row.cpc)}</td>
                  <td className="num-mono py-2.5 pr-3 text-white/70">{formatKRW(spend)}</td>
                  <td className="num-mono py-2.5 pr-3 text-white/70">{formatNumber(row.conversions)}</td>
                  <td className="num-mono py-2.5 pr-3 text-white/55">{formatKRW(cpa)}</td>
                  <td className="num-mono py-2.5 pr-3 font-semibold text-card-text">{formatKRW(row.revenue)}</td>
                  <td className={`num-mono py-2.5 font-semibold ${roas < 1 ? 'text-card-critical' : 'text-card-text'}`}>
                    {formatRoas(roas)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
