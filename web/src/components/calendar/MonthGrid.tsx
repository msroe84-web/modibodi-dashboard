import { useEffect, useState } from 'react';
import {
  MAX_VISIBLE_LANES,
  MONTH_DOW_LABELS,
  buildMonthWeekRows,
  eventsOnDay,
  placeEventBars,
} from './personalCalendarLogic';
import { getHoliday } from '../../data/koreanHolidays';
import type { PersonalCalendarEvent } from '../../lib/types';

interface MonthGridProps {
  year: number;
  month: number;
  events: PersonalCalendarEvent[];
  todayIso: string;
  onSelectRange: (startIso: string, endIso: string) => void;
  onEditEvent: (event: PersonalCalendarEvent) => void;
}

const LANE_HEIGHT = 20;
const BARS_TOP = 32;
/** Minimum row height in px for a given number of stacked event lanes (0..MAX_VISIBLE_LANES).
 * Rows are flex children that stretch to fill the card's full height (see the `flex-1` row
 * below) — this is only a floor so a heavily-booked week never gets compressed below what its
 * bars need, not the row's actual rendered height. */
function rowMinHeightFor(laneCount: number): number {
  const contentBottom = laneCount > 0 ? BARS_TOP + laneCount * LANE_HEIGHT : BARS_TOP;
  return Math.max(56, contentBottom + 12);
}

/** Text color for a day number: red for Sunday/holidays, blue for Saturday, default otherwise.
 * `isToday` cells keep the white-circle/black-text treatment instead (handled by the caller).
 * Days outside the current month are always muted, regardless of weekday/holiday. */
function dayNumberColorClass(dow: number, isHoliday: boolean, inMonth: boolean): string {
  if (!inMonth) return 'text-white/25';
  if (isHoliday || dow === 0) return 'text-[#F87171]';
  if (dow === 6) return 'text-[#60A5FA]';
  return 'text-white/60';
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
      className="flex h-full select-none flex-col"
      onMouseLeave={abortDrag}
      onMouseUp={handleMouseUp}
    >
      <div className="grid shrink-0 grid-cols-7 overflow-hidden rounded-t-2xl border-b border-card-hairline bg-white/5">
        {MONTH_DOW_LABELS.map((d, i) => (
          <div
            key={d}
            className={`py-2.5 text-center text-[12px] font-semibold ${
              i === 0 ? 'text-[#F87171]' : i === 6 ? 'text-[#60A5FA]' : 'text-white/40'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {weekRows.map((row, rowIndex) => {
        const placedBars = placeEventBars(row, events);
        const visibleBars = placedBars.filter((p) => p.lane < MAX_VISIBLE_LANES);
        const isLastRow = rowIndex === weekRows.length - 1;
        const maxLaneUsed = placedBars.reduce((m, p) => Math.max(m, p.lane + 1), 0);
        const rowMinHeight = rowMinHeightFor(Math.min(MAX_VISIBLE_LANES, maxLaneUsed));

        return (
          <div
            key={rowIndex}
            style={{ minHeight: rowMinHeight }}
            className="relative grid flex-1 grid-cols-7 border-b border-card-hairline last:border-b-0"
          >
            {row.map((cell, col) => {
              const isLastCol = col === 6;
              // No overflow-hidden on the grid (the popover below needs to escape it near
              // edges), so the corner cells round themselves to match the outer border
              // instead of relying on ancestor clipping.
              const cornerClass = !isLastRow
                ? ''
                : col === 0
                  ? 'rounded-bl-2xl'
                  : isLastCol
                    ? 'rounded-br-2xl'
                    : '';

              const isToday = cell.iso === todayIso;
              const holidayName = cell.inMonth ? getHoliday(cell.iso) : undefined;
              const inDrag = Boolean(dragLo && dragHi && cell.iso >= dragLo && cell.iso <= dragHi);
              const dayCount = eventsOnDay(cell.iso, events).length;
              // Count visible bars actually covering this column, not a flat
              // dayCount - MAX_VISIBLE_LANES: a multi-day event can be pushed past
              // MAX_VISIBLE_LANES by a conflict on a *different* day of its own span,
              // which would make the flat count under-report (or hide entirely) an
              // event that doesn't show up in this day's own visible bars.
              const visibleOnThisDay = visibleBars.filter((b) => b.colStart <= col && col <= b.colEnd).length;
              const hiddenCount = dayCount - visibleOnThisDay;

              return (
                <div
                  key={col}
                  className={`relative h-full border-r border-card-hairline p-2 last:border-r-0 ${cornerClass} ${
                    inDrag ? 'bg-white/10' : 'hover:bg-white/5'
                  } ${cell.inMonth ? '' : 'bg-white/[0.015]'}`}
                  onMouseDown={() => handleMouseDown(cell.iso)}
                  onMouseEnter={() => handleMouseEnter(cell.iso)}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12.5px] font-semibold ${
                        isToday ? 'bg-white text-[#0c0c0d]' : dayNumberColorClass(col, Boolean(holidayName), cell.inMonth)
                      }`}
                    >
                      {cell.day}
                    </span>
                    {holidayName && (
                      <span className="truncate text-[9.5px] font-bold text-[#F87171]" title={holidayName}>
                        {holidayName}
                      </span>
                    )}
                  </div>
                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPopoverIso(cell.iso);
                      }}
                      className="absolute bottom-2 left-2 text-[10px] font-semibold text-white/40 hover:text-white/80"
                    >
                      +{hiddenCount}개 더보기
                    </button>
                  )}
                  {popoverIso === cell.iso && (
                    <div
                      className={`absolute z-20 w-52 rounded-xl border border-card-hairline bg-[#1a1a1e] p-2 shadow-2xl ${
                        isLastCol ? 'right-1' : 'left-1'
                      } ${isLastRow ? 'bottom-full mb-1' : 'top-full mt-1'}`}
                    >
                      <div className="mb-1.5 flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-card-text">{cell.day}일 일정</span>
                        <button
                          type="button"
                          onClick={() => setPopoverIso(null)}
                          className="text-white/40 hover:text-white/80"
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
                          {e.startTime && <span className="text-[10px] text-white/40">{e.startTime}</span>} {e.title}
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
                    left: `calc(${(bar.colStart / 7) * 100}% + ${bar.roundLeft ? 4 : 0}px)`,
                    width: `calc(${((bar.colEnd - bar.colStart + 1) / 7) * 100}% - ${
                      (bar.roundLeft ? 4 : 0) + (bar.roundRight ? 4 : 0)
                    }px)`,
                    top: `${BARS_TOP + bar.lane * LANE_HEIGHT}px`,
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
                  {bar.event.startTime && <span className="opacity-70">{bar.event.startTime}</span>} {bar.event.title}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
