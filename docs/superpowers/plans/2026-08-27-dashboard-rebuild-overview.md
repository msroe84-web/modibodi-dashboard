# 모디보디 대시보드 리뉴얼 — 기반 구조 + Overview 탭 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a new Vite+React+TypeScript+Tailwind v4 dashboard (`web/`) inside the `modibodi-dashboard` repo, with the shared layout shell (sidebar, dark/light theme, global settings state, shared utils) and a fully working Overview tab backed by realistic mock data — without touching the existing live `index.html`.

**Architecture:** A single-page React app. `AppShell` renders a collapsible `Sidebar` (8 tabs, only "Overview" implemented) plus a content area. Global settings (revenue goal, stock, prices, fees, ad budget) live in a `SettingsContext` backed by `localStorage`; theme (light/dark) is a separate `localStorage`-backed hook with a FOUC-prevention inline script. All time-series data uses a shared `{ date, value }[]` shape and shared `src/lib/dateRange.ts` filter/aggregate functions, so later tabs reuse the same utilities instead of re-implementing them.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind v4 (`@tailwindcss/vite`), Recharts, lucide-react, `@fontsource/noto-sans-kr`, `@fontsource/ibm-plex-mono`, Vitest + React Testing Library + jsdom.

**Spec:** [docs/superpowers/specs/2026-08-27-dashboard-rebuild-overview-design.md](../specs/2026-08-27-dashboard-rebuild-overview-design.md)

---

## Design tokens (already validated — do not re-derive)

The color pairs below were run through the dataviz skill's `validate_palette.js` (categorical checks: lightness band, chroma floor, CVD separation, normal-vision floor, contrast vs surface) during planning. Both pairs **PASS all checks with no WARN**, so no separate "darker chart tone" is needed — the raw brand hex works for headline text, fills, and chart marks in both modes:

- Light mode, surface `#FFFFFF`: `#F65934` (primary) + `#ED429E` (secondary) → CVD ΔE 14.0 (deutan), normal-vision ΔE 15.4, contrast 3.28:1 / 3.58:1 vs white — **PASS**
- Dark mode, surface `#17171A`: same pair → CVD ΔE 14.0, normal-vision ΔE 15.4, contrast 5.45:1 / 5.00:1 vs surface — **PASS**

