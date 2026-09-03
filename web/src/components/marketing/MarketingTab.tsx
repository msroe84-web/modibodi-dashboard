import { useMemo, useState } from 'react';
import { BudgetUsageCard } from './BudgetUsageCard';
import { ChannelRoasCard } from './ChannelRoasCard';
import { ChannelSpendShareCard } from './ChannelSpendShareCard';
import { DateRangePicker } from '../overview/DateRangePicker';
import { StatTile } from '../overview/StatTile';
import { useSettings } from '../../context/SettingsContext';
import {
  aggregate,
  filterSeries,
  getPreviousRange,
  getPresetRange,
  percentChange,
  type DateRange,
  type RangePreset,
} from '../../lib/dateRange';
import { formatKRW, formatRoas } from '../../lib/format';
import { TODAY, adSpendMonthToDate } from '../../data/mockOverview';
import { MARKETING_CHANNELS, marketingDailySeries as mockMarketingDailySeries } from '../../data/mockMarketing';
import { useDashboardData } from '../../hooks/useDashboardData';
import {
  channelSeriesFrom,
  mergeMarketingDaily,
  totalAdSpendSeriesFrom,
  totalAttributedRevenueSeriesFrom,
  totalConversionsSeriesFrom,
  totalCpaSeriesFrom,
  totalRoasSeriesFrom,
} from '../../lib/marketingSeries';

function trailingWindow<T extends { date: string }>(series: T[], endDate: string, n: number): T[] {
  return series.filter((p) => p.date <= endDate).slice(-n);
}


export function MarketingTab() {
  const { settings } = useSettings();
  const { data } = useDashboardData();
  const [preset, setPreset] = useState<RangePreset>('30d');
  const [customRange, setCustomRange] = useState<DateRange>(() => getPresetRange('7d', TODAY));

  const range = useMemo(() => getPresetRange(preset, TODAY, customRange), [preset, customRange]);
  const prevRange = useMemo(() => getPreviousRange(range), [range]);

  const dailyRows = useMemo(
    () => (data ? mergeMarketingDaily(data.marketingDaily) : mockMarketingDailySeries),
    [data],
  );
  const totalAdSpendSeries = useMemo(() => totalAdSpendSeriesFrom(dailyRows), [dailyRows]);
  const totalAttributedRevenueSeries = useMemo(() => totalAttributedRevenueSeriesFrom(dailyRows), [dailyRows]);
  const totalConversionsSeries = useMemo(() => totalConversionsSeriesFrom(dailyRows), [dailyRows]);
  const totalRoasSeries = useMemo(
    () => totalRoasSeriesFrom(totalAdSpendSeries, totalAttributedRevenueSeries),
    [totalAdSpendSeries, totalAttributedRevenueSeries],
  );
  const totalCpaSeries = useMemo(
    () => totalCpaSeriesFrom(totalAdSpendSeries, totalConversionsSeries),
    [totalAdSpendSeries, totalConversionsSeries],
  );

  // Per-channel spend/revenue/conversions summed over the selected range -> per-channel ROAS/CPA.
  const channelStats = useMemo(
    () =>
      MARKETING_CHANNELS.map((channel) => {
        const spend = aggregate(filterSeries(channelSeriesFrom(dailyRows, channel, 'spend'), range), 'sum');
        const revenue = aggregate(filterSeries(channelSeriesFrom(dailyRows, channel, 'revenue'), range), 'sum');
        const conversions = aggregate(filterSeries(channelSeriesFrom(dailyRows, channel, 'conversions'), range), 'sum');
        return {
          channel,
          spend,
          revenue,
          conversions,
          roas: spend > 0 ? revenue / spend : 0,
          cpa: conversions > 0 ? spend / conversions : 0,
        };
      }),
    [dailyRows, range],
  );

  const totalSpend = aggregate(filterSeries(totalAdSpendSeries, range), 'sum');
  const totalRevenue = aggregate(filterSeries(totalAttributedRevenueSeries, range), 'sum');
  const totalConversions = aggregate(filterSeries(totalConversionsSeries, range), 'sum');
  // Overall ROAS = 매출가중평균 (revenue-weighted), i.e. sum(revenue)/sum(spend) across channels —
  // NOT the simple average of each channel's individual ROAS (which would overweight low-spend channels).
  const overallRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const overallCpa = totalConversions > 0 ? totalSpend / totalConversions : 0;

  const prevSpend = aggregate(filterSeries(totalAdSpendSeries, prevRange), 'sum');
  const prevRevenue = aggregate(filterSeries(totalAttributedRevenueSeries, prevRange), 'sum');
  const prevConversions = aggregate(filterSeries(totalConversionsSeries, prevRange), 'sum');
  const prevOverallRoas = prevSpend > 0 ? prevRevenue / prevSpend : 0;
  const prevOverallCpa = prevConversions > 0 ? prevSpend / prevConversions : 0;

  const spendShareData = useMemo(
    () => channelStats.map(({ channel, spend }) => ({ channel, spend })).sort((a, b) => b.spend - a.spend),
    [channelStats],
  );
  const roasCompareData = useMemo(() => channelStats.map(({ channel, roas }) => ({ channel, roas })), [channelStats]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[20px] font-extrabold text-ink">마케팅</h1>
        <DateRangePicker
          preset={preset}
          onChangePreset={setPreset}
          customRange={customRange}
          onChangeCustomRange={setCustomRange}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatTile
          label="전체 광고비"
          value={totalSpend}
          format={formatKRW}
          changePct={percentChange(totalSpend, prevSpend)}
          sparkline={trailingWindow(totalAdSpendSeries, range.end, 14).map((p) => p.value)}
        />
        <StatTile
          label="전체 ROAS"
          value={overallRoas}
          format={formatRoas}
          changePct={percentChange(overallRoas, prevOverallRoas)}
          sparkline={trailingWindow(totalRoasSeries, range.end, 14).map((p) => p.value)}
        />
        <StatTile
          label="전체 CPA"
          value={overallCpa}
          format={formatKRW}
          changePct={percentChange(overallCpa, prevOverallCpa)}
          sparkline={trailingWindow(totalCpaSeries, range.end, 14).map((p) => p.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChannelSpendShareCard data={spendShareData} />
        <ChannelRoasCard data={roasCompareData} />
      </div>

      <div>
        <h2 className="mb-2 text-[13.5px] font-semibold text-ink-secondary">이번 달 채널별 예산 소진율</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {MARKETING_CHANNELS.map((channel) => (
            <BudgetUsageCard
              key={channel}
              channel={channel}
              spent={adSpendMonthToDate[channel] ?? 0}
              budget={settings.adBudget[channel] ?? 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

