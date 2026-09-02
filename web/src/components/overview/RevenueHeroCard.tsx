import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { ChartCard } from '../ui/ChartCard';
import { TrendBadge } from '../ui/TrendBadge';
import { formatCompactKRW, formatDate, formatKRW } from '../../lib/format';
import type { TimeSeriesPoint } from '../../lib/dateRange';

interface RevenueHeroCardProps {
  series: TimeSeriesPoint[];
  total: number;
  changePct: number;
  rangeLabel: string;
}

export function RevenueHeroCard({ series, total, changePct, rangeLabel }: RevenueHeroCardProps) {
  const tickEvery = Math.max(1, Math.ceil(series.length / 6));

  return (
    <ChartCard
      title="매출 추이"
      subtitle={rangeLabel}
      trailing={<TrendBadge changePct={changePct} />}
      className="flex flex-col"
    >
      <div className="mb-4 num-mono bg-gradient-to-r from-[var(--card-silver-bright)] to-[var(--card-silver-dim)] bg-clip-text text-[32px] font-black leading-none text-transparent">
        {formatKRW(total)}
      </div>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--card-silver)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--card-silver)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              interval={tickEvery - 1}
              tickLine={false}
              axisLine={{ stroke: 'var(--card-hairline)' }}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              dy={6}
            />
            <Tooltip
              formatter={(value) => [formatKRW(Number(value)), '매출']}
              labelFormatter={(label) => formatDate(String(label))}
              contentStyle={{
                background: 'var(--card-bg-2)',
                border: '1px solid var(--card-hairline)',
                borderRadius: 10,
                fontSize: 12,
                color: 'var(--card-text)',
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--card-silver)"
              strokeWidth={2.5}
              fill="url(#revenueFill)"
              dot={false}
              activeDot={{ r: 4, fill: 'var(--card-silver-bright)', stroke: 'var(--card-bg-1)', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-right text-[11.5px] text-white/40">일 평균 {formatCompactKRW(total / Math.max(1, series.length))}</p>
    </ChartCard>
  );
}
