import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { useCountUp } from '../../hooks/useCountUp';
import { TrendBadge } from '../ui/TrendBadge';
import { GradientCard } from '../ui/GradientCard';

interface StatTileProps {
  label: string;
  value: number;
  format: (n: number) => string;
  changePct: number;
  sparkline: number[];
}

export function StatTile({ label, value, format, changePct, sparkline }: StatTileProps) {
  const animatedValue = useCountUp(value);
  const data = sparkline.map((v, i) => ({ i, v }));

  return (
    <GradientCard radius={22} padding="p-4" className="card-shadow">
      <div className="flex items-start justify-between gap-2">
        <p className="whitespace-nowrap text-[12.5px] font-medium text-white/55">{label}</p>
        <span className="shrink-0">
          <TrendBadge changePct={changePct} />
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="num-mono text-[22px] font-bold text-card-text">{format(animatedValue)}</span>
        <div className="h-8 w-20">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line
                type="monotone"
                dataKey="v"
                stroke="var(--card-silver)"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </GradientCard>
  );
}
