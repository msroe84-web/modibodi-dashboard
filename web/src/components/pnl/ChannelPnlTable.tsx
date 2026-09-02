import { HelpCircleIcon } from 'lucide-react';
import { ChartCard } from '../ui/ChartCard';
import { formatKRW, formatPercent } from '../../lib/format';
import type { ChannelPnlRow } from './pnlMath';

export function ChannelPnlTable({ rows }: { rows: ChannelPnlRow[] }) {
  return (
    <ChartCard
      title="채널별 손익"
      subtitle="원가는 상품 판매 데이터 기반 추정 원가율(전 채널 동일 적용)이며, 실제 채널별 원가와는 차이가 있을 수 있습니다"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-card-hairline text-left text-[11px] font-semibold uppercase tracking-wide text-white/40">
              <th className="pb-2 pr-3">채널</th>
              <th className="pb-2 pr-3 text-right">매출</th>
              <th className="pb-2 pr-3 text-right">수수료</th>
              <th className="pb-2 pr-3 text-right">원가(추정)</th>
              <th className="pb-2 text-right">순이익</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.channel} className="border-b border-card-hairline/60 last:border-0">
                <td className="py-2.5 pr-3 font-medium text-card-text">{row.channel}</td>
                <td className="py-2.5 pr-3 text-right num-mono text-white/80">{formatKRW(row.revenue)}</td>
                <td className="py-2.5 pr-3 text-right num-mono">
                  {row.isFeeFinalized ? (
                    <span className="text-white/80">
                      {formatKRW(row.fee ?? 0)}{' '}
                      <span className="text-white/40">({formatPercent((row.feeRate ?? 0) * 100)})</span>
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 font-semibold text-card-warning"
                      title="수수료율 미확정 — 확정 전까지 원가/순이익 계산에서 제외됩니다"
                    >
                      미확정
                      <HelpCircleIcon size={13} strokeWidth={2.5} />
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-3 text-right num-mono text-white/80">{formatKRW(row.cost)}</td>
                <td className="py-2.5 text-right num-mono font-semibold">
                  {row.isFeeFinalized ? (
                    <span className={(row.netProfit ?? 0) >= 0 ? 'text-card-good' : 'text-card-critical'}>
                      {formatKRW(row.netProfit ?? 0)}
                    </span>
                  ) : (
                    <span className="text-card-warning">확정 필요</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
