import { useMemo } from 'react';
import { AlertTriangleIcon, PackageIcon } from 'lucide-react';
import { GradientCard } from '../ui/GradientCard';
import { ChartCard } from '../ui/ChartCard';
import { VariantInventoryTable } from './VariantInventoryTable';
import { useSettings } from '../../context/SettingsContext';
import { formatNumber } from '../../lib/format';
import { inventory } from '../../data/mockOverview';
import { buildInventoryStatus, countLowStock, sumStock } from './inventoryMath';

export function InventoryTab() {
  const { settings } = useSettings();

  const rows = useMemo(
    () => buildInventoryStatus(inventory, settings.reorderThreshold),
    [settings.reorderThreshold],
  );
  const totalStock = useMemo(() => sumStock(inventory), []);
  const lowStockCount = useMemo(() => countLowStock(rows), [rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[20px] font-extrabold text-ink">재고</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <GradientCard radius={22} padding="p-4" className="card-shadow">
          <div className="flex items-start justify-between gap-2">
            <p className="whitespace-nowrap text-[12.5px] font-medium text-white/55">총 재고 수량</p>
            <PackageIcon size={16} className="shrink-0 text-card-silver" />
          </div>
          <div className="mt-2">
            <span className="num-mono text-[22px] font-bold text-card-text">{formatNumber(totalStock)}개</span>
          </div>
        </GradientCard>

        <GradientCard radius={22} padding="p-4" className="card-shadow">
          <div className="flex items-start justify-between gap-2">
            <p className="whitespace-nowrap text-[12.5px] font-medium text-white/55">소진임박 상품 수</p>
            <AlertTriangleIcon size={16} className={`shrink-0 ${lowStockCount > 0 ? 'text-card-critical' : 'text-card-silver'}`} />
          </div>
          <div className="mt-2">
            <span
              className={`num-mono text-[22px] font-bold ${lowStockCount > 0 ? 'text-card-critical' : 'text-card-text'}`}
            >
              {formatNumber(lowStockCount)}개
            </span>
          </div>
        </GradientCard>
      </div>

      <ChartCard title="상품별 재고 현황" subtitle="재고 수량 · 일평균 판매속도 · 예상 소진일수">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-white/8 text-left">
                <th className="pb-2 pr-3 font-medium text-white/55">상품명</th>
                <th className="pb-2 pr-3 font-medium text-white/55">현재 재고</th>
                <th className="pb-2 pr-3 font-medium text-white/55">일평균 판매속도</th>
                <th className="pb-2 pr-3 font-medium text-white/55">예상 소진일수</th>
                <th className="pb-2 font-medium text-white/55">재주문 기준</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.product}
                  className={`border-b border-white/8 last:border-b-0 ${row.isLowStock ? 'bg-card-critical/8' : ''}`}
                >
                  <td className={`py-2.5 pr-3 font-medium ${row.isLowStock ? 'text-card-critical' : 'text-card-text'}`}>
                    {row.product}
                  </td>
                  <td className={`num-mono py-2.5 pr-3 ${row.isLowStock ? 'text-card-critical' : 'text-card-text'}`}>
                    {formatNumber(row.stock)}개
                  </td>
                  <td className="num-mono py-2.5 pr-3 text-white/55">{formatNumber(row.avgDailySales)}개/일</td>
                  <td className={`num-mono py-2.5 pr-3 ${row.isLowStock ? 'text-card-critical' : 'text-card-text'}`}>
                    {Number.isFinite(row.daysLeft) ? `약 ${formatNumber(row.daysLeft)}일` : '-'}
                  </td>
                  <td className="num-mono py-2.5 text-white/55">
                    {row.threshold !== undefined ? `${formatNumber(row.threshold)}개` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <VariantInventoryTable rows={inventory} />
    </div>
  );
}
