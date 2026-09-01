import { useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { DateRangePicker } from '../overview/DateRangePicker';
import { StatTile } from '../overview/StatTile';
import { ChartCard } from '../ui/ChartCard';
import {
  aggregate,
  filterSeries,
  getPreviousRange,
  getPresetRange,
  percentChange,
  type DateRange,
  type RangePreset,
  type TimeSeriesPoint,
} from '../../lib/dateRange';
import { formatDate, formatNumber, formatPercent } from '../../lib/format';
import { TODAY, newCustomersSeries } from '../../data/mockOverview';
import { repeatCustomersSeries, totalActiveCustomers } from '../../data/mockCrm';

const RANGE_LABELS: Record<RangePreset, string> = {
  today: '오늘',
  '7d': '최근 7일',
  '30d': '최근 30일',
  custom: '직접 지정 기간',
};

/** Weekly bucketing threshold — beyond this many days, daily bars get too dense to read. */
const WEEKLY_BUCKET_THRESHOLD_DAYS = 45;

function trailingWindow<T extends { date: string }>(series: T[], endDate: string, n: number): T[] {
  return series.filter((p) => p.date <= endDate).slice(-n);
}

interface CrmBarPoint {
  date: string;
  신규: number;
  재구매: number;
}

function bucketWeekly(points: CrmBarPoint[]): CrmBarPoint[] {
  const buckets: CrmBarPoint[] = [];
  for (let i = 0; i < points.length; i += 7) {
    const chunk = points.slice(i, i + 7);
    buckets.push({
      date: chunk[0].date,
      신규: chunk.reduce((acc, p) => acc + p.신규, 0),
      재구매: chunk.reduce((acc, p) => acc + p.재구매, 0),
    });
  }
  return buckets;
}

export function CrmTab() {
  const [preset, setPreset] = useState<RangePreset>('30d');
  const [customRange, setCustomRange] = useState<DateRange>(() => getPresetRange('7d', TODAY));

  const range = useMemo(() => getPresetRange(preset, TODAY, customRange), [preset, customRange]);
  const prevRange = useMemo(() => getPreviousRange(range), [range]);

  const newInRange = useMemo(() => filterSeries(newCustomersSeries, range), [range]);
  const repeatInRange = useMemo(() => filterSeries(repeatCustomersSeries, range), [range]);

  const newCustomers = aggregate(newInRange, 'sum');
  const prevNewCustomers = aggregate(filterSeries(newCustomersSeries, prevRange), 'sum');

  const repeatCustomers = aggregate(repeatInRange, 'sum');
  const prevRepeatCustomers = aggregate(filterSeries(repeatCustomersSeries, prevRange), 'sum');

  const repeatRate = newCustomers + repeatCustomers > 0 ? (repeatCustomers / (newCustomers + repeatCustomers)) * 100 : 0;
  const prevRepeatRate =
    prevNewCustomers + prevRepeatCustomers > 0 ? (prevRepeatCustomers / (prevNewCustomers + prevRepeatCustomers)) * 100 : 0;

  /** Daily repeat-purchase rate, derived from the two count series (for the 재구매율 sparkline). */
  const dailyRepeatRateSeries: TimeSeriesPoint[] = useMemo(
    () =>
      newCustomersSeries.map((p, i) => {
        const repeat = repeatCustomersSeries[i]?.value ?? 0;
        const total = p.value + repeat;
        return { date: p.date, value: total > 0 ? (repeat / total) * 100 : 0 };
      }),
    [],
  );

  const chartData = useMemo<CrmBarPoint[]>(() => {
    const points: CrmBarPoint[] = newInRange.map((p, i) => ({
      date: p.date,
      신규: p.value,
      재구매: repeatInRange[i]?.value ?? 0,
    }));
    return points.length > WEEKLY_BUCKET_THRESHOLD_DAYS ? bucketWeekly(points) : points;
  }, [newInRange, repeatInRange]);

  const isWeeklyBucketed = chartData.length !== newInRange.length;
  const tickEvery = Math.max(1, Math.ceil(chartData.length / 8));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[20px] font-extrabold text-ink">CRM</h1>
        <DateRangePicker
          preset={preset}
          onChangePreset={setPreset}
          customRange={customRange}
          onChangeCustomRange={setCustomRange}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="신규 고객수"
          value={newCustomers}
          format={formatNumber}
          changePct={percentChange(newCustomers, prevNewCustomers)}
          sparkline={trailingWindow(newCustomersSeries, range.end, 14).map((p) => p.value)}
        />
        <StatTile
          label="재구매 고객수"
          value={repeatCustomers}
          format={formatNumber}
          changePct={percentChange(repeatCustomers, prevRepeatCustomers)}
          sparkline={trailingWindow(repeatCustomersSeries, range.end, 14).map((p) => p.value)}
        />
        <StatTile
          label="재구매율"
          value={repeatRate}
          format={(n) => formatPercent(n)}
          changePct={percentChange(repeatRate, prevRepeatRate)}
          sparkline={trailingWindow(dailyRepeatRateSeries, range.end, 14).map((p) => p.value)}
        />
      </div>

      <ChartCard
        title="신규 vs 재구매 고객"
        subtitle={`${RANGE_LABELS[preset]}${isWeeklyBucketed ? ' · 주간 합계' : ' · 일별'}`}
        trailing={
          <div className="flex items-center gap-3 text-[12px] text-white/55">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: 'var(--card-series-1)' }} />
              신규
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: 'var(--card-silver)' }} />
              재구매
            </span>
          </div>
        }
      >
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
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
                labelFormatter={(label) => formatDate(String(label))}
                formatter={(value, name) => [formatNumber(Number(value)), String(name)]}
                contentStyle={{
                  background: 'var(--card-bg-2)',
                  border: '1px solid var(--card-hairline)',
                  borderRadius: 10,
                  fontSize: 12,
                  color: 'var(--card-text)',
                }}
              />
              <Bar dataKey="신규" stackId="customers" fill="var(--card-series-1)" radius={[0, 0, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="재구매" stackId="customers" fill="var(--card-silver)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 text-right text-[11.5px] text-white/40">활성 고객(누적) 약 {formatNumber(totalActiveCustomers)}명</p>
      </ChartCard>
    </div>
  );
}
