import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from '../ui/ChartCard';
import { formatPercent } from '../../lib/format';

const SERIES_VARS = ['--card-series-1', '--card-series-2', '--card-series-3', '--card-series-4'];

interface ChannelRoasCardProps {
  data: { channel: string; roas: number }[];
}

/** ROAS expressed as a multiple, e.g. 3.4 -> "340%". */
function formatRoas(roas: number): string {
  return formatPercent(roas * 100, 0);
}

export function ChannelRoasCard({ data }: ChannelRoasCardProps) {
  return (
    <ChartCard title="채널별 ROAS 비교" subtitle="광고비 대비 매출 (귀속 매출 / 광고비)">
      <div className="h-[168px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 4 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="channel"
              width={52}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => [formatRoas(Number(value)), 'ROAS']}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              contentStyle={{
                background: 'var(--card-bg-2)',
                border: '1px solid var(--card-hairline)',
                borderRadius: 10,
                fontSize: 12,
                color: 'var(--card-text)',
              }}
            />
            <Bar
              dataKey="roas"
              radius={[0, 6, 6, 0]}
              barSize={16}
              isAnimationActive={false}
              label={{
                position: 'right',
                formatter: (value: unknown) => formatRoas(Number(value ?? 0)),
                fill: 'rgba(255,255,255,0.7)',
                fontSize: 11.5,
              }}
            >
              {data.map((d, i) => (
                <Cell key={d.channel} fill={`var(${SERIES_VARS[i % SERIES_VARS.length]})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
