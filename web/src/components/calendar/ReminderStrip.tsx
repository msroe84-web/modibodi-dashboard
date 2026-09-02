import type { PersonalCalendarEvent } from '../../lib/types';

interface ReminderStripProps {
  events: PersonalCalendarEvent[];
  todayIso: string;
}

export function ReminderStrip({ events, todayIso }: ReminderStripProps) {
  // Filtering by e.end (not e.start) so a multi-day event that's already under way today
  // still shows up — a strip titled "다가오는 일정" should include things you still need to
  // show up for, not just ones that haven't started yet.
  const upcoming = events
    .filter((e) => e.end >= todayIso)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 8);

  if (upcoming.length === 0) {
    return <p className="text-[12px] text-white/40">다가오는 일정이 없어요</p>;
  }

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1">
      {upcoming.map((e) => {
        const dateLabel =
          e.start === e.end ? formatMonthDay(e.start) : `${formatMonthDay(e.start)} ~ ${formatMonthDay(e.end)}`;
        return (
          <div
            key={e.id}
            className="min-w-[150px] shrink-0 rounded-xl p-2.5"
            style={{
              borderLeft: `3px solid ${e.color}`,
              borderTop: `1px solid ${e.color}55`,
              borderRight: `1px solid ${e.color}55`,
              borderBottom: `1px solid ${e.color}55`,
              backgroundColor: `${e.color}14`,
            }}
          >
            <p className="text-[10.5px] font-extrabold" style={{ color: e.color }}>
              {dateLabel}
            </p>
            <p className="truncate text-[12.5px] font-bold text-card-text">{e.title}</p>
            {e.startTime && (
              <p className="mt-0.5 text-[10.5px] text-white/40">
                {e.startTime} – {e.endTime}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatMonthDay(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${Number(m)}월 ${Number(d)}일`;
}
