import { newCustomersSeries } from './mockOverview';

/** Deterministic PRNG so the mock dataset doesn't reshuffle on every render/reload. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260901 + 1);

/**
 * Repeat/재구매 customers, derived from the same daily new-customer series so the
 * two move together plausibly (repeat customers trend smaller than new, with
 * gentle noise + a slow upward drift as the membership base grows).
 */
export const repeatCustomersSeries = newCustomersSeries.map(({ date, value }, i) => {
  const growth = 1 + (i / newCustomersSeries.length) * 0.35;
  const noise = 0.8 + rand() * 0.35;
  return { date, value: Math.max(0, Math.round(value * 0.45 * growth * noise)) };
});

/** Rough current size of the active (purchased at least once) customer base — for context, not filtered by date range. */
export const totalActiveCustomers = 4820;

/** Snapshot (not date-range filtered) secondary CRM metrics. */
export const DORMANT_DAYS_THRESHOLD = 60;
export const dormantCustomers = Math.round(totalActiveCustomers * (0.18 + rand() * 0.06));
export const avgRepeatCycleDays = Math.round(38 + rand() * 12);

export interface LifecycleStage {
  key: string;
  label: string;
  /** 0-100, all stages sum to 100 — a snapshot split of where the whole funnel population
   *  currently sits, not a cumulative funnel (VIP/휴면 are end states, not subsets of 재구매). */
  pct: number;
}

export const lifecycleStages: LifecycleStage[] = [
  { key: 'visit', label: '방문', pct: 38 },
  { key: 'signup', label: '가입', pct: 22 },
  { key: 'first-purchase', label: '첫구매', pct: 18 },
  { key: 'active', label: '재구매 (Active)', pct: 14 },
  { key: 'vip', label: 'VIP', pct: 5 },
  { key: 'dormant', label: '휴면', pct: 3 },
];

export interface GradeDistributionRow {
  grade: string;
  count: number;
}

const GRADE_SHARE: { grade: string; pct: number }[] = [
  { grade: 'Seed', pct: 45 },
  { grade: 'Root', pct: 25 },
  { grade: 'Bloom', pct: 15 },
  { grade: 'Canopy', pct: 10 },
  { grade: 'Keeper', pct: 5 },
];

export const gradeDistribution: GradeDistributionRow[] = GRADE_SHARE.map(({ grade, pct }) => ({
  grade,
  count: Math.round(totalActiveCustomers * (pct / 100)),
}));

/** Demo-only cohort retention grid — there's no real repurchase history pre-launch. Always paired
 *  in the UI with a "카페24 연동 후 실데이터로 교체 예정" label. Row = signup month, columns =
 *  months since signup (M0..M5); undefined where a cohort hasn't reached that age yet. */
export interface CohortRow {
  cohortLabel: string;
  retentionPct: (number | null)[];
}

const COHORT_MONTHS = ['4월', '5월', '6월', '7월', '8월', '9월'];

export const cohortRetention: CohortRow[] = COHORT_MONTHS.map((cohortLabel, cohortIndex) => {
  const monthsAvailable = COHORT_MONTHS.length - cohortIndex;
  const retentionPct: (number | null)[] = [];
  let base = 100;
  for (let age = 0; age < COHORT_MONTHS.length; age++) {
    if (age >= monthsAvailable) {
      retentionPct.push(null);
      continue;
    }
    if (age === 0) {
      retentionPct.push(100);
    } else {
      const decay = 0.55 + rand() * 0.15;
      base = base * decay;
      retentionPct.push(Math.round(base * 10) / 10);
    }
  }
  return { cohortLabel, retentionPct };
});

export interface GradeChangeRow {
  id: string;
  customerLabel: string;
  fromGrade: string;
  toGrade: string;
  direction: 'up' | 'down';
}

const GRADE_ORDER = ['Seed', 'Root', 'Bloom', 'Canopy', 'Keeper'];

function gradeChangeLabel(from: string, to: string): 'up' | 'down' {
  return GRADE_ORDER.indexOf(to) > GRADE_ORDER.indexOf(from) ? 'up' : 'down';
}

const RAW_GRADE_CHANGES: [string, string, string][] = [
  ['고객 A', 'Root', 'Bloom'],
  ['고객 B', 'Bloom', 'Canopy'],
  ['고객 C', 'Canopy', 'Keeper'],
  ['고객 D', 'Seed', 'Root'],
  ['고객 E', 'Bloom', 'Root'],
  ['고객 F', 'Canopy', 'Bloom'],
  ['고객 G', 'Root', 'Seed'],
  ['고객 H', 'Keeper', 'Canopy'],
];

export const gradeChanges: GradeChangeRow[] = RAW_GRADE_CHANGES.map(([customerLabel, fromGrade, toGrade], i) => ({
  id: `grade-change-${i}`,
  customerLabel,
  fromGrade,
  toGrade,
  direction: gradeChangeLabel(fromGrade, toGrade),
}));
