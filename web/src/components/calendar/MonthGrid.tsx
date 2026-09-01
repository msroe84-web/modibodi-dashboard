import { useEffect, useState } from 'react';
import {
  MAX_VISIBLE_LANES,
  WEEKDAY_LABELS,
  buildMonthWeekRows,
  eventsOnDay,
  placeEventBars,
} from './personalCalendarLogic';
import type { PersonalCalendarEvent } from '../../lib/types';

interface MonthGridProps {
  year: number;
  month: number;
  events: PersonalCalendarEvent[];
  todayIso: string;
  onSelectRange: (startIso: string, endIso: string) => void;
  onEditEvent: (event: PersonalCalendarEvent) => void;
}

export function MonthGrid({ year, month, events, todayIso, onSelectRange, onEditEvent }: MonthGridProps) {
  const weekRows = buildMonthWeekRows(year, month);
  const [dragAnchorIso, setDragAnchorIso] = useState<string | null>(null);
  const [dragHoverIso, setDragHoverIso] = useState<string | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [popoverIso, setPopoverIso] = useState<string | null>(null);

  function abortDrag() {
    setIsMouseDown(false);
    setDragAnchorIso(null);
    setDragHoverIso(null);
  }

  useEffect(() => {
    window.addEventListener('mouseup', abortDrag);
    return () => window.removeEventListener('mouseup', abortDrag);
  }, []);

  const dragLo = dragAnchorIso && dragHoverIso ? (dragAnchorIso < dragHoverIso ? dragAnchorIso : dragHoverIso) : null;
  const dragHi = dragAnchorIso && dragHoverIso ? (dragAnchorIso > dragHoverIso ? dragAnchorIso : dragHoverIso) : null;

  function handleMouseDown(iso: string) {
    setIsMouseDown(true);
    setDragAnchorIso(iso);
    setDragHoverIso(iso);
  }

  function handleMouseEnter(iso: string) {
    if (isMouseDown) setDragHoverIso(iso);
  }

  function handleMouseUp() {
    if (!isMouseDown || !dragLo || !dragHi) return;
    setIsMouseDown(false);
    onSelectRange(dragLo, dragHi);
    setDragAnchorIso(null);
    setDragHoverIso(null);
  }

  return (
    <div
      className="select-none rounded-2xl border border-hairline"
      onMouseLeave={abortDrag}
      onMouseUp={handleMouseUp}
    >
      <div className="grid grid-cols-5 border-b border-hairline bg-surface-sunken">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold text-ink-muted">
            {d}
          </div>
        ))}
      </div>

      {weekRows.map((row, rowIndex) => {
        const placedBars = placeEventBars(row, events);
        const visibleBars = placedBars.filter((p) => p.lane < MAX_VISIBLE_LANES);

        return (
          <div key={rowIndex} className="relative grid grid-cols-5 border-b border-hairline last:border-b-0">
            {row.map((cell, col) => {
              if (!cell) return <div key={col} className="h-24 bg-surface-sunken/40" />;
              const isToday = cell.iso === todayIso;
              const inDrag = Boolean(dragLo && dragHi && cell.iso >= dragLo && cell.iso <= dragHi);
              const dayCount = eventsOnDay(cell.iso, events).length;
              // Count visible bars actually covering this column, not a flat
              // dayCount - MAX_VISIBLE_LANES: a multi-day event can be pushed past
              // MAX_VISIBLE_LANES by a conflict on a *different* day of its own span,
              // which would make the flat count under-report (or hide entirely) an
              // event that doesn't show up in this day's own visible bars.
              const visibleOnThisDay = visibleBars.filter((b) => b.colStart <= col && col <= b.colEnd).length;
              const hiddenCount = dayCount - visibleOnThisDay;
              const isLastCol = col === 4;
              const isLastRow = rowIndex === weekRows.length - 1;

              return (
                <div
                  key={col}
                  className={`relative h-24 border-r border-hairline p-1.5 last:border-r-0 ${
                    inDrag ? 'bg-primary-soft' : 'bg-surface hover:bg-surface-sunken'
                  }`}
                  onMouseDown={() => handleMouseDown(cell.iso)}
                  onMouseEnter={() => handleMouseEnter(cell.iso)}
                >
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11.5px] font-semibold ${
                      isToday ? 'bg-primary text-primary-ink' : 'text-ink-secondary'
                    }`}
                  >
                    {cell.day}
                  </span>
                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPopoverIso(cell.iso);
                      }}
                      className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold text-ink-muted hover:text-ink"
                    >
                      +{hiddenCount}개 더보기
                    </button>
                  )}
                  {popoverIso === cell.iso && (
                    <div
                      className={`absolute z-20 w-52 rounded-xl border border-hairline bg-surface p-2 shadow-2xl ${
                        isLastCol ? 'right-1' : 'left-1'
                      } ${isLastRow ? 'bottom-full mb-1' : 'top-full mt-1'}`}
                    >
                      <div className="mb-1.5 flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-ink">{cell.day}일 일정</span>
                        <button
                          type="button"
                          onClick={() => setPopoverIso(null)}
                          className="text-ink-muted hover:text-ink"
                        >
                          <span aria-hidden>✕</span>
                        </button>
                      </div>
                      {eventsOnDay(cell.iso, events).map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => {
                            setPopoverIso(null);
                            onEditEvent(e);
                          }}
                          className="mb-1 block w-full truncate rounded-lg px-2 py-1.5 text-left text-[12px] font-medium last:mb-0"
                          style={{ color: e.color, backgroundColor: `${e.color}18` }}
                        >
                          {e.title}
                          <span className="ml-1.5 text-[10px] text-ink-muted">
                            {e.startTime}–{e.endTime}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="pointer-events-none absolute inset-0">
              {visibleBars.map((bar) => (
                <button
                  key={bar.event.id}
                  type="button"
                  onClick={() => onEditEvent(bar.event)}
                  className="pointer-events-auto absolute truncate px-1.5 text-left text-[11px] font-semibold"
                  style={{
                    left: `calc(${(bar.colStart / 5) * 100}% + ${bar.roundLeft ? 4 : 0}px)`,
                    width: `calc(${((bar.colEnd - bar.colStart + 1) / 5) * 100}% - ${
                      (bar.roundLeft ? 4 : 0) + (bar.roundRight ? 4 : 0)
                    }px)`,
                    top: `${28 + bar.lane * 20}px`,
                    height: '18px',
                    lineHeight: '18px',
                    color: bar.event.color,
                    backgroundColor: `${bar.event.color}26`,
                    borderTop: `1px solid ${bar.event.color}55`,
                    borderBottom: `1px solid ${bar.event.color}55`,
                    borderLeft: bar.roundLeft ? `1px solid ${bar.event.color}55` : undefined,
                    borderRight: bar.roundRight ? `1px solid ${bar.event.color}55` : undefined,
                    borderRadius: `${bar.roundLeft ? '6px' : '0'} ${bar.roundRight ? '6px' : '0'} ${
                      bar.roundRight ? '6px' : '0'
                    } ${bar.roundLeft ? '6px' : '0'}`,
                  }}
                >
                  {bar.event.title}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
