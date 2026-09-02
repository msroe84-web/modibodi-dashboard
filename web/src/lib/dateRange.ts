export type RangePreset = 'today' | '7d' | '30d' | 'custom';

export interface DateRange {
  /** inclusive, yyyy-mm-dd */
  start: string;
  /** inclusive, yyyy-mm-dd */
  end: string;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

export function getPresetRange(preset: RangePreset, today: Date = new Date(), custom?: DateRange): DateRange {
  const end = toISODate(today);
  switch (preset) {
    case 'today':
      return { start: end, end };
    case '7d':
      return { start: addDays(end, -6), end };
    case '30d':
      return { start: addDays(end, -29), end };
    case 'custom':
      return custom ?? { start: addDays(end, -6), end };
  }
}

/** Equal-length period immediately preceding `range`, for comparison deltas. */
export function getPreviousRange(range: DateRange): DateRange {
  const days = daysBetween(range.start, range.end) + 1;
  return {
    start: addDays(range.start, -days),
    end: addDays(range.start, -1),
  };
}

function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(`${startIso}T00:00:00Z`).getTime();
  const end = new Date(`${endIso}T00:00:00Z`).getTime();
  return Math.round((end - start) / 86_400_000);
}

export function filterSeries(series: TimeSeriesPoint[], range: DateRange): TimeSeriesPoint[] {
  return series.filter((p) => p.date >= range.start && p.date <= range.end);
}

export type AggregateMode = 'sum' | 'avg';

export function aggregate(series: TimeSeriesPoint[], mode: AggregateMode): number {
  if (series.length === 0) return 0;
  const total = series.reduce((acc, p) => acc + p.value, 0);
  return mode === 'sum' ? total : total / series.length;
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}
