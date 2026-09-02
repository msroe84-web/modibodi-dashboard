import { useCountUp } from '../../hooks/useCountUp';
import { formatCompactKRW } from '../../lib/format';
import { GradientCard } from '../ui/GradientCard';

interface BudgetUsageCardProps {
  channel: string;
  spent: number;
  budget: number;
}

/** One channel's month-to-date ad budget consumption, with an over-budget (>=100%) critical state. */
export function BudgetUsageCard({ channel, spent, budget }: BudgetUsageCardProps) {
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const animatedPct = useCountUp(pct);
  const barWidth = Math.min(100, pct);
  const isOverBudget = pct >= 100;

  return (
    <GradientCard radius={22} padding="p-4" className="card-shadow flex h-full flex-col justify-between">
      <p className="text-[12.5px] font-medium text-white/55">{channel}</p>
      <div
        className={`my-1.5 num-mono text-[24px] font-black leading-none ${
          isOverBudget
            ? 'text-card-critical'
            : 'bg-gradient-to-r from-[var(--card-silver-bright)] to-[var(--card-silver-dim)] bg-clip-text text-transparent'
        }`}
      >
        {animatedPct.toFixed(0)}%
      </div>
      <div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ease-out ${
              isOverBudget ? 'bg-card-critical' : 'bg-[var(--card-silver)]'
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11.5px] text-white/50">
          <span>{formatCompactKRW(spent)}</span>
          <span>예산 {formatCompactKRW(budget)}</span>
        </div>
      </div>
    </GradientCard>
  );
}
