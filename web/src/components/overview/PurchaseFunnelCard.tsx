import { ChartCard } from '../ui/ChartCard';
import { formatNumber, formatPercent } from '../../lib/format';

export interface FunnelStep {
  label: string;
  value: number;
}

/** Purchase funnel as plain horizontal bars (no chart lib) — each step's bar width is relative
 *  to the first step, with the conversion rate from the *previous* step shown alongside. */
export function PurchaseFunnelCard({ steps }: { steps: FunnelStep[] }) {
  const first = steps[0]?.value || 1;

  return (
    <ChartCard title="구매 퍼널" subtitle="선택 기간 기준">
      <ul className="space-y-3">
        {steps.map((step, i) => {
          const prev = steps[i - 1];
          const stepRate = prev && prev.value > 0 ? (step.value / prev.value) * 100 : null;
          const widthPct = Math.max(4, (step.value / first) * 100);

          return (
            <li key={step.label}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-[13px]">
                <span className="font-medium text-card-text">{step.label}</span>
                <span className="num-mono flex items-baseline gap-2 text-[12.5px] text-white/55">
                  {stepRate !== null && <span className="text-white/35">전 단계 대비 {formatPercent(stepRate, 0)}</span>}
                  <span className="font-semibold text-card-text">{formatNumber(step.value)}</span>
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[var(--card-silver)] transition-[width] duration-500 ease-out"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}
