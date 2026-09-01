# 광고 성과 분석 + 개인 일정관리 탭 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new tabs to the `dashboard-v2` React rebuild — "광고 성과 분석" (Meta creative-level performance with best/replace scoring, mock data) positioned after 마케팅, and "일정관리" (a personal/team work calendar ported from the legacy `index.html` calendar) positioned between 재고 and 설정.

**Architecture:** Two independent feature slices sharing existing conventions. Ad performance follows the existing `MarketingTab`/`StatTile` card pattern with a new pure-function scorer (`creativeScoring.ts`) and mock data. Personal calendar ports the legacy calendar's date/lane-placement algorithms into pure TypeScript functions (`personalCalendarLogic.ts`, ISO-date-string based instead of the legacy `dnum` integer encoding — string comparison is equivalent and simpler), rendered by React components styled with dashboard-v2's page-level design tokens (not the always-dark `GradientCard` system, which is reserved for stat/chart cards), with events persisted to `localStorage` via a dedicated hook.

**Tech Stack:** React 19 + TypeScript, Tailwind v4, lucide-react icons. No test runner is configured in this project (`web/package.json` has no vitest/jest) — verification is `npx tsc -b --noEmit` (type-check) + `npx oxlint` (lint) + manual browser check via the running `npm run dev` server, matching how every existing tab in this repo has been verified (see `docs/superpowers/specs/2026-08-27-dashboard-rebuild-overview-design.md`, "테스트/검증" section). Do not add a test framework as part of this plan.

**Working directory for every step below:** `C:\Users\home\.claude\skills\modibodi-dashboard\.worktrees\dashboard-v2\web`

**Spec:** `docs/superpowers/specs/2026-09-01-ad-performance-personal-calendar-design.md` (in the repo root, one level up from `web/`)

---

## Part A — 광고 성과 분석 탭

### Task 1: Shared types for creatives and calendar events

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Append the new types**

Add to the end of `src/lib/types.ts`:

```ts
export type CreativeFormat = 'image' | 'video' | 'carousel';
export type CreativeStatus = 'active' | 'paused';
export type CreativeGrade = 'best' | 'good' | 'replace';

export interface AdCreativeRow {
  id: string;
  name: string;
  format: CreativeFormat;
  channel: 'Meta';
  status: CreativeStatus;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  startDate: string;
}

export interface PersonalCalendarEvent {
  id: string;
  title: string;
  desc: string;
  /** ISO date, e.g. '2026-09-01'. Inclusive. */
  start: string;
  /** ISO date, inclusive, >= start. */
  end: string;
  color: string;
  /** 'HH:MM', 24h. */
  startTime: string;
  endTime: string;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors (this file has no consumers yet, so this just confirms the syntax is valid).

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(types): add AdCreativeRow and PersonalCalendarEvent types"
```

---

### Task 2: Creative scoring function

**Files:**
- Create: `src/lib/creativeScoring.ts`

- [ ] **Step 1: Write the scoring function**

```ts
import type { AdCreativeRow, CreativeGrade } from './types';

export interface CreativeScore {
  id: string;
  ctr: number;
  cpa: number;
  grade: CreativeGrade;
}

const DEFAULT_TOP_PCT = 0.2;
const DEFAULT_BOTTOM_PCT = 0.2;

/**
 * Grades creatives by a blended CTR/CPA percentile: CTR ranked ascending (higher = better),
 * CPA ranked descending (lower = better, so the worst/highest CPA gets percentile 0). Each
 * creative's blended percentile is the average of its two rank-percentiles. Top `topPct` ->
 * 'best', bottom `bottomPct` -> 'replace', everything else -> 'good'. Creatives with zero
 * conversions get cpa = Infinity, which naturally sorts to the worst CPA percentile.
 */
export function rankCreatives(
  creatives: AdCreativeRow[],
  opts: { topPct?: number; bottomPct?: number } = {},
): CreativeScore[] {
  const topPct = opts.topPct ?? DEFAULT_TOP_PCT;
  const bottomPct = opts.bottomPct ?? DEFAULT_BOTTOM_PCT;

  const withMetrics = creatives.map((c) => ({
    id: c.id,
    ctr: c.impressions > 0 ? c.clicks / c.impressions : 0,
    cpa: c.conversions > 0 ? c.spend / c.conversions : Infinity,
  }));

  const n = withMetrics.length;
  if (n === 0) return [];

  const byCtrAsc = [...withMetrics].sort((a, b) => a.ctr - b.ctr);
  const byCpaDesc = [...withMetrics].sort((a, b) => b.cpa - a.cpa);

  const ctrPercentile = new Map<string, number>();
  byCtrAsc.forEach((c, i) => ctrPercentile.set(c.id, n === 1 ? 1 : i / (n - 1)));

  const cpaPercentile = new Map<string, number>();
  byCpaDesc.forEach((c, i) => cpaPercentile.set(c.id, n === 1 ? 1 : i / (n - 1)));

  return withMetrics.map((c) => {
    const blended = ((ctrPercentile.get(c.id) ?? 0) + (cpaPercentile.get(c.id) ?? 0)) / 2;
    let grade: CreativeGrade = 'good';
    if (blended >= 1 - topPct) grade = 'best';
    else if (blended < bottomPct) grade = 'replace';
    return { id: c.id, ctr: c.ctr, cpa: c.cpa, grade };
  });
}
```

