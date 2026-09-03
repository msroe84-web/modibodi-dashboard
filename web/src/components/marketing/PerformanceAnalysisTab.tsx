import { useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { ChartCard } from '../ui/ChartCard';
import { CampaignPerformanceTable } from './CampaignPerformanceTable';
import { CreativeCard, type ScoredCreative } from './CreativeCard';
import { rankCreatives } from '../../lib/creativeScoring';
import { formatDate, formatKRW, formatPercent, formatRoas } from '../../lib/format';
import { campaigns, channelSeries } from '../../data/mockMarketing';
import { mockAdCreatives } from '../../data/mockAdCreatives';

type TrendMetric = 'roas' | 'ctr' | 'cpa';

const TREND_OPTIONS: { key: TrendMetric; label: string }[] = [
  { key: 'roas', label: 'ROAS' },
  { key: 'ctr', label: 'CTR' },
  { key: 'cpa', label: 'CPA' },
];

const GRADE_RANK = { best: 0, good: 1, replace: 2 } as const;

/** Meta's own daily spend/revenue/impressions/clicks/conversions — the same source
 *  mockMarketing.ts already generates — used here as the creative-tab's performance trend,
 *  since the creatives themselves (cumulative rows, no daily breakdown) don't carry a time
 *  series of their own. This is all Meta-channel data anyway (creatives are single-channel). */
function useMetaTrend(metric: TrendMetric) {
  return useMemo(() => {
    const spend = channelSeries('Meta', 'spend');
    const revenue = channelSeries('Meta', 'revenue');
    const impressions = channelSeries('Meta', 'impressions');
    const clicks = channelSeries('Meta', 'clicks');
    const conversions = channelSeries('Meta', 'conversions');

    return spend.map((p, i) => {
      if (metric === 'roas') {
        return { date: p.date, value: p.value > 0 ? (revenue[i]?.value ?? 0) / p.value : 0 };
      }
      if (metric === 'ctr') {
        const imp = impressions[i]?.value ?? 0;
        return { date: p.date, value: imp > 0 ? ((clicks[i]?.value ?? 0) / imp) * 100 : 0 };
      }
      const conv = conversions[i]?.value ?? 0;
      return { date: p.date, value: conv > 0 ? p.value / conv : 0 };
    });
  }, [metric]);
}

function formatTrendValue(metric: TrendMetric, value: number): string {
  if (metric === 'roas') return formatRoas(value);
  if (metric === 'ctr') return formatPercent(value, 2);
  return formatKRW(value);
}

export function PerformanceAnalysisTab() {
  const [metric, setMetric] = useState<TrendMetric>('roas');
  const trendData = useMetaTrend(metric);
  const tickEvery = Math.max(1, Math.ceil(trendData.length / 6));

  const metaCampaigns = useMemo(() => campaigns.filter((c) => c.channel === 'Meta'), []);

  const topCreatives: ScoredCreative[] = useMemo(() => {
    const scores = rankCreatives(mockAdCreatives);
    const scoreById = new Map(scores.map((s) => [s.id, s]));
    const scored = mockAdCreatives.map((c) => ({ ...c, ...scoreById.get(c.id)! }));
    return [...scored]
      .sort((a, b) => GRADE_RANK[a.grade] - GRADE_RANK[b.grade] || b.spend - a.spend)
      .slice(0, 8);
  }, []);

  return (
    <div className="space-y-4">
      <ChartCard
        title="성과 추이"
        subtitle="Meta 채널 일별 기준"
        trailing={
          <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 p-0.5">
            {TREND_OPTIONS.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => setMetric(o.key)}
                className={`rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                  metric === o.key ? 'bg-white/15 text-card-text' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="creativeTrendFill" x1="0" y1="0" x2="0" y2="1">
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
                formatter={(value) => [formatTrendValue(metric, Number(value)), TREND_OPTIONS.find((o) => o.key === metric)?.label ?? '']}
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
                fill="url(#creativeTrendFill)"
                dot={false}
                activeDot={{ r: 4, fill: 'var(--card-silver-bright)', stroke: 'var(--card-bg-1)', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <CampaignPerformanceTable rows={metaCampaigns} />

      <ChartCard title="크리에이티브" subtitle="등급 · 지출 순 상위 8개">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {topCreatives.map((c) => (
            <CreativeCard key={c.id} creative={c} />
          ))}
        </div>
      </ChartCard>
    </div>
  );
}
