import { useCallback, useEffect, useState } from 'react';
import type { PersonalCalendarEvent } from '../lib/types';
import { fetchFullState, saveFullState } from '../lib/dashboardApi';

const STORAGE_KEY = 'modibodi_personal_calendar_v1';

// Defaults to empty, NOT mockPersonalEvents — this is a real, backend-synced calendar now, so an
// unconfirmed/never-synced state must read as "no events yet", not fake demo content. Seeding with
// mock data here would risk it getting pushed to the shared backend as if it were real (it did,
// once, before this fix — see the personalCalendar-sync commit).
function loadStoredEvents(): PersonalCalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let idCounter = 0;

function generateId(): string {
  idCounter += 1;
  return `personal-${Date.now()}-${idCounter}`;
}

export interface EventSaveInput {
  id?: string;
  title: string;
  desc: string;
  start: string;
  end: string;
  color: string;
  startTime: string;
  endTime: string;
}

/** Events sync through the same shared Apps Script backend as the rest of the dashboard, so they
 *  follow the user across devices/browsers — localStorage is only an instant-paint cache and
 *  offline fallback (same pattern as the rest of the app, per CLAUDE.md). Every write re-fetches
 *  the full backend blob and posts it back with only personalCalendar.events replaced, because
 *  doPost overwrites the entire blob — posting a partial object would wipe out every other
 *  section (sales/marketing/crm/analytics/settings). */
export function usePersonalCalendarStore() {
  const [events, setEvents] = useState<PersonalCalendarEvent[]>(loadStoredEvents);

  useEffect(() => {
    let cancelled = false;
    fetchFullState()
      .then((data) => {
        if (cancelled) return;
        const remote = (data.personalCalendar as { events?: PersonalCalendarEvent[] } | undefined)?.events;
        if (Array.isArray(remote)) setEvents(remote);
      })
      .catch((err: unknown) => {
        console.error('개인 캘린더 서버 동기화 실패, 로컬 캐시로 표시합니다:', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      /* ignore storage errors */
    }
  }, [events]);

  const persistToBackend = useCallback((nextEvents: PersonalCalendarEvent[]) => {
    fetchFullState()
      .then((full) => saveFullState({ ...full, personalCalendar: { events: nextEvents } }))
      .catch((err: unknown) => {
        console.error('개인 캘린더 서버 저장 실패 (로컬에는 반영됨):', err);
      });
  }, []);

  const saveEvent = useCallback(
    (input: EventSaveInput) => {
      setEvents((prev) => {
        const next = input.id
          ? prev.map((e) => (e.id === input.id ? { ...input, id: input.id as string } : e))
          : [...prev, { ...input, id: generateId() }];
        persistToBackend(next);
        return next;
      });
    },
    [persistToBackend],
  );

  const deleteEvent = useCallback(
    (id: string) => {
      setEvents((prev) => {
        const next = prev.filter((e) => e.id !== id);
        persistToBackend(next);
        return next;
      });
    },
    [persistToBackend],
  );

  return { events, saveEvent, deleteEvent };
}
