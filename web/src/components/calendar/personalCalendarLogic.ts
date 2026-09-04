import type { PersonalCalendarEvent } from '../../lib/types';

/** Mon-Fri labels for the work-week view (WeekGrid). */
export const WEEKDAY_LABELS = ['월', '화', '수', '목', '금'] as const;
/** Sun-Sat labels for the month grid, in standard Korean calendar order. */
export const MONTH_DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;
export const MAX_VISIBLE_LANES = 3;

export interface MonthDayCell {
  day: number;
  col: number; // 0=Sun .. 6=Sat
  iso: string;
  /** false for the previous/next month's overflow days shown to fill out the grid. */
  inMonth: boolean;
}

export type MonthWeekRow = MonthDayCell[]; // always length 7

/** Builds Sun-Sat week rows for a given month, matching a standard Korean/Google-style
 * calendar: always 6 rows of 7 real dates, with the previous/next month's overflow days
 * filled in (marked `inMonth: false`) instead of left blank, so the grid reads as one
 * continuous strip across month boundaries. */
export function buildMonthWeekRows(year: number, month: number): MonthWeekRow[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay(); // 0=Sun .. 6=Sat
  const prevMonthDays = new Date(year, month - 1, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const cells: MonthDayCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayOffset = i - firstWeekday + 1; // 1-based day-of-month, current month
    const col = i % 7;
    if (dayOffset < 1) {
      const day = prevMonthDays + dayOffset;
      cells.push({ day, col, iso: isoDate(prevYear, prevMonth, day), inMonth: false });
    } else if (dayOffset > daysInMonth) {
      const day = dayOffset - daysInMonth;
      cells.push({ day, col, iso: isoDate(nextYear, nextMonth, day), inMonth: false });
    } else {
      cells.push({ day: dayOffset, col, iso: isoDate(year, month, dayOffset), inMonth: true });
    }
  }

  const rows: MonthWeekRow[] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export interface PlacedEventBar {
  event: PersonalCalendarEvent;
  colStart: number;
  colEnd: number;
  lane: number;
  roundLeft: boolean;
  roundRight: boolean;
}

/** Places every event overlapping a week row into non-overlapping lanes (greedy first-fit —
 * same algorithm as the legacy calendar). Returns ALL placements, including lanes >=
 * MAX_VISIBLE_LANES; callers filter to `lane < MAX_VISIBLE_LANES` for the bars they render and
 * use `eventsOnDay()` for the "+N more" overflow count. */
export function placeEventBars(weekRow: MonthWeekRow, events: PersonalCalendarEvent[]): PlacedEventBar[] {
  const lanes: { colStart: number; colEnd: number }[][] = [];
  const placed: PlacedEventBar[] = [];

  // Multi-day events get first pick of the low (visible) lanes, since losing one to overflow
  // hides it on every day of its span at once, not just the one day a single-day event would
  // lose. Within each group, oldest start date first so lane assignment stays stable as new
  // events are added instead of shuffling every event that's already placed.
  const ordered = [...events].sort((a, b) => {
    const aSpan = a.end > a.start ? 0 : 1;
    const bSpan = b.end > b.start ? 0 : 1;
    if (aSpan !== bSpan) return aSpan - bSpan;
    return a.start < b.start ? -1 : a.start > b.start ? 1 : 0;
  });

  for (const event of ordered) {
    const overlap = weekRow.filter((wd) => wd.iso >= event.start && wd.iso <= event.end);
    if (overlap.length === 0) continue;
    const colStart = overlap[0].col;
    const colEnd = overlap[overlap.length - 1].col;
    let lane = lanes.findIndex((l) => !l.some((o) => !(colEnd < o.colStart || colStart > o.colEnd)));
    if (lane === -1) {
      lane = lanes.length;
      lanes.push([]);
    }
    lanes[lane].push({ colStart, colEnd });
    placed.push({
      event,
      colStart,
      colEnd,
      lane,
      roundLeft: overlap[0].iso === event.start,
      roundRight: overlap[overlap.length - 1].iso === event.end,
    });
  }
  return placed;
}

/** Every event covering a given day, from the full events list (not week-scoped). */
export function eventsOnDay(iso: string, events: PersonalCalendarEvent[]): PersonalCalendarEvent[] {
  return events.filter((e) => iso >= e.start && iso <= e.end);
}

/** 06:00-23:30 in 30-minute steps, matching the legacy calendar's time picker range. */
export function timeOptions(): string[] {
  const opts: string[] = [];
  for (let h = 6; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return opts;
}

export const EVENT_COLORS = [
  { name: '그레이', value: '#9CA3AF' },
  { name: '블루', value: '#60A5FA' },
  { name: '그린', value: '#4ADE80' },
  { name: '퍼플', value: '#C084FC' },
  { name: '오렌지', value: '#FB923C' },
  { name: '레드', value: '#F87171' },
] as const;

/** Monday of the work week containing `date`. */
export function startOfWorkWeek(date: Date): Date {
  const d = new Date(date);
  const weekday = d.getDay(); // 0=Sun..6=Sat
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function dateToISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
