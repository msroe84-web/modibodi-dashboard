import { ChartCard } from '../ui/ChartCard';
import { formatKRW, formatNumber, formatPercent } from '../../lib/format';
import type { ProductSalesRow } from '../../lib/types';

export function ProductPerformanceTable({ rows }: { rows: ProductSalesRow[] }) {
  const sorted = [...rows].sort((a, b) => b.revenue - a.revenue);

  return (
    <ChartCard title="상품 성과" subtitle="판매수량·매출은 선택 기간 기준 · 전환율은 누적">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-white/8 text-left">
              <th className="pb-2 pr-3 font-medium text-white/55">상품명</th>
              <th className="pb-2 pr-3 font-medium text-white/55">판매수량</th>
              <th className="pb-2 pr-3 font-medium text-white/55">객단가</th>
              <th className="pb-2 pr-3 font-medium text-white/55">매출</th>
              <th className="pb-2 font-medium text-white/55">전환율</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const avgPrice = row.units > 0 ? row.revenue / row.units : 0;
              return (
                <tr key={row.product} className="border-b border-white/8 last:border-b-0">
                  <td className="py-2.5 pr-3">
                    <span className="font-medium text-card-text">{row.product}</span>
                    <span className="ml-1.5 text-[11px] text-white/35">{row.code}</span>
                  </td>
                  <td className="num-mono py-2.5 pr-3 text-white/70">{formatNumber(row.units)}개</td>
                  <td className="num-mono py-2.5 pr-3 text-white/70">{formatKRW(avgPrice)}</td>
                  <td className="num-mono py-2.5 pr-3 font-semibold text-card-text">{formatKRW(row.revenue)}</td>
                  <td className="num-mono py-2.5 text-white/55">{formatPercent(row.conversionRate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="py-4 text-center text-[12.5px] text-white/40">데이터가 없습니다</p>}
    </ChartCard>
  );
}
