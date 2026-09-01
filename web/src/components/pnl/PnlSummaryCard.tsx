import { GradientCard } from '../ui/GradientCard';
import { formatCompactKRW, formatPercent } from '../../lib/format';
import type { PnlTotals } from './pnlMath';

export function PnlSummaryCard({ totals }: { totals: PnlTotals }) {
  const hasUnfinalized = totals.unfinalizedChannels.length > 0;

  return (
    <GradientCard radius={28} padding="p-5" className="card-shadow">
      <p className="text-[11.5px] font-semibold uppercase tracking-wide text-white/45">손익 요약</p>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-[12.5px] text-white/55">총 매출</p>
          <p className="num-mono mt-1 text-[22px] font-bold text-card-text">{formatCompactKRW(totals.revenue)}</p>
        </div>
        <div>
          <p className="text-[12.5px] text-white/55">총 원가(추정)</p>
          <p className="num-mono mt-1 text-[22px] font-bold text-card-text">{formatCompactKRW(totals.cost)}</p>
        </div>
        <div>
          <p className="text-[12.5px] text-white/55">순이익 (확정 채널 기준)</p>
          <p
            className={`num-mono mt-1 text-[22px] font-bold ${totals.netProfit >= 0 ? 'text-card-good' : 'text-card-critical'}`}
          >
            {formatCompactKRW(totals.netProfit)}
          </p>
        </div>
        <div>
          <p className="text-[12.5px] text-white/55">순이익율 (확정 채널 기준)</p>
          <p className="num-mono mt-1 text-[22px] font-bold text-card-text">{formatPercent(totals.netMarginPct)}</p>
        </div>
      </div>
      {hasUnfinalized && (
        <p className="mt-4 text-[12px] text-card-warning">
          {totals.unfinalizedChannels.join(', ')} 채널은 수수료율이 미확정이라 순이익/순이익율 계산에서 제외되었습니다.
        </p>
      )}
    </GradientCard>
  );
}
