import { ChartCard } from '../ui/ChartCard';
import { formatNumber, formatPercent } from '../../lib/format';
import { getColorHex } from '../../lib/colors';
import type { InventoryRow } from '../../lib/types';

/** 상품명(rowspan)/변형명/수량/비중. No per-variant days-left here — see InventoryRow's variants
 *  doc comment for why (no per-color sales-velocity data before the 물류 API integration). */
export function VariantInventoryTable({ rows }: { rows: InventoryRow[] }) {
  return (
    <ChartCard title="변형별 입고 현황" subtitle="색상 변형 · 상품 합계 대비 비중">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-white/8 text-left">
              <th className="pb-2 pr-3 font-medium text-white/55">상품명</th>
              <th className="pb-2 pr-3 font-medium text-white/55">변형명</th>
              <th className="pb-2 pr-3 font-medium text-white/55">수량</th>
              <th className="pb-2 font-medium text-white/55">비중</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
              row.variants.map((variant, i) => (
                <tr key={`${row.product}-${variant.color}`} className="border-b border-white/8 last:border-b-0">
                  {i === 0 && (
                    <td rowSpan={row.variants.length} className="py-2.5 pr-3 align-top font-medium text-card-text">
                      {row.product}
                    </td>
                  )}
                  <td className="py-2.5 pr-3 text-white/70">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/15"
                        style={{ background: getColorHex(variant.color) }}
                      />
                      {variant.color}
                    </span>
                  </td>
                  <td className="num-mono py-2.5 pr-3 text-white/70">{formatNumber(variant.quantity)}개</td>
                  <td className="num-mono py-2.5 text-white/55">
                    {formatPercent(row.stock > 0 ? (variant.quantity / row.stock) * 100 : 0, 0)}
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
