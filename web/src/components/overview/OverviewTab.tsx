import { useMemo, useState } from 'react';
import { MegaphoneIcon, TargetIcon, UserPlusIcon, WalletIcon } from 'lucide-react';
import { AiInsightCard } from './AiInsightCard';
import { AlertBanner } from './AlertBanner';
import { ChannelPerformanceTable } from './ChannelPerformanceTable';
import { ChannelShareCard } from './ChannelShareCard';
import { DateRangePicker } from './DateRangePicker';
import { GoalProgressCard } from './GoalProgressCard';
import { MetricHeroCard, type HeroMetricOption } from './MetricHeroCard';
import { ProductPerformanceTable } from './ProductPerformanceTable';
import { PurchaseFunnelCard } from './PurchaseFunnelCard';
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
import { buildInsights } from '../../lib/insights';
import {
  channelSeriesFrom,
  mergeMarketingDaily,
  totalAdSpendSeriesFrom,
  totalAttributedRevenueSeriesFrom,
  totalRoasSeriesFrom,
} from '../../lib/marketingSeries';
import {
  CHANNELS,
  TODAY,
  adSpendMonthToDate,
  cartSeries,
  checkoutSeries,
  inventory,
  newCustomersSeries,
  ordersSeries,
  productSales,
  repeatRateSeries,
  upcomingEvents,
  visitsSeries,
} from '../../data/mockOverview';
import { MARKETING_CHANNELS, marketingDailySeries as mockMarketingDailySeries } from '../../data/mockMarketing';
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
  const [heroMetric, setHeroMetric] = useState('revenue');

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

  // Marketing daily rows (real where synced, mock elsewhere) — same source MarketingTab uses,
  // so the ad-spend/ROAS hero metric and the channel-performance table below always agree with
  // what the 마케팅 탭 shows for the same range.
  const dailyRows = useMemo(() => (data ? mergeMarketingDaily(data.marketingDaily) : mockMarketingDailySeries), [data]);
  const totalAdSpendSeries = useMemo(() => totalAdSpendSeriesFrom(dailyRows), [dailyRows]);
  const totalAttributedRevenueSeries = useMemo(() => totalAttributedRevenueSeriesFrom(dailyRows), [dailyRows]);
  const totalRoasSeries = useMemo(
    () => totalRoasSeriesFrom(totalAdSpendSeries, totalAttributedRevenueSeries),
    [totalAdSpendSeries, totalAttributedRevenueSeries],
  );

  const adSpendSeriesRanged = useMemo(() => filterSeries(totalAdSpendSeries, range), [totalAdSpendSeries, range]);
  const adSpendTotal = aggregate(adSpendSeriesRanged, 'sum');
  const adSpendPrevTotal = aggregate(filterSeries(totalAdSpendSeries, prevRange), 'sum');
  const adSpendChangePct = percentChange(adSpendTotal, adSpendPrevTotal);

  const attributedRevenueTotal = aggregate(filterSeries(totalAttributedRevenueSeries, range), 'sum');
  const attributedRevenuePrevTotal = aggregate(filterSeries(totalAttributedRevenueSeries, prevRange), 'sum');
  const roasSeriesRanged = useMemo(() => filterSeries(totalRoasSeries, range), [totalRoasSeries, range]);
  // Overall ROAS = revenue-weighted (sum(revenue)/sum(spend)), not an average of daily ratios.
  const roasTotal = adSpendTotal > 0 ? attributedRevenueTotal / adSpendTotal : 0;
  const roasPrevTotal = adSpendPrevTotal > 0 ? attributedRevenuePrevTotal / adSpendPrevTotal : 0;
  const roasChangePct = percentChange(roasTotal, roasPrevTotal);

  const heroOptions: HeroMetricOption[] = [
    {
      key: 'revenue',
      label: '매출',
      icon: WalletIcon,
      mode: 'sum',
      series: revenueSeries,
      total,
      changePct,
      format: formatKRW,
    },
    {
      key: 'adSpend',
      label: '광고비',
      icon: MegaphoneIcon,
      mode: 'sum',
      series: adSpendSeriesRanged,
      total: adSpendTotal,
      changePct: adSpendChangePct,
      format: formatKRW,
    },
    {
      key: 'roas',
      label: 'ROAS',
      icon: TargetIcon,
      mode: 'avg',
      series: roasSeriesRanged.map((p) => ({ date: p.date, value: p.value * 100 })),
      total: roasTotal * 100,
      changePct: roasChangePct,
      format: (n) => formatPercent(n, 0),
    },
    {
      key: 'newCustomers',
      label: '신규 고객',
      icon: UserPlusIcon,
      mode: 'sum',
      series: filterSeries(newCustomersSeries, range),
      total: newCustomers,
      changePct: percentChange(newCustomers, prevNewCustomers),
      format: (n) => `${formatNumber(n)}명`,
    },
  ];

  // 방문 -> 장바구니 -> 결제시작 -> 구매. `구매` reuses the same `orders` figure shown in the
  // 주문건수 stat tile above, so the funnel's last step always matches it exactly.
  const funnelSteps = [
    { label: '방문', value: aggregate(filterSeries(visitsSeries, range), 'sum') },
    { label: '장바구니', value: aggregate(filterSeries(cartSeries, range), 'sum') },
    { label: '결제시작', value: aggregate(filterSeries(checkoutSeries, range), 'sum') },
    { label: '구매', value: orders },
  ];

  const channelPerf = useMemo(
    () =>
      MARKETING_CHANNELS.map((channel) => {
        const spend = aggregate(filterSeries(channelSeriesFrom(dailyRows, channel, 'spend'), range), 'sum');
        const revenue = aggregate(filterSeries(channelSeriesFrom(dailyRows, channel, 'revenue'), range), 'sum');
        const clicks = aggregate(filterSeries(channelSeriesFrom(dailyRows, channel, 'clicks'), range), 'sum');
        const impressions = aggregate(filterSeries(channelSeriesFrom(dailyRows, channel, 'impressions'), range), 'sum');
        return {
          channel,
          spend,
          revenue,
          roas: spend > 0 ? revenue / spend : 0,
          cpc: clicks > 0 ? spend / clicks : 0,
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        };
      }),
    [dailyRows, range],
  );

  const insights = useMemo(
    () =>
      buildInsights({
        channelPerf,
        products: productSales,
        repeatRateSeries,
        adSpendSeries: totalAdSpendSeries,
        newCustomersSeries,
        monthToDateRevenue: monthToDate,
        monthlyGoal: settings.monthlyRevenueGoal,
        today: TODAY,
      }),
    [channelPerf, totalAdSpendSeries, monthToDate, settings.monthlyRevenueGoal],
  );

  const alerts = useMemo(
    () => buildAlerts({ inventory, adSpendMonthToDate, upcomingEvents, settings, today: TODAY }),
    [settings],
  );

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
          <MetricHeroCard
            options={heroOptions}
            selectedKey={heroMetric}
            onSelect={setHeroMetric}
            rangeLabel={RANGE_LABELS[preset]}
          />
        </div>
        <div className="flex flex-col gap-4">
          <GoalProgressCard currentMonthRevenue={monthToDate} goal={settings.monthlyRevenueGoal} />
          <AiInsightCard insights={insights} />
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
        <PurchaseFunnelCard steps={funnelSteps} />
        <ChannelShareCard data={channelShare} />
      </div>

      <ChannelPerformanceTable rows={channelPerf} />
      <ProductPerformanceTable rows={productSales} />
    </div>
  );
}