- [ ] **Step 2: Sanity-check the math by hand**

With 5 creatives whose CTR ranks ascending are `[A,B,C,D,E]` and whose CPA (lower=better) ranks
from worst to best also happen to be `[A,B,C,D,E]`, `rankCreatives` should return `E` as
`'best'` (blended percentile 1.0) and `A` as `'replace'` (blended percentile 0.0), with
`B`, `C`, `D` as `'good'`. Confirm this by reading through the function once more — `byCtrAsc`
puts the lowest CTR at index 0 (percentile 0) and highest at index `n-1` (percentile 1);
`byCpaDesc` puts the highest (worst) CPA at index 0 (percentile 0) and lowest (best) CPA at
index `n-1` (percentile 1). Both percentiles agree that higher = better, so averaging them is
valid. This will be exercised for real once the mock data is wired into the tab in Task 6.

- [ ] **Step 3: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/creativeScoring.ts
git commit -m "feat(marketing): add CTR/CPA percentile-based creative scoring"
```

---

### Task 3: Mock ad creative data

**Files:**
- Create: `src/data/mockAdCreatives.ts`

- [ ] **Step 1: Write the mock dataset**

```ts
import type { AdCreativeRow } from '../lib/types';

/**
 * Meta creative-level performance, mocked. Deliberately spread across a wide CTR/CPA range
 * so `rankCreatives` (creativeScoring.ts) produces a visible mix of best/good/replace grades.
 * Real Meta creative-API sync (incl. thumbnail images) is out of scope — see the design spec.
 */
export const mockAdCreatives: AdCreativeRow[] = [
  { id: 'ad-1', name: '클래식 브리프 여름 세일 숏폼', format: 'video', channel: 'Meta', status: 'active', spend: 950_000, impressions: 210_000, clicks: 6_300, conversions: 210, startDate: '2026-07-02' },
  { id: 'ad-2', name: '심프리 하이웨스트 UGC 후기', format: 'video', channel: 'Meta', status: 'active', spend: 820_000, impressions: 180_000, clicks: 5_400, conversions: 205, startDate: '2026-07-10' },
  { id: 'ad-3', name: '틴 브리프 백투스쿨 캐러셀', format: 'carousel', channel: 'Meta', status: 'active', spend: 700_000, impressions: 150_000, clicks: 3_000, conversions: 140, startDate: '2026-07-18' },
  { id: 'ad-4', name: '스윔 보텀 여름 마감 이미지', format: 'image', channel: 'Meta', status: 'active', spend: 600_000, impressions: 130_000, clicks: 2_340, conversions: 110, startDate: '2026-06-28' },
  { id: 'ad-5', name: '클래식 브리프 비교 이미지', format: 'image', channel: 'Meta', status: 'active', spend: 680_000, impressions: 160_000, clicks: 2_560, conversions: 118, startDate: '2026-07-05' },
  { id: 'ad-6', name: '심프리 하이웨스트 베네핏 캐러셀', format: 'carousel', channel: 'Meta', status: 'active', spend: 590_000, impressions: 140_000, clicks: 2_100, conversions: 96, startDate: '2026-07-22' },
  { id: 'ad-7', name: '틴 브리프 인플루언서 영상', format: 'video', channel: 'Meta', status: 'active', spend: 760_000, impressions: 175_000, clicks: 2_450, conversions: 118, startDate: '2026-08-01' },
  { id: 'ad-8', name: '스윔 보텀 착용컷 이미지', format: 'image', channel: 'Meta', status: 'active', spend: 540_000, impressions: 120_000, clicks: 1_440, conversions: 78, startDate: '2026-06-20' },
  { id: 'ad-9', name: '클래식 브리프 정적 배너', format: 'image', channel: 'Meta', status: 'active', spend: 610_000, impressions: 145_000, clicks: 1_305, conversions: 62, startDate: '2026-06-15' },
  { id: 'ad-10', name: '심프리 하이웨스트 초기 티저', format: 'video', channel: 'Meta', status: 'active', spend: 430_000, impressions: 95_000, clicks: 760, conversions: 34, startDate: '2026-06-10' },
  { id: 'ad-11', name: '틴 브리프 구정보 배너', format: 'image', channel: 'Meta', status: 'active', spend: 470_000, impressions: 110_000, clicks: 770, conversions: 29, startDate: '2026-06-05' },
  { id: 'ad-12', name: '스윔 보텀 재고소진 카피', format: 'image', channel: 'Meta', status: 'active', spend: 520_000, impressions: 100_000, clicks: 600, conversions: 18, startDate: '2026-06-01' },
  { id: 'ad-13', name: '클래식 브리프 구버전 캐러셀', format: 'carousel', channel: 'Meta', status: 'paused', spend: 410_000, impressions: 90_000, clicks: 450, conversions: 9, startDate: '2026-05-20' },
  { id: 'ad-14', name: '심프리 하이웨스트 테스트 소재 A', format: 'image', channel: 'Meta', status: 'active', spend: 260_000, impressions: 60_000, clicks: 240, conversions: 0, startDate: '2026-05-15' },
];
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/mockAdCreatives.ts
git commit -m "feat(marketing): add mock Meta creative dataset"
```

---

### Task 4: CreativeCard component

**Files:**
- Create: `src/components/marketing/CreativeCard.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { GalleryHorizontalIcon, ImageIcon, VideoIcon, type LucideIcon } from 'lucide-react';
import { GradientCard } from '../ui/GradientCard';
import { formatKRW, formatNumber, formatPercent } from '../../lib/format';
import type { AdCreativeRow, CreativeGrade, CreativeFormat } from '../../lib/types';
import type { CreativeScore } from '../../lib/creativeScoring';

