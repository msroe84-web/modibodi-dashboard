import { useMemo } from 'react';
import { ChartCard } from '../ui/ChartCard';
import { useSettings } from '../../context/SettingsContext';
import { formatKRW, formatNumber, formatPercent } from '../../lib/format';
import { inventory, productSales } from '../../data/mockOverview';
import { mergeProductData } from './mergeProductData';

function formatDays(days: number): string {
  if (!Number.isFinite(days)) return '-';
  return `${days.toFixed(1)}일`;
}

export function MdTab() {
  const { settings } = useSettings();

  const rows = useMemo(
    () => mergeProductData(productSales, settings.pricing, inventory).sort((a, b) => b.revenue - a.revenue),
    [settings.pricing],
  );

  const totalSkus = rows.length;
  const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
  const totalUnits = rows.reduce((sum, r) => sum + r.units, 0);
  const totalCost = rows.reduce((sum, r) => sum + r.cost * r.units, 0);
  const blendedMarginPct = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[20px] font-extrabold text-ink">MD·상품</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <ChartCard title="SKU 수">
          <p className="num-mono text-[26px] font-bold text-[var(--card-silver)]">{formatNumber(totalSkus)}</p>
        </ChartCard>
        <ChartCard title="합계 판매수량">
          <p className="num-mono text-[26px] font-bold text-card-text">{formatNumber(totalUnits)}개</p>
        </ChartCard>
        <ChartCard title="합계 매출">
          <p className="num-mono text-[22px] font-bold text-card-text">{formatKRW(totalRevenue)}</p>
        </ChartCard>
        <ChartCard title="가중평균 마진율">
          <p className="num-mono text-[26px] font-bold text-[var(--card-silver)]">{formatPercent(blendedMarginPct)}</p>
        </ChartCard>
      </div>

      <ChartCard title="상품별 통합 현황" subtitle="매출·원가·재고 데이터를 상품명 기준으로 merge (매출 내림차순)">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-white/8 text-left text-[12px] font-medium text-white/55">
                <th className="py-2 pr-3 font-medium">상품명</th>
                <th className="px-3 py-2 text-right font-medium">판매수량</th>
                <th className="px-3 py-2 text-right font-medium">매출</th>
                <th className="px-3 py-2 text-right font-medium">판매가</th>
                <th className="px-3 py-2 text-right font-medium">원가</th>
                <th className="px-3 py-2 text-right font-medium">마진율</th>
                <th className="px-3 py-2 text-right font-medium">재고</th>
                <th className="px-3 py-2 text-right font-medium">일평균판매</th>
                <th className="py-2 pl-3 text-right font-medium">소진 예상</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.product} className="border-b border-white/8 last:border-0">
                  <td className="py-2.5 pr-3 font-medium text-card-text">{row.product}</td>
                  <td className="num-mono px-3 py-2.5 text-right text-white/70">{formatNumber(row.units)}개</td>
                  <td className="num-mono px-3 py-2.5 text-right text-card-text">{formatKRW(row.revenue)}</td>
                  <td className="num-mono px-3 py-2.5 text-right text-white/70">{formatKRW(row.price)}</td>
                  <td className="num-mono px-3 py-2.5 text-right text-white/55">{formatKRW(row.cost)}</td>
                  <td className="num-mono px-3 py-2.5 text-right text-[var(--card-silver)]">
                    {formatPercent(row.marginPct)}
                  </td>
                  <td className="num-mono px-3 py-2.5 text-right text-white/70">{formatNumber(row.stock)}개</td>
                  <td className="num-mono px-3 py-2.5 text-right text-white/55">{formatNumber(row.avgDailySales)}개</td>
                  <td
                    className={`num-mono py-2.5 pl-3 text-right font-medium ${
                      row.daysOfStockLeft <= 14 ? 'text-[var(--card-critical)]' : 'text-white/70'
                    }`}
                  >
                    {formatDays(row.daysOfStockLeft)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
