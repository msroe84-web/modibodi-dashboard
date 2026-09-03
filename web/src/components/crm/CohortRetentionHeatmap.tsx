import { InfoIcon } from 'lucide-react';
import { ChartCard } from '../ui/ChartCard';
import type { CohortRow } from '../../data/mockCrm';

/** Demo/skeleton only — there's no real repurchase history before launch, so every cell here is
 *  a plausible placeholder. Always shows the "실데이터로 교체 예정" notice so it never reads as
 *  a real measurement. Cell fill blends --card-good with the value's intensity via color-mix(),
 *  so it follows the light/dark theme token automatically instead of a hardcoded RGB. */
export function CohortRetentionHeatmap({ rows, monthLabels }: { rows: CohortRow[]; monthLabels: string[] }) {
  return (
    <ChartCard title="코호트 리텐션" subtitle="가입월 기준 · 월별 재구매율">
      <div className="mb-3 flex items-start gap-2 rounded-lg border border-card-info/25 bg-card-info/10 px-3 py-2 text-[11.5px] text-white/60">
        <InfoIcon size={14} className="mt-0.5 shrink-0 text-card-info" />
        <span>데모용 임시 데이터입니다. 카페24 연동 후 실데이터로 교체 예정입니다.</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="pb-2 pr-3 text-left font-medium text-white/55">가입월</th>
              {monthLabels.map((label) => (
                <th key={label} className="pb-2 px-1 text-center font-medium text-white/55">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.cohortLabel}>
                <td className="py-1 pr-3 font-medium text-card-text">{row.cohortLabel}</td>
                {row.retentionPct.map((pct, i) => (
                  <td key={i} className="p-1">
                    {pct === null ? (
                      <div className="h-9 rounded-md bg-white/[0.03]" />
                    ) : (
                      <div
                        className="flex h-9 items-center justify-center rounded-md text-[11.5px] font-semibold text-card-text"
                        style={{ background: `color-mix(in srgb, var(--card-good) ${pct}%, transparent)` }}
                      >
                        {pct.toFixed(0)}%
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
