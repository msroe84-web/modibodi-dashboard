import { ChartCard } from '../ui/ChartCard';
import { formatPercent } from '../../lib/format';
import type { LifecycleStage } from '../../data/mockCrm';

const SERIES_VARS = ['--card-series-1', '--card-series-2', '--card-series-3', '--card-series-4', '--card-series-5', '--card-series-6'];

/** Non-overlapping snapshot split of the whole customer base by lifecycle stage (sums to 100%) —
 *  a single segmented bar rather than a sequential funnel, since VIP/휴면 are end states, not
 *  subsets of 재구매. */
export function LifecycleFunnelCard({ stages }: { stages: LifecycleStage[] }) {
  return (
    <ChartCard title="고객 라이프사이클" subtitle="스냅샷 기준 · 비중 합 100%">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/10">
        {stages.map((stage, i) => (
          <div
            key={stage.key}
            style={{ width: `${stage.pct}%`, background: `var(${SERIES_VARS[i % SERIES_VARS.length]})` }}
            title={`${stage.label} ${formatPercent(stage.pct, 0)}`}
          />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {stages.map((stage, i) => (
          <li key={stage.key} className="flex items-center justify-between gap-2 text-[12.5px]">
            <span className="flex min-w-0 items-center gap-1.5 text-white/60">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: `var(${SERIES_VARS[i % SERIES_VARS.length]})` }}
              />
              <span className="truncate">{stage.label}</span>
            </span>
            <span className="num-mono shrink-0 font-semibold text-card-text">{formatPercent(stage.pct, 0)}</span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
