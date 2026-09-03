import { useMemo, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from 'lucide-react';
import { GradientCard } from '../ui/GradientCard';
import { EventModal, type EventModalDraft } from './EventModal';
import { MonthGrid } from './MonthGrid';
import { WeekGrid } from './WeekGrid';
import { UpcomingPanel } from './UpcomingPanel';
import { EVENT_COLORS, addDays, dateToISO, startOfWorkWeek } from './personalCalendarLogic';
import { usePersonalCalendarStore } from '../../hooks/usePersonalCalendarStore';
import type { PersonalCalendarEvent } from '../../lib/types';

// Unlike the other tabs, the personal calendar isn't anchored to the frozen mock-data "TODAY"
// (2026-09-01) — it must reflect the real current date every time the page loads.
const TODAY = new Date();

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
    startTime: '',
    endTime: '',
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
    contentWidth: event.contentWidth,
    contentHeight: event.contentHeight,
  };
}

export function PersonalCalendarTab() {
  const { events, saveEvent, deleteEvent } = usePersonalCalendarStore();
  const [view, setView] = useState<'month' | 'week'>('month');
  const [curYear, setCurYear] = useState(TODAY_YEAR);
  const [curMonth, setCurMonth] = useState(TODAY_MONTH);
  const [weekStart, setWeekStart] = useState(() => startOfWorkWeek(TODAY));
  const [modalDraft, setModalDraft] = useState<EventModalDraft | null>(null);
  const [showUpcoming, setShowUpcoming] = useState(false);

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
    <div className="flex h-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-[20px] font-extrabold text-ink">일정관리</h1>
          <div className="flex items-center gap-1">
            <button type="button" onClick={goPrev} className="rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white/90">
              <ChevronLeftIcon size={16} />
            </button>
            <span className="min-w-[120px] text-center text-[14px] font-bold text-ink">{rangeLabel}</span>
            <button type="button" onClick={goNext} className="rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white/90">
              <ChevronRightIcon size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 p-0.5">
              <button
                type="button"
                onClick={() => setView('month')}
                className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  view === 'month' ? 'bg-white/15 text-card-text' : 'text-white/50 hover:text-white/80'
                }`}
              >
                월간
              </button>
              <button
                type="button"
                onClick={() => setView('week')}
                className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  view === 'week' ? 'bg-white/15 text-card-text' : 'text-white/50 hover:text-white/80'
                }`}
              >
                주간
              </button>
              <div className="mx-0.5 h-4 w-px bg-white/10" />
              <button
                type="button"
                onClick={() => setShowUpcoming((v) => !v)}
                className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  showUpcoming ? 'bg-white/15 text-card-text' : 'text-white/50 hover:text-white/80'
                }`}
              >
                다가오는 일정
              </button>
            </div>

            {showUpcoming && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUpcoming(false)} />
                <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-card-hairline bg-[#1a1a1e] shadow-2xl">
                  <div className="border-b border-card-hairline px-3 py-2 text-[11px] font-bold text-white/50">
                    다가오는 일정 · 가까운 순
                  </div>
                  <UpcomingPanel
                    events={events}
                    todayIso={TODAY_ISO}
                    onSelectEvent={(e) => {
                      setShowUpcoming(false);
                      openEditModal(e);
                    }}
                  />
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => openAddModal(TODAY_ISO, TODAY_ISO)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[13px] font-semibold text-page hover:opacity-90"
          >
            <PlusIcon size={14} />
            일정 추가
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <GradientCard radius={28} padding="p-4" className="card-shadow">
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
        </GradientCard>
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
