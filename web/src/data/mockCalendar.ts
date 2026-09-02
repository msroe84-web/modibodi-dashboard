import type { CalendarEventRow } from '../lib/types';
import { upcomingEvents } from './mockOverview';

/**
 * Campaign calendar events, roughly spanning TODAY-30 .. TODAY+45 (TODAY = 2026-09-01,
 * see mockOverview.ts). Includes the same 3 events from mockOverview's `upcomingEvents`
 * so the calendar tab stays continuous with the Overview alert widget.
 *
 * Status (past/upcoming/D-n) is intentionally NOT stored here — it's derived at render
 * time in CalendarTab.tsx by comparing each `date` against TODAY.
 */
export const calendarEvents: CalendarEventRow[] = [
  // -- past (TODAY-30 .. TODAY-1) --------------------------------------
  { date: '2026-08-04', title: '여름 시즌아웃 공구 시작', type: 'promo' },
  { date: '2026-08-07', title: '네이버 브랜드검색 광고 세팅', type: 'ad' },
  { date: '2026-08-12', title: '심프리 하이웨스트 재입고', type: 'restock' },
  { date: '2026-08-15', title: '무신사 여름 클리어런스 기획전', type: 'promo' },
  { date: '2026-08-19', title: 'Meta 여름 캠페인 소재 교체', type: 'ad' },
  { date: '2026-08-23', title: '틴 브리프 입고', type: 'restock' },
  { date: '2026-08-27', title: '카카오톡 친구 이벤트 공구', type: 'promo' },
  { date: '2026-08-30', title: '구글 검색광고 키워드 확장', type: 'ad' },

  // -- from mockOverview.upcomingEvents (kept in sync with the alert widget) --
  ...upcomingEvents,

  // -- upcoming (TODAY+1 .. TODAY+45) -----------------------------------
  { date: '2026-09-15', title: '29CM 가을 신상 프로모션', type: 'promo' },
  { date: '2026-09-18', title: '틱톡 광고 신규 소재 세팅', type: 'ad' },
  { date: '2026-09-22', title: '스윔 보텀 시즌아웃 공구', type: 'promo' },
  { date: '2026-09-25', title: '심프리 하이웨스트 2차 재입고', type: 'restock' },
  { date: '2026-09-30', title: 'W컨셉 가을 기획전 시작', type: 'promo' },
  { date: '2026-10-02', title: '리타겟팅 광고 소재 교체', type: 'ad' },
  { date: '2026-10-07', title: '클래식 브리프 추가 입고', type: 'restock' },
  { date: '2026-10-10', title: '추석 연휴 프로모션 공구', type: 'promo' },
  { date: '2026-10-16', title: '틴 브리프 재입고', type: 'restock' },
];
