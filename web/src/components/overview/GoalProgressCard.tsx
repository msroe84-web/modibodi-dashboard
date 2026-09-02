import { useCountUp } from '../../hooks/useCountUp';
import { formatCompactKRW } from '../../lib/format';
import { GradientCard } from '../ui/GradientCard';

interface GoalProgressCardProps {
  currentMonthRevenue: number;
  goal: number;
}

export function GoalProgressCard({ currentMonthRevenue, goal }: GoalProgressCardProps) {
  const pct = goal > 0 ? Math.min(999, (currentMonthRevenue / goal) * 100) : 0;
  const animatedPct = useCountUp(pct);
  const barWidth = Math.min(100, pct);

  return (
    <GradientCard radius={28} padding="p-5" className="card-shadow flex h-full flex-col justify-between">
      <div>
        <p className="text-[11.5px] font-semibold uppercase tracking-wide text-white/45">이번 달 목표</p>
        <h3 className="mt-1 text-[15px] font-bold text-card-text">월 매출 목표 달성률</h3>
      </div>
      <div
        className="my-3 num-mono text-[38px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-r from-[var(--card-silver-bright)] to-[var(--card-silver-dim)]"
      >
        {animatedPct.toFixed(0)}%
      </div>
      <div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[var(--card-silver)] transition-[width] duration-500 ease-out"
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11.5px] text-white/50">
          <span>{formatCompactKRW(currentMonthRevenue)}</span>
          <span>목표 {formatCompactKRW(goal)}</span>
        </div>
      </div>
    </GradientCard>
  );
}
