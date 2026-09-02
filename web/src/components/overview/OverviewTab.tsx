import { useMemo, useState } from 'react';
import { AlertBanner } from './AlertBanner';
import { ChannelShareCard } from './ChannelShareCard';
import { DateRangePicker } from './DateRangePicker';
import { GoalProgressCard } from './GoalProgressCard';
import { InsightCard } from './InsightCard';
import { ProductRankingCard } from './ProductRankingCard';
import { RevenueHeroCard } from './RevenueHeroCard';
import { StatTile } from './StatTile';
import { useSettings } from '../../context/SettingsContext';
import { buildAlerts } from '../../lib/alerts';
import {
  aggregate,
  filterSeries,
  getPreviousRange,
  getPresetRange,
  percentChange,
  type DateRange,
  type RangePreset,
} from '../../lib/dateRange';
import { formatKRW, formatNumber, formatPercent } from '../../lib/format';
import {
  CHANNELS,
  TODAY,
  adSpendMonthToDate,
  inventory,
  newCustomersSeries,
  ordersSeries,
  productSales,
  repeatRateSeries,
  upcomingEvents,
} from '../../data/mockOverview';
import { useDashboardData } from '../../hooks/useDashboardData';
import { mergeChannelRevenue, totalRevenueSeriesFrom } from '../../lib/salesSeries';

const RANGE_LABELS: Record<RangePreset, string> = {
  today: '오늘',
  '7d': '최근 7일',
  '30d': '최근 30일',
  custom: '직접 지정 기간',
};

function trailingWindow<T extends { date: string }>(series: T[], endDate: string, n: number): T[] {
  return series.filter((p) => p.date <= endDate).slice(-n);
}

export function OverviewTab() {
  const { settings } = useSettings();
  const { data } = useDashboardData();
  const [preset, setPreset] = useState<RangePreset>('30d');
  const [customRange, setCustomRange] = useState<DateRange>(() => getPresetRange('7d', TODAY));

  const range = useMemo(() => getPresetRange(preset, TODAY, customRange), [preset, customRange]);
  const prevRange = useMemo(() => getPreviousRange(range), [range]);

  const channelRevenueSeries = useMemo(
    () => (data ? mergeChannelRevenue(data.channelRevenue) : mergeChannelRevenue([])),
    [data],
  );
  const totalRevenueSeries = useMemo(() => totalRevenueSeriesFrom(channelRevenueSeries), [channelRevenueSeries]);

  const revenueSeries = useMemo(() => filterSeries(totalRevenueSeries, range), [range, totalRevenueSeries]);
  const total = aggregate(revenueSeries, 'sum');
  const prevTotal = aggregate(filterSeries(totalRevenueSeries, prevRange), 'sum');
  const changePct = percentChange(total, prevTotal);

  const monthStart = `${TODAY.toISOString().slice(0, 7)}-01`;
  const monthToDate = useMemo(
    () => aggregate(filterSeries(totalRevenueSeries, { start: monthStart, end: TODAY.toISOString().slice(0, 10) }), 'sum'),
    [monthStart, totalRevenueSeries],
  );

  const channelShare = useMemo(
    () =>
      CHANNELS.map((channel) => ({
        channel,
        revenue: aggregate(
          filterSeries(
            channelRevenueSeries.filter((r) => r.channel === channel).map((r) => ({ date: r.date, value: r.revenue })),
            range,
          ),
          'sum',
        ),
      })).sort((a, b) => b.revenue - a.revenue),
    [range, channelRevenueSeries],
  );

  const orders = aggregate(filterSeries(ordersSeries, range), 'sum');
  const prevOrders = aggregate(filterSeries(ordersSeries, prevRange), 'sum');
  const aov = orders > 0 ? total / orders : 0;
  const prevAov = prevOrders > 0 ? prevTotal / prevOrders : 0;

  const newCustomers = aggregate(filterSeries(newCustomersSeries, range), 'sum');
  const prevNewCustomers = aggregate(filterSeries(newCustomersSeries, prevRange), 'sum');

  const repeatRate = aggregate(filterSeries(repeatRateSeries, range), 'avg');
  const prevRepeatRate = aggregate(filterSeries(repeatRateSeries, prevRange), 'avg');

  const alerts = useMemo(
    () => buildAlerts({ inventory, adSpendMonthToDate, upcomingEvents, settings, today: TODAY }),
    [settings],
  );

  const topChannel = channelShare[0];
  const topChannelPrevRevenue = aggregate(
    filterSeries(
      channelRevenueSeries.filter((r) => r.channel === topChannel?.channel).map((r) => ({ date: r.date, value: r.revenue })),
      prevRange,
    ),
    'sum',
  );
  const topChannelGrowth = percentChange(topChannel?.revenue ?? 0, topChannelPrevRevenue);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[20px] font-extrabold text-ink">Overview</h1>
        <DateRangePicker
          preset={preset}
          onChangePreset={setPreset}
          customRange={customRange}
          onChangeCustomRange={setCustomRange}
        />
      </div>

      <AlertBanner alerts={alerts} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueHeroCard series={revenueSeries} total={total} changePct={changePct} rangeLabel={RANGE_LABELS[preset]} />
        </div>
        <div className="flex flex-col gap-4">
          <GoalProgressCard currentMonthRevenue={monthToDate} goal={settings.monthlyRevenueGoal} />
          <InsightCard
            title={`${topChannel?.channel ?? '-'} 채널 성장`}
            body={`선택 기간 매출이 직전 동기간 대비 ${formatPercent(Math.abs(topChannelGrowth))} ${topChannelGrowth >= 0 ? '증가' : '감소'}했습니다.`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile
          label="주문건수"
          value={orders}
          format={formatNumber}
          changePct={percentChange(orders, prevOrders)}
          sparkline={trailingWindow(ordersSeries, range.end, 14).map((p) => p.value)}
        />
        <StatTile
          label="객단가"
          value={aov}
          format={formatKRW}
          changePct={percentChange(aov, prevAov)}
          sparkline={trailingWindow(ordersSeries, range.end, 14).map((p) => p.value)}
        />
        <StatTile
          label="신규 고객수"
          value={newCustomers}
          format={formatNumber}
          changePct={percentChange(newCustomers, prevNewCustomers)}
          sparkline={trailingWindow(newCustomersSeries, range.end, 14).map((p) => p.value)}
        />
        <StatTile
          label="재구매율"
          value={repeatRate}
          format={(n) => formatPercent(n)}
          changePct={percentChange(repeatRate, prevRepeatRate)}
          sparkline={trailingWindow(repeatRateSeries, range.end, 14).map((p) => p.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProductRankingCard rows={productSales} />
        <ChannelShareCard data={channelShare} />
      </div>
    </div>
  );
}
