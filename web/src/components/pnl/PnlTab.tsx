import { useMemo, useState } from 'react';
import { ChannelPnlTable } from './ChannelPnlTable';
import { PnlSummaryCard } from './PnlSummaryCard';
import { computeBlendedCogsRatio, computeChannelPnlRow, computePnlTotals } from './pnlMath';
import { DateRangePicker } from '../overview/DateRangePicker';
import { useSettings } from '../../context/SettingsContext';
import { aggregate, filterSeries, getPresetRange, type DateRange, type RangePreset } from '../../lib/dateRange';
import { CHANNELS, TODAY, channelRevenueSeries, productSales } from '../../data/mockOverview';

export function PnlTab() {
  const { settings } = useSettings();
  const [preset, setPreset] = useState<RangePreset>('30d');
  const [customRange, setCustomRange] = useState<DateRange>(() => getPresetRange('7d', TODAY));

  const range = useMemo(() => getPresetRange(preset, TODAY, customRange), [preset, customRange]);

  // Blended COGS ratio derived from mockOverview.productSales + settings.pricing — see pnlMath.ts.
  const cogsRatio = useMemo(() => computeBlendedCogsRatio(productSales, settings.pricing), [settings.pricing]);

  const rows = useMemo(
    () =>
      CHANNELS.map((channel) => {
        const revenue = aggregate(
          filterSeries(
            channelRevenueSeries.filter((r) => r.channel === channel).map((r) => ({ date: r.date, value: r.revenue })),
            range,
          ),
          'sum',
        );
        const feeRate = settings.feeRates[channel] ?? null;
        return computeChannelPnlRow(channel, revenue, feeRate, cogsRatio);
      }).sort((a, b) => b.revenue - a.revenue),
    [range, settings.feeRates, cogsRatio],
  );

  const totals = useMemo(() => computePnlTotals(rows), [rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[20px] font-extrabold text-ink">손익</h1>
        <DateRangePicker
          preset={preset}
          onChangePreset={setPreset}
          customRange={customRange}
          onChangeCustomRange={setCustomRange}
        />
      </div>

      <PnlSummaryCard totals={totals} />
      <ChannelPnlTable rows={rows} />
    </div>
  );
}