export type ScoredCreative = AdCreativeRow & CreativeScore;

const FORMAT_ICON: Record<CreativeFormat, LucideIcon> = {
  image: ImageIcon,
  video: VideoIcon,
  carousel: GalleryHorizontalIcon,
};

const GRADE_CONFIG: Record<CreativeGrade, { label: string; className: string }> = {
  best: { label: '베스트', className: 'text-card-good bg-card-good/15' },
  good: { label: '양호', className: 'text-card-silver bg-white/8' },
  replace: { label: '교체 권장', className: 'text-card-critical bg-card-critical/15' },
};

export function CreativeCard({ creative }: { creative: ScoredCreative }) {
  const FormatIcon = FORMAT_ICON[creative.format];
  const grade = GRADE_CONFIG[creative.grade];

  return (
    <GradientCard radius={22} padding="p-4" className="card-shadow">
      <div className="relative mb-3 flex aspect-[4/3] items-center justify-center rounded-xl bg-white/6">
        <FormatIcon size={28} strokeWidth={1.75} className="text-white/25" />
        <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${grade.className}`}>
          {grade.label}
        </span>
      </div>
      <p className="truncate text-[13.5px] font-semibold text-card-text">{creative.name}</p>
      <div className="mt-1 flex items-center gap-2 text-[11px] text-white/45">
        <span>{creative.channel}</span>
        <span>·</span>
        <span>{creative.status === 'active' ? '집행중' : '중지'}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-card-hairline pt-3 text-[12px]">
        <div>
          <p className="text-white/45">지출</p>
          <p className="num-mono font-semibold text-card-text">{formatKRW(creative.spend)}</p>
        </div>
        <div>
          <p className="text-white/45">전환</p>
          <p className="num-mono font-semibold text-card-text">{formatNumber(creative.conversions)}건</p>
        </div>
        <div>
          <p className="text-white/45">CTR</p>
          <p className="num-mono font-semibold text-card-text">{formatPercent(creative.ctr * 100, 2)}</p>
        </div>
        <div>
          <p className="text-white/45">CPA</p>
          <p className="num-mono font-semibold text-card-text">
            {Number.isFinite(creative.cpa) ? formatKRW(creative.cpa) : '전환 없음'}
          </p>
        </div>
      </div>
    </GradientCard>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/marketing/CreativeCard.tsx
git commit -m "feat(marketing): add CreativeCard component"
```

---

### Task 5: AdPerformanceTab component

**Files:**
- Create: `src/components/marketing/AdPerformanceTab.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { useMemo, useState } from 'react';
import { ImagesIcon, ListFilterIcon, RefreshCwIcon } from 'lucide-react';
import { GradientCard } from '../ui/GradientCard';
import { ChartCard } from '../ui/ChartCard';
import { CreativeCard, type ScoredCreative } from './CreativeCard';
import { rankCreatives } from '../../lib/creativeScoring';
import { mockAdCreatives } from '../../data/mockAdCreatives';
import { formatNumber, formatPercent } from '../../lib/format';
import type { CreativeGrade } from '../../lib/types';

const GRADE_FILTERS: { id: CreativeGrade | 'all'; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'best', label: '베스트' },
  { id: 'good', label: '양호' },
  { id: 'replace', label: '교체 권장' },
];

export function AdPerformanceTab() {
  const [gradeFilter, setGradeFilter] = useState<CreativeGrade | 'all'>('all');

  const scored: ScoredCreative[] = useMemo(() => {
    const scores = rankCreatives(mockAdCreatives);
    const scoreById = new Map(scores.map((s) => [s.id, s]));
    return mockAdCreatives.map((c) => ({ ...c, ...scoreById.get(c.id)! }));
  }, []);

  const replaceCount = scored.filter((c) => c.grade === 'replace').length;
  const avgCtr = scored.reduce((sum, c) => sum + c.ctr, 0) / scored.length;
  const avgCpaSamples = scored.filter((c) => Number.isFinite(c.cpa));
  const avgCpa = avgCpaSamples.reduce((sum, c) => sum + c.cpa, 0) / avgCpaSamples.length;

  const visible = gradeFilter === 'all' ? scored : scored.filter((c) => c.grade === gradeFilter);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-extrabold text-ink">광고 성과 분석</h1>
        <p className="mt-0.5 text-[13px] text-ink-secondary">
          Meta 소재별 성과를 한눈에 확인하고 교체가 필요한 소재를 빠르게 찾아보세요.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GradientCard radius={22} padding="p-4" className="card-shadow">
          <div className="flex items-center gap-2 text-[12.5px] font-medium text-white/55">
            <ImagesIcon size={15} className="text-[var(--card-silver)]" />
            총 소재 수
          </div>
          <p className="num-mono mt-2 text-[22px] font-bold text-card-text">{scored.length}개</p>
        </GradientCard>
        <GradientCard radius={22} padding="p-4" className="card-shadow">
          <div className="flex items-center gap-2 text-[12.5px] font-medium text-white/55">
            <ListFilterIcon size={15} className="text-[var(--card-silver)]" />
            평균 CTR · CPA
          </div>
          <p className="num-mono mt-2 text-[15px] font-bold text-card-text">
            {formatPercent(avgCtr * 100, 2)} · {formatNumber(Math.round(avgCpa))}원
          </p>
        </GradientCard>
        <GradientCard radius={22} padding="p-4" className="card-shadow">
          <div className="flex items-center gap-2 text-[12.5px] font-medium text-white/55">
            <RefreshCwIcon size={15} className="text-card-critical" />
            교체 권장 소재
          </div>
          <p className="num-mono mt-2 text-[22px] font-bold text-card-critical">{replaceCount}개</p>
        </GradientCard>
      </div>

      <ChartCard
        title="소재별 성과"
        subtitle="CPA는 낮을수록, CTR은 높을수록 상대 순위가 높습니다."
        trailing={
          <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 p-0.5">
            {GRADE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setGradeFilter(f.id)}
                className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  gradeFilter === f.id ? 'bg-white/15 text-card-text' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      >
        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((c) => (
              <CreativeCard key={c.id} creative={c} />
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-[13px] text-white/40">해당 등급의 소재가 없습니다.</p>
        )}
      </ChartCard>

      <p className="text-[11.5px] text-ink-muted">
        * 현재는 목업 데이터입니다. Meta 소재 단위 API 연동 후 실데이터로 자동 갱신될 예정입니다.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/marketing/AdPerformanceTab.tsx
git commit -m "feat(marketing): add AdPerformanceTab component"
```

---

### Task 6: Wire the 광고 성과 분석 tab into the sidebar and verify in the browser

**Files:**
- Modify: `src/data/tabs.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add the tab entry**

In `src/data/tabs.ts`, add `ImagesIcon` to the `lucide-react` import list, and insert a new
entry right after `marketing` in the `TABS` array:

```ts
{ id: 'ad-performance', label: '광고 성과 분석', icon: ImagesIcon },
```

- [ ] **Step 2: Register the component**

In `src/App.tsx`, add the import:

```ts
import { AdPerformanceTab } from './components/marketing/AdPerformanceTab';
```

And add this entry to `TAB_COMPONENTS`, right after `marketing: MarketingTab,`:

```ts
'ad-performance': AdPerformanceTab,
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc -b --noEmit && npx oxlint`
Expected: no errors.

- [ ] **Step 4: Verify in the browser**

The dev server should already be running (`npm run dev` on port 5184, per the earlier session).
If it isn't, start it: `npm run dev -- --port 5184 --strictPort` (run in background). Then open
http://localhost:5184/ and:
- Confirm "광고 성과 분석" appears in the sidebar between 마케팅 and 캠페인 캘린더.
- Click it. Confirm the 3 summary tiles render, the grade filter buttons work, and the creative
  grid shows a mix of 베스트/양호/교체권장 badges (not all the same grade — this confirms
  `rankCreatives` is producing a real spread from Task 3's mock data).
- Toggle light/dark mode (sidebar bottom button) and confirm the tab still reads correctly in
  both.

- [ ] **Step 5: Commit**

```bash
git add src/data/tabs.ts src/App.tsx
git commit -m "feat(marketing): wire up 광고 성과 분석 tab"
```

---

## Part B — 일정관리 (개인 캘린더) 탭

### Task 7: Personal calendar pure logic functions

**Files:**
- Create: `src/components/calendar/personalCalendarLogic.ts`

- [ ] **Step 1: Write the logic module**

```ts
import type { PersonalCalendarEvent } from '../../lib/types';

export const WEEKDAY_LABELS = ['월', '화', '수', '목', '금'] as const;
export const MAX_VISIBLE_LANES = 3;

export interface MonthDayCell {
  day: number;
  col: number; // 0=Mon .. 4=Fri
  iso: string;
}

export type MonthWeekRow = (MonthDayCell | null)[]; // always length 5

/** Builds Mon-Fri-only week rows for a given month (weekends are dropped — this is a work-
 * schedule calendar, ported from the legacy index.html calendar which does the same). */
export function buildMonthWeekRows(year: number, month: number): MonthWeekRow[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const rows: MonthWeekRow[] = [];
  let currentRow: MonthWeekRow = new Array(5).fill(null);
  let started = false;

  for (let day = 1; day <= daysInMonth; day++) {
    const weekday = new Date(year, month - 1, day).getDay(); // 0=Sun .. 6=Sat
    if (weekday === 0 || weekday === 6) continue;
    const col = weekday - 1; // Mon=0 .. Fri=4
    if (col === 0 && started) {
      rows.push(currentRow);
      currentRow = new Array(5).fill(null);
    }
    currentRow[col] = { day, col, iso: isoDate(year, month, day) };
    started = true;
  }
  if (started) rows.push(currentRow);
  return rows;
}

export function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export interface PlacedEventBar {
  event: PersonalCalendarEvent;
  colStart: number;
  colEnd: number;
  lane: number;
  roundLeft: boolean;
  roundRight: boolean;
}

/** Places every event overlapping a week row into non-overlapping lanes (greedy first-fit —
 * same algorithm as the legacy calendar). Returns ALL placements, including lanes >=
 * MAX_VISIBLE_LANES; callers filter to `lane < MAX_VISIBLE_LANES` for the bars they render and
 * use `eventsOnDay()` for the "+N more" overflow count. */
export function placeEventBars(weekRow: MonthWeekRow, events: PersonalCalendarEvent[]): PlacedEventBar[] {
  const weekDays = weekRow.filter((c): c is MonthDayCell => c !== null);
  const lanes: { colStart: number; colEnd: number }[][] = [];
  const placed: PlacedEventBar[] = [];

  for (const event of events) {
    const overlap = weekDays.filter((wd) => wd.iso >= event.start && wd.iso <= event.end);
    if (overlap.length === 0) continue;
    const colStart = overlap[0].col;
    const colEnd = overlap[overlap.length - 1].col;
    let lane = lanes.findIndex((l) => !l.some((o) => !(colEnd < o.colStart || colStart > o.colEnd)));
    if (lane === -1) {
      lane = lanes.length;
      lanes.push([]);
    }
    lanes[lane].push({ colStart, colEnd });
    placed.push({
      event,
      colStart,
      colEnd,
      lane,
      roundLeft: overlap[0].iso === event.start,
      roundRight: overlap[overlap.length - 1].iso === event.end,
    });
  }
  return placed;
}

/** Every event covering a given day, from the full events list (not week-scoped). */
export function eventsOnDay(iso: string, events: PersonalCalendarEvent[]): PersonalCalendarEvent[] {
  return events.filter((e) => iso >= e.start && iso <= e.end);
}

/** 06:00-23:30 in 30-minute steps, matching the legacy calendar's time picker range. */
export function timeOptions(): string[] {
  const opts: string[] = [];
  for (let h = 6; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return opts;
}

export const EVENT_COLORS = [
  { name: '그레이', value: '#9CA3AF' },
  { name: '블루', value: '#60A5FA' },
  { name: '그린', value: '#4ADE80' },
  { name: '퍼플', value: '#C084FC' },
  { name: '오렌지', value: '#FB923C' },
  { name: '레드', value: '#F87171' },
] as const;

/** Monday of the work week containing `date`. */
export function startOfWorkWeek(date: Date): Date {
  const d = new Date(date);
  const weekday = d.getDay(); // 0=Sun..6=Sat
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function dateToISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
```

- [ ] **Step 2: Sanity-check `buildMonthWeekRows` by hand**

September 2026: Sept 1 is a Tuesday. `buildMonthWeekRows(2026, 9)` should produce a first row
`[null, day1, day2, day3, day4]` (Mon slot empty, Tue=1 .. Fri=4), and weekends (Sept 5-6, 12-13,
19-20, 26-27) should never appear in any row. Confirm this by re-reading the loop: it only
pushes a new row when `col === 0` (Monday) *and* a row has already been started, which correctly
handles a month that doesn't start on Monday.

- [ ] **Step 3: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/calendar/personalCalendarLogic.ts
git commit -m "feat(calendar): add personal calendar date/lane-placement logic"
```

---

### Task 8: Mock personal calendar events

**Files:**
- Create: `src/data/mockPersonalEvents.ts`

- [ ] **Step 1: Write the seed data**

Ported from the legacy `index.html` calendar's seed events, re-dated around this project's
`TODAY` (2026-09-01, see `mockOverview.ts`):

```ts
import type { PersonalCalendarEvent } from '../lib/types';

export const mockPersonalEvents: PersonalCalendarEvent[] = [
  { id: 'seed-1', title: '본부장님 회의', desc: '', start: '2026-08-27', end: '2026-08-27', color: '#60A5FA', startTime: '11:00', endTime: '12:00' },
  { id: 'seed-2', title: '연차 · 윤슬', desc: '', start: '2026-08-27', end: '2026-08-27', color: '#4ADE80', startTime: '09:00', endTime: '18:00' },
  { id: 'seed-3', title: '연차 · 성민', desc: '', start: '2026-08-28', end: '2026-08-28', color: '#4ADE80', startTime: '09:00', endTime: '18:00' },
  { id: 'seed-4', title: '브랜더진 캠페인 세팅', desc: '', start: '2026-08-31', end: '2026-09-01', color: '#9CA3AF', startTime: '14:00', endTime: '16:00' },
  { id: 'seed-5', title: '토스페이먼츠 정산', desc: '', start: '2026-09-02', end: '2026-09-02', color: '#FB923C', startTime: '10:00', endTime: '11:00' },
  { id: 'seed-6', title: '연차 · 지은,종민', desc: '', start: '2026-09-04', end: '2026-09-04', color: '#4ADE80', startTime: '09:00', endTime: '18:00' },
  { id: 'seed-7', title: 'Meta 소재 교체 리뷰', desc: '', start: '2026-09-08', end: '2026-09-08', color: '#F87171', startTime: '15:00', endTime: '16:00' },
];
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/mockPersonalEvents.ts
git commit -m "feat(calendar): add mock personal calendar events"
```

---

### Task 9: localStorage-backed event store hook

**Files:**
- Create: `src/hooks/usePersonalCalendarStore.ts`

- [ ] **Step 1: Write the hook**

```ts
import { useCallback, useEffect, useState } from 'react';
import type { PersonalCalendarEvent } from '../lib/types';
import { mockPersonalEvents } from '../data/mockPersonalEvents';

const STORAGE_KEY = 'modibodi_personal_calendar_v1';

function loadStoredEvents(): PersonalCalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return mockPersonalEvents;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : mockPersonalEvents;
  } catch {
    return mockPersonalEvents;
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/usePersonalCalendarStore.ts
git commit -m "feat(calendar): add localStorage-backed personal event store"
```

---

### Task 10: EventModal component

**Files:**
- Create: `src/components/calendar/EventModal.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { useEffect, useState } from 'react';
import { Trash2Icon, XIcon } from 'lucide-react';
import { EVENT_COLORS, timeOptions } from './personalCalendarLogic';

export interface EventModalDraft {
  id?: string;
  title: string;
  desc: string;
  start: string;
  end: string;
  color: string;
  startTime: string;
  endTime: string;
}

interface EventModalProps {
  draft: EventModalDraft;
  isEditing: boolean;
  onCancel: () => void;
  onSave: (draft: EventModalDraft) => void;
  onDelete: () => void;
}

const TIME_OPTIONS = timeOptions();

function dayCount(start: string, end: string): number {
  const ms = new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

export function EventModal({ draft: initialDraft, isEditing, onCancel, onSave, onDelete }: EventModalProps) {
  const [draft, setDraft] = useState<EventModalDraft>(initialDraft);

  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  function handleDateChange(field: 'start' | 'end', value: string) {
    setDraft((prev) => {
      let start = field === 'start' ? value : prev.start;
      let end = field === 'end' ? value : prev.end;
      if (end < start) [start, end] = [end, start];
      return { ...prev, start, end };
    });
  }

  function handleSave() {
    const title = draft.title.trim() || '새 일정';
    let { start, end } = draft;
    if (end < start) [start, end] = [end, start];
    onSave({ ...draft, title, start, end });
  }

  const days = dayCount(draft.start, draft.end);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div
        className="flex w-full max-w-[640px] overflow-hidden rounded-2xl bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 space-y-3 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-ink">{isEditing ? '일정 수정' : '일정 추가'}</h3>
            <button type="button" onClick={onCancel} className="text-ink-muted hover:text-ink">
              <XIcon size={18} />
            </button>
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-semibold text-ink-secondary">제목</label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="제목을 입력하세요"
              autoFocus
              className="w-full rounded-lg border border-hairline bg-surface-sunken px-3 py-2 text-[13px] text-ink outline-none focus:border-ink-secondary"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-semibold text-ink-secondary">날짜</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={draft.start}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="rounded-lg border border-hairline bg-surface-sunken px-3 py-2 text-[13px] text-ink outline-none"
              />
              <span className="text-ink-muted">–</span>
              <input
                type="date"
                value={draft.end}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="rounded-lg border border-hairline bg-surface-sunken px-3 py-2 text-[13px] text-ink outline-none"
              />
            </div>
            {days > 1 && <p className="mt-1 text-[11px] text-ink-muted">{days}일간</p>}
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-semibold text-ink-secondary">시간</label>
            <div className="flex items-center gap-2">
              <select
                value={draft.startTime}
                onChange={(e) => setDraft((prev) => ({ ...prev, startTime: e.target.value }))}
                className="rounded-lg border border-hairline bg-surface-sunken px-3 py-2 text-[13px] text-ink outline-none"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span className="text-ink-muted">–</span>
              <select
                value={draft.endTime}
                onChange={(e) => setDraft((prev) => ({ ...prev, endTime: e.target.value }))}
                className="rounded-lg border border-hairline bg-surface-sunken px-3 py-2 text-[13px] text-ink outline-none"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-semibold text-ink-secondary">색상</label>
            <div className="flex items-center gap-2">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.name}
                  onClick={() => setDraft((prev) => ({ ...prev, color: c.value }))}
                  className={`h-6 w-6 rounded-full transition-transform ${
                    draft.color === c.value ? 'scale-110 ring-2 ring-ink ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {isEditing && (
              <button
                type="button"
                onClick={onDelete}
                className="mr-auto flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-semibold text-critical hover:bg-critical/10"
              >
                <Trash2Icon size={14} />
                삭제
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-3 py-2 text-[13px] font-semibold text-ink-secondary hover:bg-surface-sunken"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-primary-ink hover:opacity-90"
            >
              저장
            </button>
          </div>
        </div>

        <div className="w-[220px] border-l border-hairline bg-surface-sunken p-6">
          <label className="mb-2 block text-[12px] font-semibold text-ink-secondary">내용</label>
          <textarea
            value={draft.desc}
            onChange={(e) => setDraft((prev) => ({ ...prev, desc: e.target.value }))}
            placeholder="회의/미팅 관련 내용을 자유롭게 정리해두세요"
            className="h-full min-h-[220px] w-full resize-y rounded-lg border border-hairline bg-surface p-3 text-[13px] text-ink outline-none"
          />
        </div>
      </div>
    </div>
  );
}
```

The `resize-y` class on the `<textarea>` (Tailwind for `resize: vertical`) is what gives the
"메모 위아래로 조절" behavior — the browser's native textarea resize handle, same mechanism
the legacy calendar used.

- [ ] **Step 2: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/calendar/EventModal.tsx
git commit -m "feat(calendar): add EventModal component"
```

---

### Task 11: MonthGrid component

**Files:**
- Create: `src/components/calendar/MonthGrid.tsx`

- [ ] **Step 1: Write the component**

```tsx
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

  useEffect(() => {
    function handleGlobalMouseUp() {
      setIsMouseDown(false);
    }
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
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
      className="select-none overflow-hidden rounded-2xl border border-hairline"
      onMouseLeave={() => setIsMouseDown(false)}
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
              const hiddenCount = dayCount - MAX_VISIBLE_LANES;

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
                    <div className="absolute left-1 top-full z-20 mt-1 w-52 rounded-xl border border-hairline bg-surface p-2 shadow-2xl">
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/calendar/MonthGrid.tsx
git commit -m "feat(calendar): add MonthGrid with drag-select and event bars"
```

---

### Task 12: WeekGrid and ReminderStrip components

**Files:**
- Create: `src/components/calendar/WeekGrid.tsx`
- Create: `src/components/calendar/ReminderStrip.tsx`

- [ ] **Step 1: Write WeekGrid**

The legacy week view lays out events as simple stacked blocks per day (its hour rows are purely
decorative — event position was never actually tied to start/end time), so this port keeps the
stacking behavior and drops the decorative hour column.

```tsx
import { WEEKDAY_LABELS, addDays, dateToISO } from './personalCalendarLogic';
import type { PersonalCalendarEvent } from '../../lib/types';

interface WeekGridProps {
  weekStart: Date;
  events: PersonalCalendarEvent[];
  todayIso: string;
  onSelectDay: (iso: string) => void;
  onEditEvent: (event: PersonalCalendarEvent) => void;
}

export function WeekGrid({ weekStart, events, todayIso, onSelectDay, onEditEvent }: WeekGridProps) {
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = addDays(weekStart, i);
    return { iso: dateToISO(d), day: d.getDate(), label: WEEKDAY_LABELS[i] };
  });

  return (
    <div className="grid grid-cols-5 overflow-hidden rounded-2xl border border-hairline">
      {days.map((d) => {
        const dayEvents = events.filter((e) => d.iso >= e.start && d.iso <= e.end);
        const isToday = d.iso === todayIso;
        return (
          <div key={d.iso} className="min-h-[360px] border-r border-hairline last:border-r-0">
            <button
              type="button"
              onClick={() => onSelectDay(d.iso)}
              className="flex w-full flex-col items-center gap-1 border-b border-hairline bg-surface-sunken py-2 hover:bg-surface"
            >
              <span className="text-[11px] font-semibold text-ink-muted">{d.label}</span>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold ${
                  isToday ? 'bg-primary text-primary-ink' : 'text-ink'
                }`}
              >
                {d.day}
              </span>
            </button>
            <div className="space-y-1.5 p-1.5">
              {dayEvents.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onEditEvent(e)}
                  className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-[11.5px] font-semibold"
                  style={{ color: e.color, backgroundColor: `${e.color}22`, border: `1px solid ${e.color}66` }}
                >
                  {e.title}
                  <span className="ml-1 block text-[10px] font-normal opacity-80">
                    {e.startTime}–{e.endTime}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Write ReminderStrip**

```tsx
import type { PersonalCalendarEvent } from '../../lib/types';

interface ReminderStripProps {
  events: PersonalCalendarEvent[];
  todayIso: string;
}

export function ReminderStrip({ events, todayIso }: ReminderStripProps) {
  const upcoming = events
    .filter((e) => e.start >= todayIso)
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 8);

  if (upcoming.length === 0) {
    return <p className="text-[12px] text-ink-muted">다가오는 일정이 없어요</p>;
  }

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1">
      {upcoming.map((e) => {
        const dateLabel =
          e.start === e.end ? formatMonthDay(e.start) : `${formatMonthDay(e.start)} ~ ${formatMonthDay(e.end)}`;
        return (
          <div
            key={e.id}
            className="min-w-[150px] shrink-0 rounded-xl p-2.5"
            style={{
              borderLeft: `3px solid ${e.color}`,
              borderTop: `1px solid ${e.color}55`,
              borderRight: `1px solid ${e.color}55`,
              borderBottom: `1px solid ${e.color}55`,
              backgroundColor: `${e.color}14`,
            }}
          >
            <p className="text-[10.5px] font-extrabold" style={{ color: e.color }}>
              {dateLabel}
            </p>
            <p className="truncate text-[12.5px] font-bold text-ink">{e.title}</p>
            <p className="mt-0.5 text-[10.5px] text-ink-muted">
              {e.startTime} – {e.endTime}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function formatMonthDay(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${Number(m)}월 ${Number(d)}일`;
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/calendar/WeekGrid.tsx src/components/calendar/ReminderStrip.tsx
git commit -m "feat(calendar): add WeekGrid and ReminderStrip components"
```

---

### Task 13: PersonalCalendarTab top-level component

**Files:**
- Create: `src/components/calendar/PersonalCalendarTab.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { useMemo, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from 'lucide-react';
import { EventModal, type EventModalDraft } from './EventModal';
import { MonthGrid } from './MonthGrid';
import { WeekGrid } from './WeekGrid';
import { ReminderStrip } from './ReminderStrip';
import { EVENT_COLORS, addDays, startOfWorkWeek } from './personalCalendarLogic';
import { usePersonalCalendarStore } from '../../hooks/usePersonalCalendarStore';
import { TODAY } from '../../data/mockOverview';
import type { PersonalCalendarEvent } from '../../lib/types';

const TODAY_ISO = TODAY.toISOString().slice(0, 10);
const TODAY_YEAR = TODAY.getUTCFullYear();
const TODAY_MONTH = TODAY.getUTCMonth() + 1;

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
            <button
              type="button"
              onClick={goPrev}
              className="rounded-md p-1 text-ink-secondary hover:bg-surface-sunken hover:text-ink"
            >
              <ChevronLeftIcon size={16} />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-md p-1 text-ink-secondary hover:bg-surface-sunken hover:text-ink"
            >
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/calendar/PersonalCalendarTab.tsx
git commit -m "feat(calendar): add PersonalCalendarTab top-level component"
```

---

### Task 14: Wire the 일정관리 tab into the sidebar and verify in the browser

**Files:**
- Modify: `src/data/tabs.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add the tab entry**

In `src/data/tabs.ts`, add `CalendarRangeIcon` to the `lucide-react` import list, and insert a
new entry right after `inventory` in the `TABS` array (right before `settings`):

```ts
{ id: 'personal-calendar', label: '일정관리', icon: CalendarRangeIcon },
```

The full `TABS` array should now read, in order: `overview, marketing, ad-performance, calendar,
pnl, crm, md, inventory, personal-calendar, settings`.

- [ ] **Step 2: Register the component**

In `src/App.tsx`, add the import:

```ts
import { PersonalCalendarTab } from './components/calendar/PersonalCalendarTab';
```

And add this entry to `TAB_COMPONENTS`, right after `inventory: InventoryTab,`:

```ts
'personal-calendar': PersonalCalendarTab,
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc -b --noEmit && npx oxlint`
Expected: no errors.

- [ ] **Step 4: Verify in the browser**

Open http://localhost:5184/ (dev server should still be running from Task 6) and:
- Confirm "일정관리" appears in the sidebar between 재고 and 설정.
- Click it. Confirm the month grid renders Mon-Fri only, today is highlighted, and the seed
  events from Task 8 appear as colored bars/badges in the right places.
- Click-drag across 2-3 adjacent weekday cells in the month grid. Confirm a range highlight
  follows the drag, and releasing the mouse opens the "일정 추가" modal with the dragged date
  range pre-filled.
- In the modal: type a title, change the time dropdowns, pick a color, type something in the
  내용 textarea, then **drag the textarea's bottom-right resize handle** to confirm it resizes
  vertically. Save.
- Confirm the new event now appears on the grid and in the "꼭 챙겨야 할 리마인드" strip below
  (if its date is today or later).
- Click an existing event bar. Confirm the modal opens in edit mode with a 삭제 button, and that
  deleting it removes it from the grid.
- Switch to 주간 (week) view and confirm events for the current week show up as stacked blocks.
  Click 이전/다음 arrows in both month and week view and confirm navigation works.
- **Reload the page.** Confirm any event you added/edited is still there (this is the
  `localStorage` persistence from Task 9 — the legacy calendar did NOT have this, so this
  specifically needs to be checked, not assumed).
- Toggle light/dark mode and confirm the whole tab (grid, modal, reminder strip) reads correctly
  in both.

- [ ] **Step 5: Commit**

```bash
git add src/data/tabs.ts src/App.tsx
git commit -m "feat(calendar): wire up 일정관리 personal calendar tab"
```

---

## Task 15: Final full-project verification

**Files:** none (verification only)

- [ ] **Step 1: Full production build**

Run: `npm run build`
Expected: succeeds with no TypeScript errors (this runs `tsc -b && vite build`, which is
stricter than the incremental `--noEmit` checks used in earlier tasks).

- [ ] **Step 2: Lint**

Run: `npx oxlint`
Expected: no errors.

- [ ] **Step 3: Re-run the full manual QA checklist from the design spec**

Re-open http://localhost:5184/ and re-check everything from the "테스트 / 검증" section of
`docs/superpowers/specs/2026-09-01-ad-performance-personal-calendar-design.md`: both new tabs
present in the correct sidebar positions, light/dark mode correctness, 광고 성과 분석 filter +
grading behavior, 일정관리 drag-add + textarea resize + month/week toggle + localStorage
persistence.

- [ ] **Step 4: Report status**

Confirm to the user that both tabs are live on http://localhost:5184/, list which of the two
"범위 밖" items from the spec remain (Meta creative API integration, Apps Script backend work),
and remind them that `web/dist` is not yet what GitHub Pages serves — this branch has not been
deployed (see spec's 범위 밖 section: "GitHub Pages 배포 전환" is out of scope for this plan).
