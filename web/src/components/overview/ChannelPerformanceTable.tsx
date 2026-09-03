import { ChartCard } from '../ui/ChartCard';
import { formatKRW, formatNumber, formatPercent, formatRoas } from '../../lib/format';

export interface ChannelPerformanceRow {
  channel: string;
  spend: number;
  revenue: number;
  roas: number;
  cpc: number;
  ctr: number;
}

export function ChannelPerformanceTable({ rows }: { rows: ChannelPerformanceRow[] }) {
  const sorted = [...rows].sort((a, b) => b.revenue - a.revenue);

  return (
    <ChartCard title="채널 성과" subtitle="선택 기간 기준">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-white/8 text-left">
              <th className="pb-2 pr-3 font-medium text-white/55">채널</th>
              <th className="pb-2 pr-3 font-medium text-white/55">광고비</th>
              <th className="pb-2 pr-3 font-medium text-white/55">기여 매출</th>
              <th className="pb-2 pr-3 font-medium text-white/55">ROAS</th>
              <th className="pb-2 pr-3 font-medium text-white/55">CPC</th>
              <th className="pb-2 font-medium text-white/55">CTR</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.channel} className="border-b border-white/8 last:border-b-0">
                <td className="py-2.5 pr-3 font-medium text-card-text">{row.channel}</td>
                <td className="num-mono py-2.5 pr-3 text-white/70">{formatKRW(row.spend)}</td>
                <td className="num-mono py-2.5 pr-3 text-white/70">{formatKRW(row.revenue)}</td>
                <td
                  className={`num-mono py-2.5 pr-3 font-semibold ${
                    row.roas < 1 ? 'text-card-critical' : 'text-card-text'
                  }`}
                >
                  {formatRoas(row.roas)}
                </td>
                <td className="num-mono py-2.5 pr-3 text-white/55">{formatKRW(row.cpc)}</td>
                <td className="num-mono py-2.5 text-white/55">{formatPercent(row.ctr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="py-4 text-center text-[12.5px] text-white/40">데이터가 없습니다</p>}
      <p className="mt-2 text-[11px] text-white/35">{formatNumber(rows.length)}개 채널 · CPC/CTR은 노출·클릭 합산 기준</p>
    </ChartCard>
  );
}
