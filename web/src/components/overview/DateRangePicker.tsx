import type { DateRange, RangePreset } from '../../lib/dateRange';

const PRESETS: { id: RangePreset; label: string }[] = [
  { id: 'today', label: '오늘' },
  { id: '7d', label: '7일' },
  { id: '30d', label: '30일' },
  { id: 'custom', label: '직접 지정' },
];

interface DateRangePickerProps {
  preset: RangePreset;
  onChangePreset: (preset: RangePreset) => void;
  customRange: DateRange;
  onChangeCustomRange: (range: DateRange) => void;
}

export function DateRangePicker({ preset, onChangePreset, customRange, onChangeCustomRange }: DateRangePickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-0.5 rounded-lg border border-hairline bg-surface p-0.5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChangePreset(p.id)}
            className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
              preset === p.id ? 'bg-primary text-page' : 'text-ink-secondary hover:bg-surface-sunken hover:text-ink'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className="flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-2.5 py-1.5 text-[13px]">
          <input
            type="date"
            value={customRange.start}
            max={customRange.end}
            onChange={(e) => onChangeCustomRange({ ...customRange, start: e.target.value })}
            className="bg-transparent text-ink outline-none"
          />
          <span className="text-ink-muted">~</span>
          <input
            type="date"
            value={customRange.end}
            min={customRange.start}
            onChange={(e) => onChangeCustomRange({ ...customRange, end: e.target.value })}
            className="bg-transparent text-ink outline-none"
          />
        </div>
      )}
    </div>
  );
}
