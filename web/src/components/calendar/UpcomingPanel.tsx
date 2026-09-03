import type { PersonalCalendarEvent } from '../../lib/types';

interface UpcomingPanelProps {
  events: PersonalCalendarEvent[];
  todayIso: string;
  onSelectEvent: (event: PersonalCalendarEvent) => void;
}

/** Dropdown content for the "다가오는 일정" toggle: the same "soonest first" list the old
 * always-visible reminder strip showed, just as a compact vertical list instead of a
 * horizontal-scroll card that ate a full row of page height. */
export function UpcomingPanel({ events, todayIso, onSelectEvent }: UpcomingPanelProps) {
  // Filtering by e.end (not e.start) so a multi-day event that's already under way today
  // still shows up — "다가오는 일정" should include things you still need to show up for,
  // not just ones that haven't started yet.
  const upcoming = events
    .filter((e) => e.end >= todayIso)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 12);

  if (upcoming.length === 0) {
    return <p className="p-4 text-center text-[12px] text-white/40">다가오는 일정이 없어요</p>;
  }

  return (
    <div className="max-h-[360px] overflow-y-auto p-1.5">
      {upcoming.map((e) => {
        const dateLabel =
          e.start === e.end ? formatMonthDay(e.start) : `${formatMonthDay(e.start)} ~ ${formatMonthDay(e.end)}`;
        return (
          <button
            key={e.id}
            type="button"
            onClick={() => onSelectEvent(e)}
            className="mb-1 flex w-full items-start gap-2 rounded-lg p-2 text-left last:mb-0 hover:bg-white/5"
          >
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: e.color }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-bold text-card-text">{e.title}</p>
              <p className="mt-0.5 text-[10.5px]" style={{ color: e.color }}>
                {dateLabel}
                {e.startTime && ` · ${e.startTime}`}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function formatMonthDay(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${Number(m)}월 ${Number(d)}일`;
}
