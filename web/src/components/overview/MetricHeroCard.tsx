import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import type { LucideIcon } from 'lucide-react';
import { GradientCard } from '../ui/GradientCard';
import { TrendBadge } from '../ui/TrendBadge';
import { formatDate } from '../../lib/format';
import type { TimeSeriesPoint } from '../../lib/dateRange';

export interface HeroMetricOption {
  key: string;
  label: string;
  icon: LucideIcon;
  /** 'sum' -> headline is a period total ("~ 누적"), 'avg' -> a period average ("~ 평균"). Also
   *  picks which of the two labels is shown next to the range, per metric type. */
  mode: 'sum' | 'avg';
  series: TimeSeriesPoint[];
  total: number;
  changePct: number;
  format: (n: number) => string;
}

interface MetricHeroCardProps {
  options: HeroMetricOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
  rangeLabel: string;
}

/** Single toggleable "hero" chart: pick a metric via the top pill row and the headline number,
 *  unit/icon, trend badge, chart, and 누적/평균 label all switch together. Metrics have very
 *  different scales (KRW vs ROAS vs a head count), so only one is ever plotted at a time —
 *  never overlaid on a shared axis. */
export function MetricHeroCard({ options, selectedKey, onSelect, rangeLabel }: MetricHeroCardProps) {
  const active = options.find((o) => o.key === selectedKey) ?? options[0];
  const Icon = active.icon;
  const tickEvery = Math.max(1, Math.ceil(active.series.length / 6));

  return (
    <GradientCard radius={28} padding="p-5" className="card-shadow flex h-full flex-col">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 p-0.5">
          {options.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => onSelect(o.key)}
              className={`rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                o.key === active.key ? 'bg-white/15 text-card-text' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <TrendBadge changePct={active.changePct} />
      </div>

      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[var(--card-silver)]">
          <Icon size={15} strokeWidth={2.25} />
        </span>
        <span className="num-mono bg-gradient-to-r from-[var(--card-silver-bright)] to-[var(--card-silver-dim)] bg-clip-text text-[32px] font-black leading-none text-transparent">
          {active.format(active.total)}
        </span>
      </div>
      <p className="mb-4 text-[12.5px] text-white/50">
        {rangeLabel} {active.mode === 'sum' ? '누적' : '평균'}
      </p>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={active.series} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
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
              formatter={(value) => [active.format(Number(value)), active.label]}
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
              fill="url(#heroFill)"
              dot={false}
              activeDot={{ r: 4, fill: 'var(--card-silver-bright)', stroke: 'var(--card-bg-1)', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GradientCard>
  );
}