Status colors (not brand-categorical, checked individually for text contrast, not run through the categorical validator):
- Positive (light): `#15803D` vs white = 5.02:1. Positive (dark): `#4ADE80` vs `#17171A` = 10.27:1.
- Negative (light): `#DC2626` vs white = 4.83:1. Negative (dark): `#F87171` vs `#17171A` = 6.47:1.
- (The more saturated `#16A34A`/`#4ADE80`-style green fails 4.5:1 text contrast on white at 3.30:1 — that's why light-mode positive uses the darker `#15803D` instead of the dark-mode green.)

Task 4 below copies the validator script into the repo and re-runs it as part of the build, so this result is reproducible, not just asserted.

## File Structure

```
modibodi-dashboard/
  web/                              # new Vite project (this plan's scope)
    scripts/validate_palette.js     # copied from dataviz skill, used to verify tokens
    public/
      modibodi-mark.png             # copied from ../assets/logos/modibodi_orange.png
    src/
      main.tsx
      App.tsx
      index.css                     # Tailwind v4 import + design tokens
      lib/
        types.ts
        format.ts
        dateRange.ts
        alerts.ts
      context/
        SettingsContext.tsx
        settingsDefaults.ts
      hooks/
        useTheme.ts
        useCountUp.ts
      data/
        tabs.ts
        mockOverview.ts
      components/
        layout/
          AppShell.tsx
          Sidebar.tsx
          ThemeToggle.tsx
        ui/
          StatCard.tsx
          Sparkline.tsx
          AlertBanner.tsx
          DateRangePicker.tsx
        overview/
          OverviewPage.tsx
      test/
        setup.ts
```

---

### Task 1: Scaffold the Vite project

**Files:**
- Create: `web/` (via `npm create vite`)

- [ ] **Step 1: Scaffold**

Run from the `modibodi-dashboard` repo root:

```bash
npm create vite@latest web -- --template react-ts
```

- [ ] **Step 2: Install base deps**

```bash
cd web
npm install
```

- [ ] **Step 3: Verify the template builds**

Run: `npm run build`
Expected: exits 0, prints a `dist/` output summary with no errors.

- [ ] **Step 4: Commit**

```bash
cd ..
git add web
git commit -m "Scaffold Vite+React+TS project for dashboard renewal"
```

---

### Task 2: Install feature dependencies

**Files:**
- Modify: `web/package.json`

- [ ] **Step 1: Install runtime deps**

```bash
cd web
npm install @tailwindcss/vite tailwindcss recharts lucide-react @fontsource/noto-sans-kr @fontsource/ibm-plex-mono
```

- [ ] **Step 2: Install test deps**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Add the test script**

Edit `web/package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 4: Commit**

```bash
cd ..
git add web/package.json web/package-lock.json
git commit -m "Add Tailwind v4, Recharts, lucide-react, fonts, and Vitest deps"
```

---

### Task 3: Configure Vitest

**Files:**
- Modify: `web/vite.config.ts`
- Create: `web/src/test/setup.ts`
- Create: `web/src/test/setup.test.ts` (smoke test, deleted at the end of the task)

- [ ] **Step 1: Write the failing smoke test**

Create `web/src/test/setup.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

describe('vitest harness', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails to resolve (no config yet)**

Run: `cd web && npx vitest run`
Expected: FAIL or error — no test config wired up yet (or it may pass with defaults but jest-dom matchers are unavailable; either way, proceed to configure).

- [ ] **Step 3: Configure Vitest in vite.config.ts**

Replace `web/vite.config.ts` with:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 4: Write the setup file**

Create `web/src/test/setup.ts`:

```ts
import '@testing-library/jest-dom';

if (!('requestAnimationFrame' in global)) {
  global.requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16) as unknown as number;
  global.cancelAnimationFrame = (id: number) => clearTimeout(id);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run`
Expected: PASS — `vitest harness > runs`

- [ ] **Step 6: Delete the smoke test and commit**

```bash
rm src/test/setup.test.ts
cd ..
git add web/vite.config.ts web/src/test/setup.ts
git commit -m "Configure Vitest + jsdom + React Testing Library"
```

---

### Task 4: Design tokens, fonts, and palette validation

**Files:**
- Modify: `web/index.html`
- Modify: `web/src/index.css`
- Modify: `web/src/main.tsx`
- Create: `web/scripts/validate_palette.js`
- Create: `web/public/modibodi-mark.png`

- [ ] **Step 1: Copy the palette validator into the repo**

Copy the dataviz skill's validator so token checks don't depend on an ephemeral bundled-skill path. As of this plan's writing it lives at:

```bash
cp "C:\Users\home\AppData\Local\Temp\claude\bundled-skills\2.1.246\abbe59412cb806bbf05a4cee2762fc87\dataviz\scripts\validate_palette.js" web/scripts/validate_palette.js
```

That path is versioned and may no longer exist by the time this task runs. If the `cp` fails with "No such file or directory", invoke the `dataviz` skill via the Skill tool — its "Base directory for this skill" line (printed at the top of its output) gives the current path — then re-run the `cp` with `<that base directory>/scripts/validate_palette.js` as the source.

- [ ] **Step 2: Copy the logo asset**

```bash
cp assets/logos/modibodi_orange.png web/public/modibodi-mark.png
```

- [ ] **Step 3: Write the FOUC-prevention script into index.html**

Replace `web/index.html` with:

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>모디보디 대시보드</title>
    <script>
      (function () {
        var stored = localStorage.getItem('modibodi_theme');
        var theme = stored === 'dark' || stored === 'light'
          ? stored
          : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Write design tokens into index.css**

Replace `web/src/index.css` with:

```css
@import "tailwindcss";

:root {
  --bg: #FFFFFF;
  --bg-subtle: #F5F5F5;
  --border: #E5E5E5;
  --text: #171717;
  --text-muted: #737373;
  --brand-primary: #F65934;
  --brand-secondary: #ED429E;
  --positive: #15803D;
  --negative: #DC2626;
  --card-shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.08);
  --card-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] {
  --bg: #17171A;
  --bg-subtle: #1F1F23;
  --border: rgba(255, 255, 255, 0.12);
  --text: #F5F5F5;
  --text-muted: #A3A3A3;
  --brand-primary: #F65934;
  --brand-secondary: #ED429E;
  --positive: #4ADE80;
  --negative: #F87171;
  --card-shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.5);
  --card-shadow-hover: 0 8px 20px rgba(0, 0, 0, 0.55), 0 2px 6px rgba(0, 0, 0, 0.4);
}

@theme {
  --color-bg: var(--bg);
  --color-bg-subtle: var(--bg-subtle);
  --color-border: var(--border);
  --color-text: var(--text);
  --color-text-muted: var(--text-muted);
  --color-brand-primary: var(--brand-primary);
  --color-brand-secondary: var(--brand-secondary);
  --color-positive: var(--positive);
  --color-negative: var(--negative);
  --shadow-card: var(--card-shadow);
  --shadow-card-hover: var(--card-shadow-hover);
  --font-sans: "Noto Sans KR", system-ui, sans-serif;
  --font-mono-num: "IBM Plex Mono", ui-monospace, monospace;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
}

.font-mono-num {
  font-family: var(--font-mono-num);
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 5: Import fonts in main.tsx**

Replace `web/src/main.tsx` with:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/noto-sans-kr/400.css'
import '@fontsource/noto-sans-kr/700.css'
import '@fontsource/noto-sans-kr/800.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

(The `SettingsProvider` wraps `<App />` in Task 9, once it exists.)

- [ ] **Step 6: Re-validate the token pairs**

```bash
node scripts/validate_palette.js "#F65934,#ED429E" --mode light --surface "#FFFFFF"
node scripts/validate_palette.js "#F65934,#ED429E" --mode dark --surface "#17171A"
```

Expected: both print `ALL CHECKS PASS`. If either fails (e.g. the validator script has changed upstream since planning), stop and re-derive the token pair using the dataviz skill's `color-formula.md` before continuing — do not proceed with a failing pair.

- [ ] **Step 7: Verify the app still builds**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 8: Commit**

```bash
cd ..
git add web/index.html web/src/index.css web/src/main.tsx web/scripts/validate_palette.js web/public/modibodi-mark.png
git commit -m "Add design tokens, fonts, FOUC-prevention script, and validate brand palette"
```

---

### Task 5: Shared types

**Files:**
- Create: `web/src/lib/types.ts`

- [ ] **Step 1: Write the types**

Create `web/src/lib/types.ts`:

```ts
export interface TimeSeriesPoint {
  date: string; // ISO date, e.g. "2026-08-20"
  value: number;
}

export type DateRangePreset = 'today' | '7d' | '30d' | 'custom';

export interface DateRange {
  start: string; // ISO date, inclusive
  end: string; // ISO date, inclusive
}

export interface ProductRankingItem {
  id: string;
  name: string;
  line: 'Classic' | 'Seamfree' | 'Swim' | 'Teen';
  revenue: number;
}

export interface ChannelShareItem {
  id: string;
  label: string;
  revenueShare: number; // 0-100
}

export interface StockAlertItem {
  id: string;
  productName: string;
  daysUntilStockout: number;
}

export interface AdBudgetAlertItem {
  id: string;
  channel: string;
  spendRatio: number; // spend / budget, e.g. 1.08 = 108%
}
```

This file has no logic to test — it's type declarations only.

- [ ] **Step 2: Verify it compiles**

Run: `cd web && npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
cd ..
git add web/src/lib/types.ts
git commit -m "Add shared TypeScript types for dashboard data"
```

---

### Task 6: Currency/number formatters

**Files:**
- Create: `web/src/lib/format.ts`
- Test: `web/src/lib/format.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `web/src/lib/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { formatCurrencyKRW, formatCount, formatPercent, formatSignedPercent } from './format';

describe('formatCurrencyKRW', () => {
  it('formats values under 10,000 as plain won', () => {
    expect(formatCurrencyKRW(5400)).toBe('5,400원');
  });

  it('formats values in the 만원 range', () => {
    expect(formatCurrencyKRW(8900000)).toBe('890만원');
  });

  it('formats values over 1억 as 억원 with up to 2 decimals', () => {
    expect(formatCurrencyKRW(203000000)).toBe('2.03억원');
    expect(formatCurrencyKRW(200000000)).toBe('2억원');
  });
});

describe('formatCount', () => {
  it('adds thousands separators', () => {
    expect(formatCount(18420)).toBe('18,420');
  });
});

describe('formatPercent', () => {
  it('formats with the given number of fraction digits', () => {
    expect(formatPercent(33.333, 1)).toBe('33.3%');
    expect(formatPercent(33, 0)).toBe('33%');
  });
});

describe('formatSignedPercent', () => {
  it('prefixes a + for positive values and keeps - for negative', () => {
    expect(formatSignedPercent(8.1)).toBe('+8.1%');
    expect(formatSignedPercent(-4.2)).toBe('-4.2%');
    expect(formatSignedPercent(0)).toBe('0.0%');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/format.test.ts`
Expected: FAIL — `format.ts` does not exist.

- [ ] **Step 3: Implement format.ts**

Create `web/src/lib/format.ts`:

```ts
export function formatCurrencyKRW(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 100000000) {
    const eok = value / 100000000;
    const rounded = Math.round(eok * 100) / 100;
    return `${rounded}억원`;
  }
  if (abs >= 10000) {
    return `${Math.round(value / 10000).toLocaleString('ko-KR')}만원`;
  }
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

export function formatCount(value: number): string {
  return Math.round(value).toLocaleString('ko-KR');
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatSignedPercent(value: number, fractionDigits = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(fractionDigits)}%`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/format.test.ts`
Expected: PASS — all 4 suites green.

- [ ] **Step 5: Commit**

```bash
cd ..
git add web/src/lib/format.ts web/src/lib/format.test.ts
git commit -m "Add currency/count/percent formatters with tests"
```

---

### Task 7: Date range filter/aggregate utilities

**Files:**
- Create: `web/src/lib/dateRange.ts`
- Test: `web/src/lib/dateRange.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `web/src/lib/dateRange.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  resolveDateRange,
  shiftDate,
  filterSeries,
  aggregateSum,
  aggregateAverage,
  previousRange,
  percentChange,
} from './dateRange';
import type { TimeSeriesPoint } from './types';

const TODAY = '2026-08-27';

describe('shiftDate', () => {
  it('shifts forward and backward across month boundaries', () => {
    expect(shiftDate('2026-08-01', -1)).toBe('2026-07-31');
    expect(shiftDate('2026-08-27', 4)).toBe('2026-08-31');
  });
});

describe('resolveDateRange', () => {
  it('resolves "today" to a single-day range', () => {
    expect(resolveDateRange('today', TODAY)).toEqual({ start: TODAY, end: TODAY });
  });

  it('resolves "7d" to a 7-day inclusive range', () => {
    expect(resolveDateRange('7d', TODAY)).toEqual({ start: '2026-08-21', end: TODAY });
  });

  it('resolves "30d" to a 30-day inclusive range', () => {
    expect(resolveDateRange('30d', TODAY)).toEqual({ start: '2026-07-29', end: TODAY });
  });

  it('returns the given range for "custom"', () => {
    const custom = { start: '2026-01-01', end: '2026-01-10' };
    expect(resolveDateRange('custom', TODAY, custom)).toEqual(custom);
  });

  it('throws for "custom" without a range', () => {
    expect(() => resolveDateRange('custom', TODAY)).toThrow();
  });
});

describe('filterSeries', () => {
  const series: TimeSeriesPoint[] = [
    { date: '2026-08-20', value: 1 },
    { date: '2026-08-21', value: 2 },
    { date: '2026-08-22', value: 3 },
  ];

  it('includes both boundary dates', () => {
    const result = filterSeries(series, { start: '2026-08-20', end: '2026-08-22' });
    expect(result).toHaveLength(3);
  });

  it('excludes points outside the range', () => {
    const result = filterSeries(series, { start: '2026-08-21', end: '2026-08-21' });
    expect(result).toEqual([{ date: '2026-08-21', value: 2 }]);
  });
});

describe('aggregateSum / aggregateAverage', () => {
  const series: TimeSeriesPoint[] = [
    { date: '2026-08-20', value: 10 },
    { date: '2026-08-21', value: 20 },
    { date: '2026-08-22', value: 30 },
  ];

  it('sums all values', () => {
    expect(aggregateSum(series)).toBe(60);
  });

  it('averages all values', () => {
    expect(aggregateAverage(series)).toBe(20);
  });

  it('averages to 0 for an empty series', () => {
    expect(aggregateAverage([])).toBe(0);
  });
});

describe('previousRange', () => {
  it('returns the immediately preceding range of the same length', () => {
    expect(previousRange({ start: '2026-08-21', end: '2026-08-27' }))
      .toEqual({ start: '2026-08-14', end: '2026-08-20' });
  });

  it('handles single-day ranges', () => {
    expect(previousRange({ start: '2026-08-27', end: '2026-08-27' }))
      .toEqual({ start: '2026-08-26', end: '2026-08-26' });
  });
});

describe('percentChange', () => {
  it('computes normal percent change', () => {
    expect(percentChange(120, 100)).toBe(20);
    expect(percentChange(80, 100)).toBe(-20);
  });

  it('returns 0 when both current and previous are 0', () => {
    expect(percentChange(0, 0)).toBe(0);
  });

  it('returns 100 when previous is 0 and current is positive', () => {
    expect(percentChange(50, 0)).toBe(100);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/dateRange.test.ts`
Expected: FAIL — `dateRange.ts` does not exist.

- [ ] **Step 3: Implement dateRange.ts**

Create `web/src/lib/dateRange.ts`:

```ts
import type { DateRange, DateRangePreset, TimeSeriesPoint } from './types';

export function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function resolveDateRange(preset: DateRangePreset, today: string, custom?: DateRange): DateRange {
  if (preset === 'custom') {
    if (!custom) throw new Error('custom date range requires start/end');
    return custom;
  }
  if (preset === 'today') return { start: today, end: today };
  const days = preset === '7d' ? 6 : 29;
  return { start: shiftDate(today, -days), end: today };
}

export function filterSeries(series: TimeSeriesPoint[], range: DateRange): TimeSeriesPoint[] {
  return series.filter(p => p.date >= range.start && p.date <= range.end);
}

export function aggregateSum(series: TimeSeriesPoint[]): number {
  return series.reduce((total, p) => total + p.value, 0);
}

export function aggregateAverage(series: TimeSeriesPoint[]): number {
  if (series.length === 0) return 0;
  return aggregateSum(series) / series.length;
}

function dayCount(range: DateRange): number {
  const startMs = new Date(`${range.start}T00:00:00Z`).getTime();
  const endMs = new Date(`${range.end}T00:00:00Z`).getTime();
  return Math.round((endMs - startMs) / 86400000) + 1;
}

export function previousRange(range: DateRange): DateRange {
  const rangeDays = dayCount(range);
  const end = shiftDate(range.start, -1);
  const start = shiftDate(end, -(rangeDays - 1));
  return { start, end };
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/dateRange.test.ts`
Expected: PASS — all suites green.

- [ ] **Step 5: Commit**

```bash
cd ..
git add web/src/lib/dateRange.ts web/src/lib/dateRange.test.ts
git commit -m "Add date range resolve/filter/aggregate/compare utilities with tests"
```

---

### Task 8: Theme hook + toggle

**Files:**
- Create: `web/src/hooks/useTheme.ts`
- Create: `web/src/components/layout/ThemeToggle.tsx`
- Test: `web/src/components/layout/ThemeToggle.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `web/src/components/layout/ThemeToggle.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.clear();
  });

  it('shows "다크 모드" label and toggles to dark on click', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: '다크 모드로 전환' });
    expect(button).toHaveTextContent('다크 모드');

    fireEvent.click(button);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('modibodi_theme')).toBe('dark');
    expect(screen.getByRole('button', { name: '라이트 모드로 전환' })).toHaveTextContent('라이트 모드');
  });

  it('toggles back to light on a second click', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    fireEvent.click(screen.getByRole('button'));

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('modibodi_theme')).toBe('light');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/layout/ThemeToggle.test.tsx`
Expected: FAIL — neither file exists yet.

- [ ] **Step 3: Implement useTheme.ts**

Create `web/src/hooks/useTheme.ts`:

```ts
import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'modibodi_theme';

function readInitialTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }

  return [theme, toggleTheme];
}
```

- [ ] **Step 4: Implement ThemeToggle.tsx**

Create `web/src/components/layout/ThemeToggle.tsx`:

```tsx
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export function ThemeToggle() {
  const [theme, toggleTheme] = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
      className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-subtle"
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      <span>{theme === 'dark' ? '라이트 모드' : '다크 모드'}</span>
    </button>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/layout/ThemeToggle.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd ..
git add web/src/hooks/useTheme.ts web/src/components/layout/ThemeToggle.tsx web/src/components/layout/ThemeToggle.test.tsx
git commit -m "Add theme hook and manual dark/light toggle with tests"
```

---

### Task 9: Settings context

**Files:**
- Create: `web/src/context/settingsDefaults.ts`
- Create: `web/src/context/SettingsContext.tsx`
- Test: `web/src/context/SettingsContext.test.tsx`
- Modify: `web/src/main.tsx`

- [ ] **Step 1: Write the failing test**

Create `web/src/context/SettingsContext.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { SettingsProvider, useSettings } from './SettingsContext';
import { DEFAULT_SETTINGS } from './settingsDefaults';

function Probe() {
  const { settings, updateSettings, resetSettings } = useSettings();
  return (
    <div>
      <span data-testid="goal">{settings.monthlyRevenueGoal}</span>
      <button onClick={() => updateSettings({ monthlyRevenueGoal: 99000000 })}>update</button>
      <button onClick={resetSettings}>reset</button>
    </div>
  );
}

describe('SettingsContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides default settings when localStorage is empty', () => {
    render(<SettingsProvider><Probe /></SettingsProvider>);
    expect(screen.getByTestId('goal')).toHaveTextContent(String(DEFAULT_SETTINGS.monthlyRevenueGoal));
  });

  it('persists updates to localStorage and reflects them immediately', () => {
    render(<SettingsProvider><Probe /></SettingsProvider>);
    fireEvent.click(screen.getByText('update'));

    expect(screen.getByTestId('goal')).toHaveTextContent('99000000');
    const stored = JSON.parse(localStorage.getItem('modibodi_settings_v1')!);
    expect(stored.monthlyRevenueGoal).toBe(99000000);
  });

  it('resets to defaults', () => {
    render(<SettingsProvider><Probe /></SettingsProvider>);
    fireEvent.click(screen.getByText('update'));
    fireEvent.click(screen.getByText('reset'));

    expect(screen.getByTestId('goal')).toHaveTextContent(String(DEFAULT_SETTINGS.monthlyRevenueGoal));
  });

  it('merges partial localStorage data with defaults', () => {
    localStorage.setItem('modibodi_settings_v1', JSON.stringify({ monthlyRevenueGoal: 12345 }));
    render(<SettingsProvider><Probe /></SettingsProvider>);
    expect(screen.getByTestId('goal')).toHaveTextContent('12345');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/context/SettingsContext.test.tsx`
Expected: FAIL — files don't exist.

- [ ] **Step 3: Implement settingsDefaults.ts**

Create `web/src/context/settingsDefaults.ts`:

```ts
export interface SettingsState {
  monthlyRevenueGoal: number;
  stock: Record<string, number>;
  sellingPrice: Record<string, number>;
  costPrice: Record<string, number>;
  feeRate: Record<string, number>;
  adBudget: Record<string, number>;
}

export const DEFAULT_SETTINGS: SettingsState = {
  monthlyRevenueGoal: 50000000,
  stock: {},
  sellingPrice: {},
  costPrice: {},
  feeRate: {},
  adBudget: { meta: 3000000, naver: 1500000, google: 1000000, tiktok: 500000 },
};
```

- [ ] **Step 4: Implement SettingsContext.tsx**

Create `web/src/context/SettingsContext.tsx`:

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEFAULT_SETTINGS, type SettingsState } from './settingsDefaults';

const STORAGE_KEY = 'modibodi_settings_v1';

interface SettingsContextValue {
  settings: SettingsState;
  updateSettings: (patch: Partial<SettingsState>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  function updateSettings(patch: Partial<SettingsState>) {
    setSettings(prev => ({ ...prev, ...patch }));
  }

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS);
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
```

- [ ] **Step 5: Wire the provider into main.tsx**

In `web/src/main.tsx`, add the import and wrap `<App />`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/noto-sans-kr/400.css'
import '@fontsource/noto-sans-kr/700.css'
import '@fontsource/noto-sans-kr/800.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import './index.css'
import App from './App.tsx'
import { SettingsProvider } from './context/SettingsContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </StrictMode>,
)
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/context/SettingsContext.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cd ..
git add web/src/context web/src/main.tsx
git commit -m "Add SettingsContext (revenue goal/stock/prices/fees/ad budget) with localStorage persistence"
```

---

### Task 10: Count-up hook

**Files:**
- Create: `web/src/hooks/useCountUp.ts`
- Test: `web/src/hooks/useCountUp.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `web/src/hooks/useCountUp.test.ts`:

```ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCountUp } from './useCountUp';

describe('useCountUp', () => {
  it('shows the target value immediately on first mount (no animate-from-zero)', async () => {
    const { result } = renderHook(() => useCountUp(100, 20));
    await waitFor(() => expect(result.current).toBe(100));
  });

  it('animates from the previous target to a new target when it changes', async () => {
    const { result, rerender } = renderHook(({ target }) => useCountUp(target, 20), {
      initialProps: { target: 50 },
    });
    expect(result.current).toBe(50);

    rerender({ target: 80 });

    await waitFor(() => expect(result.current).toBe(80), { timeout: 1000 });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/hooks/useCountUp.test.ts`
Expected: FAIL — `useCountUp.ts` does not exist.

- [ ] **Step 3: Implement useCountUp.ts**

Create `web/src/hooks/useCountUp.ts`:

```ts
import { useEffect, useRef, useState } from 'react';

export function useCountUp(target: number, durationMs = 600): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const frameRef = useRef<number>();

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + (target - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
    };
  }, [target, durationMs]);

  return value;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/hooks/useCountUp.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ..
git add web/src/hooks/useCountUp.ts web/src/hooks/useCountUp.test.ts
git commit -m "Add useCountUp hook for animated KPI value transitions"
```

---

### Task 11: Tab list + logo

**Files:**
- Create: `web/src/data/tabs.ts`

- [ ] **Step 1: Write tabs.ts**

Create `web/src/data/tabs.ts`:

```ts
import {
  LayoutDashboard,
  Megaphone,
  CalendarDays,
  Wallet,
  Users,
  Package,
  Boxes,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react';

export interface TabDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  implemented: boolean;
}

export const TABS: TabDefinition[] = [
  { id: 'overview', label: '전체 매출 현황', icon: LayoutDashboard, implemented: true },
  { id: 'marketing', label: '마케팅', icon: Megaphone, implemented: false },
  { id: 'calendar', label: '캠페인 캘린더', icon: CalendarDays, implemented: false },
  { id: 'pnl', label: '손익', icon: Wallet, implemented: false },
  { id: 'crm', label: 'CRM', icon: Users, implemented: false },
  { id: 'md', label: 'MD·상품', icon: Package, implemented: false },
  { id: 'inventory', label: '재고', icon: Boxes, implemented: false },
  { id: 'settings', label: '설정', icon: SettingsIcon, implemented: false },
];
```

This is static data with no logic — no test needed. The logo asset was already copied in Task 4 Step 2.

- [ ] **Step 2: Verify it compiles**

Run: `cd web && npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
cd ..
git add web/src/data/tabs.ts
git commit -m "Add sidebar tab list (8 tabs, Overview implemented)"
```

---

### Task 12: Sidebar

**Files:**
- Create: `web/src/components/layout/Sidebar.tsx`
- Test: `web/src/components/layout/Sidebar.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `web/src/components/layout/Sidebar.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar';
import { TABS } from '../../data/tabs';

describe('Sidebar', () => {
  beforeEach(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.clear();
  });

  it('renders all 8 tab labels', () => {
    render(<Sidebar activeTab="overview" onSelectTab={() => {}} />);
    for (const tab of TABS) {
      expect(screen.getByText(tab.label)).toBeInTheDocument();
    }
  });

  it('marks the active tab with aria-current', () => {
    render(<Sidebar activeTab="marketing" onSelectTab={() => {}} />);
    expect(screen.getByRole('button', { name: /마케팅/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: /전체 매출 현황/ })).not.toHaveAttribute('aria-current');
  });

  it('calls onSelectTab with the clicked tab id', () => {
    const onSelectTab = vi.fn();
    render(<Sidebar activeTab="overview" onSelectTab={onSelectTab} />);
    fireEvent.click(screen.getByRole('button', { name: /CRM/ }));
    expect(onSelectTab).toHaveBeenCalledWith('crm');
  });

  it('collapses and expands via the toggle button', () => {
    render(<Sidebar activeTab="overview" onSelectTab={() => {}} />);
    const collapseButton = screen.getByRole('button', { name: '사이드바 접기' });
    fireEvent.click(collapseButton);
    expect(screen.getByRole('button', { name: '사이드바 펼치기' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/layout/Sidebar.test.tsx`
Expected: FAIL — `Sidebar.tsx` does not exist.

- [ ] **Step 3: Implement Sidebar.tsx**

Create `web/src/components/layout/Sidebar.tsx`:

```tsx
import { useState } from 'react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { TABS } from '../../data/tabs';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (id: string) => void;
}

export function Sidebar({ activeTab, onSelectTab }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="flex h-screen flex-col border-r border-border bg-bg-subtle transition-[width] duration-200"
      style={{ width: collapsed ? 72 : 232 }}
    >
      <div className="flex items-center gap-2 px-4 py-5">
        <img src="/modibodi-mark.png" alt="Modibodi" className="h-7 w-7 flex-shrink-0" />
        <span
          className="overflow-hidden whitespace-nowrap text-sm font-bold text-text transition-[max-width] duration-200"
          style={{ maxWidth: collapsed ? 0 : 160 }}
        >
          모디보디 대시보드
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active ? 'bg-brand-primary text-white' : 'text-text-muted hover:bg-bg hover:text-text'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span
                className="overflow-hidden whitespace-nowrap transition-[max-width] duration-200"
                style={{ maxWidth: collapsed ? 0 : 160 }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-border px-2 py-4">
        {!collapsed && <ThemeToggle />}
        <button
          type="button"
          onClick={() => setCollapsed(prev => !prev)}
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          className="flex w-full items-center justify-center rounded-lg border border-border py-2 text-text-muted hover:bg-bg"
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/layout/Sidebar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ..
git add web/src/components/layout/Sidebar.tsx web/src/components/layout/Sidebar.test.tsx
git commit -m "Add collapsible sidebar with 8-tab navigation"
```

---

### Task 13: AppShell + App wiring

**Files:**
- Create: `web/src/components/layout/AppShell.tsx`
- Modify: `web/src/App.tsx`
- Test: `web/src/App.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `web/src/App.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { SettingsProvider } from './context/SettingsContext';

function renderApp() {
  return render(
    <SettingsProvider>
      <App />
    </SettingsProvider>,
  );
}

describe('App', () => {
  beforeEach(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.clear();
  });

  it('shows the Overview tab by default', () => {
    renderApp();
    expect(screen.getByText('전체 매출 현황')).toBeInTheDocument();
  });

  it('shows a "준비 중" placeholder for unimplemented tabs', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /마케팅/ }));
    expect(screen.getByText('이 탭은 준비 중입니다.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — `OverviewPage` and wiring don't exist yet.

- [ ] **Step 3: Implement AppShell.tsx**

Create `web/src/components/layout/AppShell.tsx`:

```tsx
import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  renderTab: (activeTab: string) => ReactNode;
}

export function AppShell({ renderTab }: AppShellProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex min-h-screen bg-bg text-text">
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto p-8">{renderTab(activeTab)}</main>
    </div>
  );
}
```

- [ ] **Step 4: Add a minimal placeholder OverviewPage (full version comes in Task 19)**

Create `web/src/components/overview/OverviewPage.tsx`:

```tsx
export function OverviewPage() {
  return <h1 className="text-xl font-bold text-text">전체 매출 현황</h1>;
}
```

- [ ] **Step 5: Wire App.tsx**

Replace `web/src/App.tsx` with:

```tsx
import { AppShell } from './components/layout/AppShell';
import { OverviewPage } from './components/overview/OverviewPage';
import { TABS } from './data/tabs';

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-text-muted">
      <p className="text-lg font-semibold text-text">{label}</p>
      <p className="text-sm">이 탭은 준비 중입니다.</p>
    </div>
  );
}

function App() {
  return (
    <AppShell
      renderTab={activeTab => {
        if (activeTab === 'overview') return <OverviewPage />;
        const tab = TABS.find(t => t.id === activeTab);
        return <ComingSoon label={tab?.label ?? ''} />;
      }}
    />
  );
}

export default App;
```

- [ ] **Step 6: Delete the CRA-style default App.css import if present**

Check `web/src/App.tsx` — the scaffold's default content has been fully replaced above, so no `import './App.css'` remains. If `web/src/App.css` still exists and is unused, leave it (harmless); do not delete files outside this plan's scope.

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
cd ..
git add web/src/components/layout/AppShell.tsx web/src/components/overview/OverviewPage.tsx web/src/App.tsx web/src/App.test.tsx
git commit -m "Wire AppShell + tab switching, add placeholder Overview page"
```

---

### Task 14: Sparkline + StatCard

**Files:**
- Create: `web/src/components/ui/Sparkline.tsx`
- Create: `web/src/components/ui/StatCard.tsx`
- Test: `web/src/components/ui/StatCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `web/src/components/ui/StatCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Megaphone } from 'lucide-react';
import { StatCard } from './StatCard';
import { formatCurrencyKRW } from '../../lib/format';

describe('StatCard', () => {
  it('renders the label, formatted value, and positive delta', () => {
    render(
      <StatCard
        icon={Megaphone}
        label="광고비"
        value={8900000}
        formatValue={formatCurrencyKRW}
        deltaPercent={8.1}
      />,
    );
    expect(screen.getByText('광고비')).toBeInTheDocument();
    expect(screen.getByText('890만원')).toBeInTheDocument();
    expect(screen.getByText('▲ 8.1%')).toHaveClass('text-positive');
  });

  it('renders a negative delta with the negative color', () => {
    render(
      <StatCard
        icon={Megaphone}
        label="재구매"
        value={31}
        formatValue={v => `${v}건`}
        deltaPercent={-12.5}
      />,
    );
    expect(screen.getByText('▼ 12.5%')).toHaveClass('text-negative');
  });

  it('renders a sparkline when sparklineData is given', () => {
    render(
      <StatCard
        icon={Megaphone}
        label="유입"
        value={100}
        formatValue={String}
        deltaPercent={1}
        sparklineData={[{ date: '2026-08-20', value: 10 }, { date: '2026-08-21', value: 20 }]}
      />,
    );
    expect(screen.getByRole('img', { name: '최근 7일 추이 스파크라인' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/StatCard.test.tsx`
Expected: FAIL — files don't exist.

- [ ] **Step 3: Implement Sparkline.tsx**

Create `web/src/components/ui/Sparkline.tsx`:

```tsx
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import type { TimeSeriesPoint } from '../../lib/types';

interface SparklineProps {
  data: TimeSeriesPoint[];
  color: string;
}

export function Sparkline({ data, color }: SparklineProps) {
  return (
    <div className="h-10 w-full" role="img" aria-label="최근 7일 추이 스파크라인">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 4: Implement StatCard.tsx**

Create `web/src/components/ui/StatCard.tsx`:

```tsx
import type { LucideIcon } from 'lucide-react';
import { useCountUp } from '../../hooks/useCountUp';
import { Sparkline } from './Sparkline';
import type { TimeSeriesPoint } from '../../lib/types';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  formatValue: (value: number) => string;
  deltaPercent: number;
  sparklineData?: TimeSeriesPoint[];
}

export function StatCard({ icon: Icon, label, value, formatValue, deltaPercent, sparklineData }: StatCardProps) {
  const animatedValue = useCountUp(value);
  const isPositive = deltaPercent >= 0;

  return (
    <div className="rounded-2xl border border-border bg-bg p-5 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary text-white">
        <Icon size={18} />
      </div>
      <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</div>
      <div className="mt-1 font-mono-num text-2xl font-extrabold text-text">
        {formatValue(animatedValue)}
      </div>
      <div className={`mt-2 text-xs font-semibold ${isPositive ? 'text-positive' : 'text-negative'}`}>
        {isPositive ? '▲' : '▼'} {Math.abs(deltaPercent).toFixed(1)}%
      </div>
      {sparklineData && (
        <div className="mt-3">
          <Sparkline data={sparklineData} color="var(--color-brand-primary)" />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/ui/StatCard.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd ..
git add web/src/components/ui/Sparkline.tsx web/src/components/ui/StatCard.tsx web/src/components/ui/StatCard.test.tsx
git commit -m "Add Sparkline and StatCard components with count-up value"
```

---

### Task 15: Alert-building logic

**Files:**
- Create: `web/src/lib/alerts.ts`
- Test: `web/src/lib/alerts.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `web/src/lib/alerts.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildStockAlerts, buildAdBudgetAlerts, buildOverviewAlerts } from './alerts';
import type { AdBudgetAlertItem, StockAlertItem } from './types';

describe('buildStockAlerts', () => {
  it('flags items with 7 or fewer days until stockout as critical', () => {
    const items: StockAlertItem[] = [
      { id: 'a', productName: 'Classic 브리프 (M)', daysUntilStockout: 6 },
      { id: 'b', productName: 'Seamfree 히프스터 (S)', daysUntilStockout: 10 },
    ];
    const alerts = buildStockAlerts(items);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('critical');
    expect(alerts[0].message).toContain('Classic 브리프 (M)');
    expect(alerts[0].message).toContain('6일');
  });
});

describe('buildAdBudgetAlerts', () => {
  it('flags channels at or over 100% spend ratio as critical', () => {
    const items: AdBudgetAlertItem[] = [
      { id: 'meta', channel: 'Meta', spendRatio: 1.08 },
      { id: 'naver', channel: '네이버', spendRatio: 0.9 },
    ];
    const alerts = buildAdBudgetAlerts(items);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('critical');
    expect(alerts[0].message).toContain('Meta');
    expect(alerts[0].message).toContain('108%');
  });
});

describe('buildOverviewAlerts', () => {
  it('combines stock and ad budget alerts', () => {
    const stock: StockAlertItem[] = [{ id: 'a', productName: 'A', daysUntilStockout: 3 }];
    const adBudget: AdBudgetAlertItem[] = [{ id: 'meta', channel: 'Meta', spendRatio: 1.1 }];
    expect(buildOverviewAlerts(stock, adBudget)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/alerts.test.ts`
Expected: FAIL — `alerts.ts` does not exist.

- [ ] **Step 3: Implement alerts.ts**

Create `web/src/lib/alerts.ts`:

```ts
import type { AdBudgetAlertItem, StockAlertItem } from './types';

export type AlertSeverity = 'critical' | 'info';

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  message: string;
}

const STOCK_CRITICAL_DAYS = 7;

export function buildStockAlerts(items: StockAlertItem[]): AlertItem[] {
  return items
    .filter(item => item.daysUntilStockout <= STOCK_CRITICAL_DAYS)
    .map(item => ({
      id: `stock-${item.id}`,
      severity: 'critical' as const,
      message: `${item.productName} 재고 소진 ${item.daysUntilStockout}일 전`,
    }));
}

export function buildAdBudgetAlerts(items: AdBudgetAlertItem[]): AlertItem[] {
  return items
    .filter(item => item.spendRatio >= 1)
    .map(item => ({
      id: `budget-${item.id}`,
      severity: 'critical' as const,
      message: `${item.channel} 광고 예산 ${Math.round(item.spendRatio * 100)}% 소진 (초과)`,
    }));
}

export function buildOverviewAlerts(stock: StockAlertItem[], adBudget: AdBudgetAlertItem[]): AlertItem[] {
  return [...buildStockAlerts(stock), ...buildAdBudgetAlerts(adBudget)];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/alerts.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ..
git add web/src/lib/alerts.ts web/src/lib/alerts.test.ts
git commit -m "Add stock/ad-budget alert-building logic with tests"
```

---

### Task 16: AlertBanner

**Files:**
- Create: `web/src/components/ui/AlertBanner.tsx`
- Test: `web/src/components/ui/AlertBanner.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `web/src/components/ui/AlertBanner.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AlertBanner } from './AlertBanner';
import type { AlertItem } from '../../lib/alerts';

describe('AlertBanner', () => {
  it('renders nothing when there are no alerts', () => {
    const { container } = render(<AlertBanner alerts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders each alert message with role="alert"', () => {
    const alerts: AlertItem[] = [
      { id: '1', severity: 'critical', message: 'Classic 브리프 (M) 재고 소진 6일 전' },
      { id: '2', severity: 'critical', message: 'Meta 광고 예산 108% 소진 (초과)' },
    ];
    render(<AlertBanner alerts={alerts} />);
    const alertEls = screen.getAllByRole('alert');
    expect(alertEls).toHaveLength(2);
    expect(alertEls[0]).toHaveTextContent('Classic 브리프 (M) 재고 소진 6일 전');
    expect(alertEls[1]).toHaveTextContent('Meta 광고 예산 108% 소진 (초과)');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/AlertBanner.test.tsx`
Expected: FAIL — `AlertBanner.tsx` does not exist.

- [ ] **Step 3: Implement AlertBanner.tsx**

Create `web/src/components/ui/AlertBanner.tsx`:

```tsx
import { AlertTriangle } from 'lucide-react';
import type { AlertItem } from '../../lib/alerts';

interface AlertBannerProps {
  alerts: AlertItem[];
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {alerts.map(alert => (
        <div
          key={alert.id}
          role="alert"
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
            alert.severity === 'critical'
              ? 'border-negative/30 bg-negative/10 text-negative'
              : 'border-brand-secondary/30 bg-brand-secondary/10 text-brand-secondary'
          }`}
        >
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span>{alert.message}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/AlertBanner.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ..
git add web/src/components/ui/AlertBanner.tsx web/src/components/ui/AlertBanner.test.tsx
git commit -m "Add AlertBanner (주의 필요 widget) rendering critical/info alerts"
```

---

### Task 17: Mock Overview data

**Files:**
- Create: `web/src/data/mockOverview.ts`
- Test: `web/src/data/mockOverview.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `web/src/data/mockOverview.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  revenueSeries,
  adSpendSeries,
  productRanking,
  channelShare,
  stockAlerts,
  adBudgetAlerts,
  TODAY_ISO,
} from './mockOverview';

describe('mock time series', () => {
  it('covers 60 days ending on TODAY_ISO with no negative values', () => {
    expect(revenueSeries).toHaveLength(60);
    expect(revenueSeries[revenueSeries.length - 1].date).toBe(TODAY_ISO);
    expect(revenueSeries.every(p => p.value >= 0)).toBe(true);
  });

  it('is sorted ascending by date', () => {
    const dates = adSpendSeries.map(p => p.date);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
  });
});

describe('productRanking', () => {
  it('is sorted descending by revenue', () => {
    const revenues = productRanking.map(p => p.revenue);
    const sorted = [...revenues].sort((a, b) => b - a);
    expect(revenues).toEqual(sorted);
  });
});

describe('channelShare', () => {
  it('sums to 100', () => {
    const total = channelShare.reduce((sum, c) => sum + c.revenueShare, 0);
    expect(total).toBe(100);
  });
});

describe('alert source data', () => {
  it('has at least one critical stock alert (<= 7 days) for the AlertBanner to show', () => {
    expect(stockAlerts.some(s => s.daysUntilStockout <= 7)).toBe(true);
  });

  it('has at least one ad budget item at or over 100%', () => {
    expect(adBudgetAlerts.some(a => a.spendRatio >= 1)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/data/mockOverview.test.ts`
Expected: FAIL — `mockOverview.ts` does not exist.

- [ ] **Step 3: Implement mockOverview.ts**

Create `web/src/data/mockOverview.ts`:

```ts
import type { AdBudgetAlertItem, ChannelShareItem, ProductRankingItem, StockAlertItem, TimeSeriesPoint } from '../lib/types';
import { shiftDate } from '../lib/dateRange';

export const TODAY_ISO = '2026-08-27';
const HISTORY_DAYS = 60;

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function buildSeries(baseValue: number, volatility: number, seedOffset: number): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
    const date = shiftDate(TODAY_ISO, -i);
    const noise = (seededRandom(i + seedOffset) - 0.5) * 2 * volatility;
    const trend = 1 + ((HISTORY_DAYS - i) / HISTORY_DAYS) * 0.35;
    const value = Math.max(0, Math.round(baseValue * trend * (1 + noise)));
    points.push({ date, value });
  }
  return points;
}

export const revenueSeries: TimeSeriesPoint[] = buildSeries(2200000, 0.35, 1);
export const adSpendSeries: TimeSeriesPoint[] = buildSeries(300000, 0.25, 2);
export const roasSeries: TimeSeriesPoint[] = buildSeries(180, 0.2, 3);
export const visitSeries: TimeSeriesPoint[] = buildSeries(620, 0.3, 4);
export const conversionSeries: TimeSeriesPoint[] = buildSeries(5, 0.4, 5);
export const repeatPurchaseSeries: TimeSeriesPoint[] = buildSeries(1, 0.5, 6);
export const aovSeries: TimeSeriesPoint[] = buildSeries(52000, 0.15, 7);
export const signupSeries: TimeSeriesPoint[] = buildSeries(3, 0.45, 8);

export const productRanking: ProductRankingItem[] = [
  { id: 'classic-brief', name: 'Classic 브리프', line: 'Classic', revenue: 18500000 },
  { id: 'seamfree-hipster', name: 'Seamfree 히프스터', line: 'Seamfree', revenue: 9200000 },
  { id: 'swim-bottom', name: 'Swim 수영복 하의', line: 'Swim', revenue: 4100000 },
  { id: 'teen-brief', name: 'Teen 브리프', line: 'Teen', revenue: 2600000 },
];

export const channelShare: ChannelShareItem[] = [
  { id: 'own-mall', label: '자사몰 (카페24)', revenueShare: 68 },
  { id: 'external-mall', label: '외부몰 (29CM 등)', revenueShare: 24 },
  { id: 'group-buy', label: '인플루언서 공구', revenueShare: 8 },
];

export const stockAlerts: StockAlertItem[] = [
  { id: 'classic-brief', productName: 'Classic 브리프 (M)', daysUntilStockout: 6 },
  { id: 'seamfree-hipster', productName: 'Seamfree 히프스터 (S)', daysUntilStockout: 9 },
];

export const adBudgetAlerts: AdBudgetAlertItem[] = [
  { id: 'meta', channel: 'Meta', spendRatio: 1.08 },
];
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/data/mockOverview.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ..
git add web/src/data/mockOverview.ts web/src/data/mockOverview.test.ts
git commit -m "Add realistic mock data for Overview tab (60-day series, products, channels, alerts)"
```

---

### Task 18: DateRangePicker

**Files:**
- Create: `web/src/components/ui/DateRangePicker.tsx`
- Test: `web/src/components/ui/DateRangePicker.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `web/src/components/ui/DateRangePicker.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DateRangePicker } from './DateRangePicker';
import { resolveDateRange } from '../../lib/dateRange';

const TODAY = '2026-08-27';

describe('DateRangePicker', () => {
  it('calls onChange with the resolved range when a preset is clicked', () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        today={TODAY}
        preset="30d"
        customRange={{ start: TODAY, end: TODAY }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '7일' }));
    expect(onChange).toHaveBeenCalledWith('7d', resolveDateRange('7d', TODAY));
  });

  it('shows aria-pressed on the active preset', () => {
    render(
      <DateRangePicker
        today={TODAY}
        preset="today"
        customRange={{ start: TODAY, end: TODAY }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: '오늘' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '7일' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows custom date inputs when "직접 지정" is selected and reports changes', () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        today={TODAY}
        preset="custom"
        customRange={{ start: '2026-08-01', end: '2026-08-10' }}
        onChange={onChange}
      />,
    );
    const startInput = screen.getByLabelText('시작일') as HTMLInputElement;
    expect(startInput.value).toBe('2026-08-01');

    fireEvent.change(startInput, { target: { value: '2026-08-05' } });
    expect(onChange).toHaveBeenCalledWith('custom', { start: '2026-08-05', end: '2026-08-10' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/DateRangePicker.test.tsx`
Expected: FAIL — `DateRangePicker.tsx` does not exist.

- [ ] **Step 3: Implement DateRangePicker.tsx**

Create `web/src/components/ui/DateRangePicker.tsx`:

```tsx
import type { DateRange, DateRangePreset } from '../../lib/types';
import { resolveDateRange } from '../../lib/dateRange';

interface DateRangePickerProps {
  today: string;
  preset: DateRangePreset;
  customRange: DateRange;
  onChange: (preset: DateRangePreset, range: DateRange) => void;
}

const PRESET_OPTIONS: { id: DateRangePreset; label: string }[] = [
  { id: 'today', label: '오늘' },
  { id: '7d', label: '7일' },
  { id: '30d', label: '30일' },
  { id: 'custom', label: '직접 지정' },
];

export function DateRangePicker({ today, preset, customRange, onChange }: DateRangePickerProps) {
  function selectPreset(next: DateRangePreset) {
    if (next === 'custom') {
      onChange('custom', customRange);
      return;
    }
    onChange(next, resolveDateRange(next, today));
  }

  function updateCustomRange(patch: Partial<DateRange>) {
    onChange('custom', { ...customRange, ...patch });
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div className="inline-flex rounded-lg border border-border bg-bg p-1">
        {PRESET_OPTIONS.map(option => (
          <button
            key={option.id}
            type="button"
            onClick={() => selectPreset(option.id)}
            aria-pressed={preset === option.id}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              preset === option.id ? 'bg-brand-primary text-white' : 'text-text-muted hover:bg-bg-subtle'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className="flex items-center gap-1 text-sm">
          <input
            type="date"
            aria-label="시작일"
            value={customRange.start}
            max={customRange.end}
            onChange={e => updateCustomRange({ start: e.target.value })}
            className="rounded-md border border-border bg-bg px-2 py-1"
          />
          <span className="text-text-muted">~</span>
          <input
            type="date"
            aria-label="종료일"
            value={customRange.end}
            min={customRange.start}
            max={today}
            onChange={e => updateCustomRange({ end: e.target.value })}
            className="rounded-md border border-border bg-bg px-2 py-1"
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/DateRangePicker.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ..
git add web/src/components/ui/DateRangePicker.tsx web/src/components/ui/DateRangePicker.test.tsx
git commit -m "Add DateRangePicker (오늘/7일/30일/직접 지정) with custom range inputs"
```

---

### Task 19: OverviewPage assembly

**Files:**
- Modify: `web/src/components/overview/OverviewPage.tsx`
- Test: `web/src/components/overview/OverviewPage.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `web/src/components/overview/OverviewPage.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { OverviewPage } from './OverviewPage';
import { SettingsProvider } from '../../context/SettingsContext';
import { revenueSeries, TODAY_ISO } from '../../data/mockOverview';
import { filterSeries, aggregateSum, resolveDateRange } from '../../lib/dateRange';
import { formatCurrencyKRW } from '../../lib/format';

function renderOverview() {
  return render(
    <SettingsProvider>
      <OverviewPage />
    </SettingsProvider>,
  );
}

describe('OverviewPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the default 30-day revenue total in the hero', () => {
    renderOverview();
    const range = resolveDateRange('30d', TODAY_ISO);
    const expectedRevenue = aggregateSum(filterSeries(revenueSeries, range));
    expect(screen.getAllByText(formatCurrencyKRW(expectedRevenue)).length).toBeGreaterThan(0);
  });

  it('shows both the stock and ad budget mock alerts', () => {
    renderOverview();
    expect(screen.getByText(/Classic 브리프 \(M\) 재고 소진 6일 전/)).toBeInTheDocument();
    expect(screen.getByText(/Meta 광고 예산 108% 소진/)).toBeInTheDocument();
  });

  it('shows the product ranking and channel share sections', () => {
    renderOverview();
    expect(screen.getByText('상품 순위')).toBeInTheDocument();
    expect(screen.getByText('Classic 브리프')).toBeInTheDocument();
    expect(screen.getByText('채널별 매출 비중')).toBeInTheDocument();
    expect(screen.getByText('자사몰 (카페24)')).toBeInTheDocument();
  });

  it('updates the revenue total when the 오늘 preset is clicked', async () => {
    renderOverview();
    fireEvent.click(screen.getByRole('button', { name: '오늘' }));
    const todayRange = resolveDateRange('today', TODAY_ISO);
    const expectedRevenue = aggregateSum(filterSeries(revenueSeries, todayRange));
    // The hero value count-up-animates to the new target (see useCountUp), so wait for it to settle
    // instead of asserting immediately after the click.
    await waitFor(
      () => expect(screen.getAllByText(formatCurrencyKRW(expectedRevenue)).length).toBeGreaterThan(0),
      { timeout: 1000 },
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/overview/OverviewPage.test.tsx`
Expected: FAIL — current `OverviewPage.tsx` is just a placeholder heading.

- [ ] **Step 3: Implement the full OverviewPage.tsx**

Replace `web/src/components/overview/OverviewPage.tsx` with:

```tsx
import { useMemo, useState } from 'react';
import { Banknote, Megaphone, MousePointerClick, ShoppingCart, Repeat, Receipt, UserPlus, Target } from 'lucide-react';
import { DateRangePicker } from '../ui/DateRangePicker';
import { StatCard } from '../ui/StatCard';
import { AlertBanner } from '../ui/AlertBanner';
import { useSettings } from '../../context/SettingsContext';
import { useCountUp } from '../../hooks/useCountUp';
import { filterSeries, aggregateSum, aggregateAverage, previousRange, percentChange, resolveDateRange } from '../../lib/dateRange';
import { formatCurrencyKRW, formatCount, formatSignedPercent, formatPercent } from '../../lib/format';
import { buildOverviewAlerts } from '../../lib/alerts';
import {
  revenueSeries, adSpendSeries, roasSeries, visitSeries, conversionSeries,
  repeatPurchaseSeries, aovSeries, signupSeries, productRanking, channelShare,
  stockAlerts, adBudgetAlerts, TODAY_ISO,
} from '../../data/mockOverview';
import type { DateRange, DateRangePreset, TimeSeriesPoint } from '../../lib/types';

const DEFAULT_PRESET: DateRangePreset = '30d';

function kpiForRange(series: TimeSeriesPoint[], aggregation: 'sum' | 'average', targetRange: DateRange) {
  const current = filterSeries(series, targetRange);
  const previous = filterSeries(series, previousRange(targetRange));
  const agg = aggregation === 'sum' ? aggregateSum : aggregateAverage;
  const currentValue = agg(current);
  const previousValue = agg(previous);
  return { value: currentValue, deltaPercent: percentChange(currentValue, previousValue) };
}

export function OverviewPage() {
  const { settings } = useSettings();
  const [preset, setPreset] = useState<DateRangePreset>(DEFAULT_PRESET);
  const [range, setRange] = useState<DateRange>(() => resolveDateRange(DEFAULT_PRESET, TODAY_ISO));
  const [customRange, setCustomRange] = useState<DateRange>(range);

  function handleRangeChange(nextPreset: DateRangePreset, nextRange: DateRange) {
    setPreset(nextPreset);
    setRange(nextRange);
    if (nextPreset === 'custom') setCustomRange(nextRange);
  }

  const revenue = useMemo(() => kpiForRange(revenueSeries, 'sum', range), [range]);
  const adSpend = useMemo(() => kpiForRange(adSpendSeries, 'sum', range), [range]);
  const roas = useMemo(() => kpiForRange(roasSeries, 'average', range), [range]);
  const visits = useMemo(() => kpiForRange(visitSeries, 'sum', range), [range]);
  const conversions = useMemo(() => kpiForRange(conversionSeries, 'sum', range), [range]);
  const repeatPurchases = useMemo(() => kpiForRange(repeatPurchaseSeries, 'sum', range), [range]);
  const aov = useMemo(() => kpiForRange(aovSeries, 'average', range), [range]);
  const signups = useMemo(() => kpiForRange(signupSeries, 'sum', range), [range]);

  const monthToDateRange: DateRange = useMemo(
    () => ({ start: `${TODAY_ISO.slice(0, 7)}-01`, end: TODAY_ISO }),
    [],
  );
  const monthCumulative = useMemo(() => kpiForRange(revenueSeries, 'sum', monthToDateRange), [monthToDateRange]);

  const goalProgress = settings.monthlyRevenueGoal > 0
    ? Math.min(100, (revenue.value / settings.monthlyRevenueGoal) * 100)
    : 0;

  const animatedRevenue = useCountUp(revenue.value);
  const animatedGoalProgress = useCountUp(goalProgress);

  const sparkRange = useMemo(() => previousRange({ start: range.end, end: range.end }), [range.end]);
  const alerts = useMemo(() => buildOverviewAlerts(stockAlerts, adBudgetAlerts), []);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-text">전체 매출 현황</h1>
        <DateRangePicker today={TODAY_ISO} preset={preset} customRange={customRange} onChange={handleRangeChange} />
      </div>

      <AlertBanner alerts={alerts} />

      <div className="mb-6 rounded-2xl border border-border bg-bg p-6 shadow-card">
        <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">매출</div>
        <div className="mt-1 font-mono-num text-4xl font-extrabold text-brand-primary">
          {formatCurrencyKRW(animatedRevenue)}
        </div>
        <div className={`mt-2 text-sm font-semibold ${revenue.deltaPercent >= 0 ? 'text-positive' : 'text-negative'}`}>
          {revenue.deltaPercent >= 0 ? '▲' : '▼'} {formatSignedPercent(revenue.deltaPercent)} (직전 동기간 대비)
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-bg p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">이번 달 목표 매출 진행률</div>
            <div className="mt-1 font-mono-num text-3xl font-extrabold text-brand-primary">
              {formatPercent(animatedGoalProgress, 1)}
            </div>
          </div>
          <Target size={20} className="text-brand-primary" />
        </div>
        <div className="mt-4 h-3 rounded-full bg-bg-subtle">
          <div className="h-full rounded-full bg-brand-primary" style={{ width: `${animatedGoalProgress}%` }} />
        </div>
        <div className="mt-2 flex justify-between font-mono-num text-xs text-text-muted">
          <span>실적 {formatCurrencyKRW(revenue.value)}</span>
          <span>목표 {formatCurrencyKRW(settings.monthlyRevenueGoal)}</span>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Megaphone} label="광고비" value={adSpend.value} formatValue={formatCurrencyKRW} deltaPercent={adSpend.deltaPercent} sparklineData={filterSeries(adSpendSeries, sparkRange)} />
        <StatCard icon={Target} label="ROAS" value={roas.value} formatValue={v => formatPercent(v, 0)} deltaPercent={roas.deltaPercent} sparklineData={filterSeries(roasSeries, sparkRange)} />
        <StatCard icon={MousePointerClick} label="유입" value={visits.value} formatValue={formatCount} deltaPercent={visits.deltaPercent} sparklineData={filterSeries(visitSeries, sparkRange)} />
        <StatCard icon={ShoppingCart} label="전환" value={conversions.value} formatValue={v => `${formatCount(v)}건`} deltaPercent={conversions.deltaPercent} sparklineData={filterSeries(conversionSeries, sparkRange)} />
        <StatCard icon={Repeat} label="재구매" value={repeatPurchases.value} formatValue={v => `${formatCount(v)}건`} deltaPercent={repeatPurchases.deltaPercent} sparklineData={filterSeries(repeatPurchaseSeries, sparkRange)} />
        <StatCard icon={Receipt} label="객단가" value={aov.value} formatValue={formatCurrencyKRW} deltaPercent={aov.deltaPercent} sparklineData={filterSeries(aovSeries, sparkRange)} />
        <StatCard icon={UserPlus} label="회원가입" value={signups.value} formatValue={v => `${formatCount(v)}명`} deltaPercent={signups.deltaPercent} sparklineData={filterSeries(signupSeries, sparkRange)} />
        <StatCard icon={Banknote} label="월누적 매출" value={monthCumulative.value} formatValue={formatCurrencyKRW} deltaPercent={monthCumulative.deltaPercent} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-bg p-6 shadow-card">
          <h2 className="mb-4 text-base font-bold text-text">상품 순위</h2>
          <ol className="space-y-3">
            {productRanking.map((product, index) => (
              <li key={product.id} className="flex items-center justify-between text-sm">
                <span className="text-text">{index + 1}. {product.name}</span>
                <span className="font-mono-num font-semibold text-text">{formatCurrencyKRW(product.revenue)}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-2xl border border-border bg-bg p-6 shadow-card">
          <h2 className="mb-4 text-base font-bold text-text">채널별 매출 비중</h2>
          <div className="space-y-3">
            {channelShare.map(channel => (
              <div key={channel.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-text-muted">{channel.label}</span>
                  <span className="font-mono-num font-semibold text-text">{formatPercent(channel.revenueShare)}</span>
                </div>
                <div className="h-2 rounded-full bg-bg-subtle">
                  <div className="h-full rounded-full bg-brand-secondary" style={{ width: `${channel.revenueShare}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/overview/OverviewPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run the full test suite**

Run: `npx vitest run`
Expected: PASS — all suites across every task green.

- [ ] **Step 6: Run tsc and build**

```bash
npx tsc --noEmit
npm run build
```

Expected: both exit 0.

- [ ] **Step 7: Commit**

```bash
cd ..
git add web/src/components/overview/OverviewPage.tsx web/src/components/overview/OverviewPage.test.tsx
git commit -m "Assemble full Overview tab: hero, goal progress, KPI cards, product ranking, channel share"
```

---

### Task 20: Manual browser verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Use `preview_start` with `{name: "modibodi-web"}` after adding this to `.claude/launch.json` at the repo root (create the file if it doesn't exist):

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "modibodi-web",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "port": 5173
    }
  ]
}
```

- [ ] **Step 2: Verify Overview renders correctly**

Navigate to the dev server URL. Check with `read_page` and a screenshot:
- Sidebar shows 8 tabs with icons, Overview highlighted in `#F65934`.
- Hero shows a large orange revenue number with a ▲/▼ delta.
- Goal progress bar, 8 KPI cards (with sparklines on 7 of them), product ranking list, channel share bars all render.
- No console errors (`read_console_messages`).

- [ ] **Step 3: Verify dark mode toggle**

Click the theme toggle in the sidebar. Confirm via `javascript_tool` that `document.documentElement.getAttribute('data-theme')` is `'dark'`, the background flips to `#17171A`, and reload the page to confirm no flash of the wrong theme (FOUC script working).

- [ ] **Step 4: Verify sidebar collapse**

Click the collapse toggle. Confirm the sidebar narrows and tab labels disappear, icons remain, and clicking a tab still works while collapsed.

- [ ] **Step 5: Verify date range switching**

Click "오늘", "7일", "30일", and "직접 지정" (then change the date inputs). Confirm the hero revenue number and KPI cards update each time with no console errors.

- [ ] **Step 6: Verify an unimplemented tab**

Click "마케팅" (or any non-Overview tab). Confirm the "이 탭은 준비 중입니다." placeholder renders instead of a crash.

- [ ] **Step 7: Take a final screenshot and report**

Share a screenshot of the completed Overview tab (light mode) with the user as proof of a working build.

---

## Post-plan note

The existing `modibodi-dashboard/index.html` (currently live) is untouched by this plan. The next spec (Campaign Calendar / 캠페인 캘린더 tab) will port the interaction logic and event data from that file's "일정관리" tab into a new component under `web/src/components/calendar/`, rebuilt with this plan's design tokens — see the design spec's "캘린더 탭" section.
