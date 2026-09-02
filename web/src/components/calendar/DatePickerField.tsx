import { useEffect, useRef, useState } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

const WEEKDAY_LABELS_FULL = ['일', '월', '화', '수', '목', '금', '토'] as const;

interface DatePickerFieldProps {
  value: string;
  onChange: (iso: string) => void;
}

function isoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function formatDisplay(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${y}.${m}.${d}`;
}

/** A calendar-popup date field styled to match the dashboard's card system, replacing the
 * browser's native <input type="date"> picker (which can't be themed and looks jarring next
 * to the rest of this dark-first UI). */
export function DatePickerField({ value, onChange }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => Number(value.split('-')[0]));
  const [viewMonth, setViewMonth] = useState(() => Number(value.split('-')[1]));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const [y, m] = value.split('-').map(Number);
    setViewYear(y);
    setViewMonth(m);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function goPrevMonth() {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-sunken px-3 py-2 text-[13px] text-ink outline-none hover:border-ink-secondary"
      >
        <CalendarIcon size={14} className="text-ink-muted" />
        {formatDisplay(value)}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-xl border border-hairline bg-surface p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={goPrevMonth}
              className="rounded p-1 text-ink-secondary hover:bg-surface-sunken hover:text-ink"
            >
              <ChevronLeftIcon size={16} />
            </button>
            <span className="text-[13px] font-bold text-ink">
              {viewYear}년 {viewMonth}월
            </span>
            <button
              type="button"
              onClick={goNextMonth}
              className="rounded p-1 text-ink-secondary hover:bg-surface-sunken hover:text-ink"
            >
              <ChevronRightIcon size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {WEEKDAY_LABELS_FULL.map((d, i) => (
              <div
                key={d}
                className={`text-center text-[10.5px] font-semibold ${i === 0 ? 'text-critical/70' : 'text-ink-muted'}`}
              >
                {d}
              </div>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const iso = isoDate(viewYear, viewMonth, day);
              const isSelected = iso === value;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-medium ${
                    isSelected ? 'bg-primary text-page' : 'text-ink hover:bg-surface-sunken'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
