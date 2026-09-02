import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, ClockIcon } from 'lucide-react';

interface TimeSelectFieldProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

/** A dropdown time field styled to match the dashboard's card system, replacing the browser's
 * native <select> (whose popup list can't be themed and looks out of place in this dark UI). */
export function TimeSelectField({ value, options, onChange }: TimeSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const selectedEl = listRef.current.querySelector('[data-selected="true"]');
    selectedEl?.scrollIntoView({ block: 'center' });
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-sunken px-3 py-2 text-[13px] text-ink outline-none hover:border-ink-secondary"
      >
        <ClockIcon size={14} className="text-ink-muted" />
        {value}
        <ChevronDownIcon size={12} className="text-ink-muted" />
      </button>
      {open && (
        <div
          ref={listRef}
          className="absolute left-0 top-full z-30 mt-1 max-h-56 w-28 overflow-y-auto rounded-xl border border-hairline bg-surface p-1 shadow-2xl"
        >
          {options.map((t) => (
            <button
              key={t}
              type="button"
              data-selected={t === value}
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              className={`block w-full rounded-lg px-3 py-1.5 text-left text-[13px] ${
                t === value ? 'bg-primary font-semibold text-page' : 'text-ink hover:bg-surface-sunken'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
