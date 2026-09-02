import {
  CalendarClockIcon,
  CalendarCheckIcon,
  HistoryIcon,
  type LucideIcon,
  MegaphoneIcon,
  PackageIcon,
  TagIcon,
} from 'lucide-react';
import { ChartCard } from '../ui/ChartCard';
import { GradientCard } from '../ui/GradientCard';
import { calendarEvents } from '../../data/mockCalendar';
import { TODAY } from '../../data/mockOverview';
import type { CalendarEventRow } from '../../lib/types';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

const TODAY_ISO = TODAY.toISOString().slice(0, 10);

const TYPE_CONFIG: Record<CalendarEventRow['type'], { label: string; icon: LucideIcon; className: string }> = {
  promo: { label: '프로모션', icon: TagIcon, className: 'text-card-info bg-card-info/15' },
  ad: { label: '광고', icon: MegaphoneIcon, className: 'text-card-warning bg-card-warning/15' },
  restock: { label: '입고', icon: PackageIcon, className: 'text-card-good bg-card-good/15' },
};

/** Days between an ISO date string and TODAY (positive = future, negative = past). Computed
 * at render time — status is never a stored field, per the calendar tab spec. */
function daysFromToday(dateStr: string): number {
  return Math.round((Date.parse(`${dateStr}T00:00:00Z`) - Date.parse(`${TODAY_ISO}T00:00:00Z`)) / 86_400_000);
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}.${d.getUTCDate()} (${WEEKDAYS[d.getUTCDay()]})`;
}

function formatMonthLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월`;
}

function StatusBadge({ diff }: { diff: number }) {
  if (diff < 0) {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-white/8 px-2.5 py-1 text-[12px] font-semibold text-white/40">
        지난 이벤트
      </span>
    );
  }
  if (diff === 0) {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-card-critical/18 px-2.5 py-1 text-[12px] font-bold text-card-critical">
        D-Day
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-[var(--card-silver)]/15 px-2.5 py-1 text-[12px] font-bold text-[var(--card-silver)]">
      D-{diff}
    </span>
  );
}

function TypeBadge({ type }: { type: CalendarEventRow['type'] }) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${config.className}`}>
      <Icon size={11} strokeWidth={2.5} />
      {config.label}
    </span>
  );
}

/** One event row, grouped rendering handles the month divider above it. */
function EventRow({ event }: { event: CalendarEventRow }) {
  const diff = daysFromToday(event.date);
  const isPast = diff < 0;
  return (
    <div
      className={`flex flex-wrap items-center gap-3 border-b border-card-hairline px-1 py-3 last:border-b-0 ${
        isPast ? 'opacity-55' : ''
      }`}
    >
      <span className="num-mono w-[76px] shrink-0 text-[13px] font-semibold text-white/70">
        {formatDateLabel(event.date)}
      </span>
      <TypeBadge type={event.type} />
      <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-card-text">{event.title}</span>
      <StatusBadge diff={diff} />
    </div>
  );
}

/** Renders a chronological list of events with a small month-divider label whenever the
 * month changes. Assumes `events` is already sorted the way the caller wants displayed. */
function EventList({ events }: { events: CalendarEventRow[] }) {
  let lastMonth = '';
  return (
    <div>
      {events.map((event) => {
        const monthLabel = formatMonthLabel(event.date);
        const showDivider = monthLabel !== lastMonth;
        lastMonth = monthLabel;
        return (
          <div key={`${event.date}-${event.title}`}>
            {showDivider && (
              <div className="mt-4 mb-1 px-1 text-[11.5px] font-bold uppercase tracking-wide text-white/35 first:mt-0">
                {monthLabel}
              </div>
            )}
            <EventRow event={event} />
          </div>
        );
      })}
    </div>
  );
}

export function CalendarTab() {
  const sorted = [...calendarEvents].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = sorted.filter((e) => daysFromToday(e.date) >= 0);
  const past = sorted.filter((e) => daysFromToday(e.date) < 0).reverse();

  const thisMonthPrefix = TODAY_ISO.slice(0, 7);
  const thisMonthCount = sorted.filter((e) => e.date.startsWith(thisMonthPrefix)).length;
  const nextEvent = upcoming[0];
  const nextEventDiff = nextEvent ? daysFromToday(nextEvent.date) : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-extrabold text-ink">캠페인 캘린더</h1>
        <p className="mt-0.5 text-[13px] text-ink-secondary">공구·프로모션·광고·입고 일정을 한눈에 확인하세요.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GradientCard radius={22} padding="p-4" className="card-shadow">
          <div className="flex items-center gap-2 text-[12.5px] font-medium text-white/55">
            <CalendarCheckIcon size={15} className="text-[var(--card-silver)]" />
            예정된 이벤트
          </div>
          <p className="num-mono mt-2 text-[22px] font-bold text-card-text">{upcoming.length}건</p>
        </GradientCard>
        <GradientCard radius={22} padding="p-4" className="card-shadow">
          <div className="flex items-center gap-2 text-[12.5px] font-medium text-white/55">
            <CalendarClockIcon size={15} className="text-[var(--card-silver)]" />
            이번 달 일정
          </div>
          <p className="num-mono mt-2 text-[22px] font-bold text-card-text">{thisMonthCount}건</p>
        </GradientCard>
        <GradientCard radius={22} padding="p-4" className="card-shadow">
          <div className="flex items-center gap-2 text-[12.5px] font-medium text-white/55">
            <HistoryIcon size={15} className="text-[var(--card-silver)]" />
            다음 이벤트
          </div>
          {nextEvent ? (
            <p className="mt-2 truncate text-[15px] font-bold text-card-text">
              {nextEventDiff === 0 ? 'D-Day' : `D-${nextEventDiff}`} · {nextEvent.title}
            </p>
          ) : (
            <p className="mt-2 text-[15px] font-bold text-card-text">예정된 이벤트 없음</p>
          )}
        </GradientCard>
      </div>

      <ChartCard title="다가오는 일정" subtitle="오늘 이후 예정된 이벤트를 날짜순으로 표시합니다.">
        {upcoming.length > 0 ? (
          <EventList events={upcoming} />
        ) : (
          <p className="py-6 text-center text-[13px] text-white/40">예정된 이벤트가 없습니다.</p>
        )}
      </ChartCard>

      <ChartCard title="지난 일정" subtitle="최근 30일간 종료된 이벤트입니다.">
        {past.length > 0 ? (
          <EventList events={past} />
        ) : (
          <p className="py-6 text-center text-[13px] text-white/40">지난 이벤트가 없습니다.</p>
        )}
      </ChartCard>
    </div>
  );
}
