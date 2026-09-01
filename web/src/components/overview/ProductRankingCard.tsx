import { ChartCard } from '../ui/ChartCard';
import { formatKRW, formatNumber } from '../../lib/format';
import type { ProductSalesRow } from '../../lib/types';

export function ProductRankingCard({ rows }: { rows: ProductSalesRow[] }) {
  const sorted = [...rows].sort((a, b) => b.revenue - a.revenue);
  const max = sorted[0]?.revenue ?? 1;

  return (
    <ChartCard title="상품 순위" subtitle="선택 기간 매출 기준">
      <ul className="space-y-3.5">
        {sorted.map((row, i) => (
          <li key={row.product}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-[13px]">
              <span className="flex min-w-0 items-center gap-2">
                <span className="w-4 shrink-0 num-mono text-[11.5px] font-bold text-white/40">{i + 1}</span>
                <span className="truncate font-medium text-card-text">{row.product}</span>
              </span>
              <span className="num-mono shrink-0 text-[12.5px] text-white/55">
                {formatKRW(row.revenue)} · {formatNumber(row.units)}개
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[var(--card-silver)]"
                style={{ width: `${(row.revenue / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
