import { useCallback, useEffect, useState } from 'react';
import type { PersonalCalendarEvent } from '../lib/types';
import { mockPersonalEvents } from '../data/mockPersonalEvents';

const STORAGE_KEY = 'modibodi_personal_calendar_v1';

function loadStoredEvents(): PersonalCalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...mockPersonalEvents];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...mockPersonalEvents];
  } catch {
    return [...mockPersonalEvents];
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

export function usePersonalCalendarStore() {
  const [events, setEvents] = useState<PersonalCalendarEvent[]>(loadStoredEvents);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      /* ignore storage errors */
    }
  }, [events]);

  const saveEvent = useCallback((input: EventSaveInput) => {
    setEvents((prev) => {
      if (input.id) {
        const id = input.id;
        return prev.map((e) => (e.id === id ? { ...input, id } : e));
      }
      return [...prev, { ...input, id: generateId() }];
    });
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { events, saveEvent, deleteEvent };
}
