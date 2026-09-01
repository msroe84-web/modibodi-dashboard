import { WEEKDAY_LABELS, addDays, dateToISO } from './personalCalendarLogic';
import type { PersonalCalendarEvent } from '../../lib/types';

interface WeekGridProps {
  weekStart: Date;
  events: PersonalCalendarEvent[];
  todayIso: string;
  onSelectDay: (iso: string) => void;
  onEditEvent: (event: PersonalCalendarEvent) => void;
}

export function WeekGrid({ weekStart, events, todayIso, onSelectDay, onEditEvent }: WeekGridProps) {
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = addDays(weekStart, i);
    return { iso: dateToISO(d), day: d.getDate(), label: WEEKDAY_LABELS[i] };
  });

  return (
    <div className="grid grid-cols-5 overflow-hidden rounded-2xl border border-hairline">
      {days.map((d) => {
        const dayEvents = events.filter((e) => d.iso >= e.start && d.iso <= e.end);
        const isToday = d.iso === todayIso;
        return (
          <div key={d.iso} className="min-h-[360px] border-r border-hairline last:border-r-0">
            <button
              type="button"
              onClick={() => onSelectDay(d.iso)}
              className="flex w-full flex-col items-center gap-1 border-b border-hairline bg-surface-sunken py-2 hover:bg-surface"
            >
              <span className="text-[11px] font-semibold text-ink-muted">{d.label}</span>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold ${
                  isToday ? 'bg-primary text-primary-ink' : 'text-ink'
                }`}
              >
                {d.day}
              </span>
            </button>
            <div className="space-y-1.5 p-1.5">
              {dayEvents.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onEditEvent(e)}
                  className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-[11.5px] font-semibold"
                  style={{ color: e.color, backgroundColor: `${e.color}22`, border: `1px solid ${e.color}66` }}
                >
                  {e.title}
                  <span className="ml-1 block text-[10px] font-normal opacity-80">
                    {e.startTime}–{e.endTime}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
