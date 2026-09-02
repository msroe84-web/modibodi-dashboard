import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartCard } from '../ui/ChartCard';
import { formatKRW, formatPercent } from '../../lib/format';

const SERIES_VARS = ['--card-series-1', '--card-series-2', '--card-series-3', '--card-series-4'];

interface ChannelSpendShareCardProps {
  data: { channel: string; spend: number }[];
}

export function ChannelSpendShareCard({ data }: ChannelSpendShareCardProps) {
  const total = data.reduce((acc, d) => acc + d.spend, 0);

  return (
    <ChartCard title="채널별 광고비 비중" subtitle="선택 기간 합계 기준">
      <div className="flex items-center gap-5">
        <div className="h-[168px] w-[168px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="spend"
                nameKey="channel"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={3}
                cornerRadius={6}
                stroke="none"
                isAnimationActive={false}
              >
                {data.map((d, i) => (
                  <Cell key={d.channel} fill={`var(${SERIES_VARS[i % SERIES_VARS.length]})`} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [formatKRW(Number(value)), String(name)]}
                contentStyle={{
                  background: 'var(--card-bg-2)',
                  border: '1px solid var(--card-hairline)',
                  borderRadius: 10,
                  fontSize: 12,
                  color: 'var(--card-text)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="min-w-0 flex-1 space-y-2">
          {data.map((d, i) => (
            <li key={d.channel} className="flex items-center justify-between gap-2 text-[12.5px]">
              <span className="flex min-w-0 items-center gap-1.5 text-white/60">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: `var(${SERIES_VARS[i % SERIES_VARS.length]})` }}
                />
                <span className="truncate">{d.channel}</span>
              </span>
              <span className="num-mono shrink-0 font-semibold text-card-text">
                {formatPercent(total > 0 ? (d.spend / total) * 100 : 0)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}
