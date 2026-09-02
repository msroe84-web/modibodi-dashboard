import { useMemo, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from 'lucide-react';
import { EventModal, type EventModalDraft } from './EventModal';
import { MonthGrid } from './MonthGrid';
import { WeekGrid } from './WeekGrid';
import { ReminderStrip } from './ReminderStrip';
import { EVENT_COLORS, addDays, dateToISO, startOfWorkWeek } from './personalCalendarLogic';
import { usePersonalCalendarStore } from '../../hooks/usePersonalCalendarStore';
import { TODAY } from '../../data/mockOverview';
import type { PersonalCalendarEvent } from '../../lib/types';

// Local-time extraction (not toISOString()/getUTC*), to stay on the same date axis as
// personalCalendarLogic.ts's addDays/startOfWorkWeek/dateToISO — WeekGrid builds its day
// cells from those, and mixing UTC "today" with a locally-built week can point isToday and
// the month/week views at different calendar days near a UTC/local day boundary.
const TODAY_ISO = dateToISO(TODAY);
const TODAY_YEAR = TODAY.getFullYear();
const TODAY_MONTH = TODAY.getMonth() + 1;

function blankDraft(startIso: string, endIso: string): EventModalDraft {
  return {
    title: '',
    desc: '',
    start: startIso,
    end: endIso,
    color: EVENT_COLORS[0].value,
    startTime: '10:00',
    endTime: '11:00',
  };
}

function draftFromEvent(event: PersonalCalendarEvent): EventModalDraft {
  return {
    id: event.id,
    title: event.title,
    desc: event.desc,
    start: event.start,
    end: event.end,
    color: event.color,
    startTime: event.startTime,
    endTime: event.endTime,
  };
}

export function PersonalCalendarTab() {
  const { events, saveEvent, deleteEvent } = usePersonalCalendarStore();
  const [view, setView] = useState<'month' | 'week'>('month');
  const [curYear, setCurYear] = useState(TODAY_YEAR);
  const [curMonth, setCurMonth] = useState(TODAY_MONTH);
  const [weekStart, setWeekStart] = useState(() => startOfWorkWeek(TODAY));
  const [modalDraft, setModalDraft] = useState<EventModalDraft | null>(null);

  const rangeLabel = useMemo(() => {
    if (view === 'month') return `${curYear}년 ${curMonth}월`;
    const weekEnd = addDays(weekStart, 4);
    return `${weekStart.getMonth() + 1}월 ${weekStart.getDate()}일 – ${weekEnd.getMonth() + 1}월 ${weekEnd.getDate()}일`;
  }, [view, curYear, curMonth, weekStart]);

  function goPrev() {
    if (view === 'month') {
      if (curMonth === 1) {
        setCurYear((y) => y - 1);
        setCurMonth(12);
      } else {
        setCurMonth((m) => m - 1);
      }
    } else {
      setWeekStart((prev) => addDays(prev, -7));
    }
  }

  function goNext() {
    if (view === 'month') {
      if (curMonth === 12) {
        setCurYear((y) => y + 1);
        setCurMonth(1);
      } else {
        setCurMonth((m) => m + 1);
      }
    } else {
      setWeekStart((prev) => addDays(prev, 7));
    }
  }

  function openAddModal(startIso: string, endIso: string) {
    setModalDraft(blankDraft(startIso, endIso));
  }

  function openEditModal(event: PersonalCalendarEvent) {
    setModalDraft(draftFromEvent(event));
  }

  function handleSave(draft: EventModalDraft) {
    saveEvent(draft);
    setModalDraft(null);
  }

  function handleDelete() {
    if (modalDraft?.id) deleteEvent(modalDraft.id);
    setModalDraft(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-ink">일정관리</h1>
          <p className="mt-0.5 text-[13px] text-ink-secondary">회의, 연차, 정산 등 개인·팀 업무 일정을 관리하세요.</p>
        </div>
        <button
          type="button"
          onClick={() => openAddModal(TODAY_ISO, TODAY_ISO)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-ink hover:opacity-90"
        >
          <PlusIcon size={14} />
          일정 추가
        </button>
      </div>

      <div className="rounded-[22px] border border-hairline bg-surface card-shadow">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-3.5">
          <h2 className="text-[14px] font-bold text-ink">{rangeLabel}</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-lg border border-hairline bg-surface-sunken p-0.5">
              <button
                type="button"
                onClick={() => setView('month')}
                className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  view === 'month' ? 'bg-primary text-primary-ink' : 'text-ink-secondary hover:text-ink'
                }`}
              >
                월간
              </button>
              <button
                type="button"
                onClick={() => setView('week')}
                className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  view === 'week' ? 'bg-primary text-primary-ink' : 'text-ink-secondary hover:text-ink'
                }`}
              >
                주간
              </button>
            </div>
            <button type="button" onClick={goPrev} className="rounded-md p-1 text-ink-secondary hover:bg-surface-sunken hover:text-ink">
              <ChevronLeftIcon size={16} />
            </button>
            <button type="button" onClick={goNext} className="rounded-md p-1 text-ink-secondary hover:bg-surface-sunken hover:text-ink">
              <ChevronRightIcon size={16} />
            </button>
          </div>
        </div>
        <div className="p-4">
          {view === 'month' ? (
            <MonthGrid
              year={curYear}
              month={curMonth}
              events={events}
              todayIso={TODAY_ISO}
              onSelectRange={openAddModal}
              onEditEvent={openEditModal}
            />
          ) : (
            <WeekGrid
              weekStart={weekStart}
              events={events}
              todayIso={TODAY_ISO}
              onSelectDay={(iso) => openAddModal(iso, iso)}
              onEditEvent={openEditModal}
            />
          )}
        </div>
      </div>

      <div className="rounded-[22px] border border-hairline bg-surface p-4 card-shadow">
        <p className="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-ink-muted">⚡ 꼭 챙겨야 할 리마인드</p>
        <ReminderStrip events={events} todayIso={TODAY_ISO} />
      </div>

      {modalDraft && (
        <EventModal
          draft={modalDraft}
          isEditing={Boolean(modalDraft.id)}
          onCancel={() => setModalDraft(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
