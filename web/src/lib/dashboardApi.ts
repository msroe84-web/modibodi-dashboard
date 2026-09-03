import type { MarketingChannel } from '../data/mockMarketing';

export interface RealChannelRevenueRow {
  date: string;
  channel: string;
  revenue: number;
}

export interface RealMarketingDailyRow {
  date: string;
  channel: MarketingChannel;
  spend: number;
  revenue: number;
  /** Optional: not every ad API integration surfaces impressions from day one. */
  impressions?: number;
  clicks: number;
  conversions: number;
}

export interface DashboardApiData {
  channelRevenue: RealChannelRevenueRow[];
  marketingDaily: RealMarketingDailyRow[];
}

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;
const SECRET_TOKEN = import.meta.env.VITE_SECRET_TOKEN as string | undefined;

function requireConfig(): { url: string; token: string } {
  if (!APPS_SCRIPT_URL || !SECRET_TOKEN) {
    throw new Error('APPS_SCRIPT_URL/SECRET_TOKEN이 설정되지 않았습니다 (.env.local 확인)');
  }
  return { url: APPS_SCRIPT_URL, token: SECRET_TOKEN };
}

/** Fetches the entire DashboardData JSON blob as-is. The backend (Apps Script doPost) always
 *  overwrites the whole blob on write, so any writer MUST fetch this immediately before saving,
 *  merge its change in, and post the complete object back — never post a partial object, or
 *  every other section (sales/marketing/crm/analytics/settings) gets wiped. */
export async function fetchFullState(): Promise<Record<string, unknown>> {
  const { url, token } = requireConfig();
  const res = await fetch(`${url}?token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    throw new Error(`대시보드 데이터 요청 실패 (${res.status})`);
  }
  const json = await res.json();
  if (!json?.ok) {
    throw new Error(json?.error ?? '대시보드 데이터 요청 실패');
  }
  return (json.data ?? {}) as Record<string, unknown>;
}

/** Overwrites the entire DashboardData blob. `state` must be the full object (see fetchFullState
 *  note) — typically fetchFullState()'s result with one section replaced. Body is sent as a plain
 *  string (no explicit Content-Type) so the browser treats it as a "simple request" and skips a
 *  CORS preflight OPTIONS request, which Apps Script Web Apps don't handle. */
export async function saveFullState(state: Record<string, unknown>): Promise<void> {
  const { url, token } = requireConfig();
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ token, data: state }),
  });
  if (!res.ok) {
    throw new Error(`대시보드 데이터 저장 실패 (${res.status})`);
  }
  const json = await res.json();
  if (!json?.ok) {
    throw new Error(json?.error ?? '대시보드 데이터 저장 실패');
  }
}

/** Fetches the shared Apps Script backend's DashboardData blob and extracts the fields
 *  real-data-integrated so far (sales.channelRevenue, marketing.daily). Other sections
 *  (crm, analytics, monthly sales/marketing rows, etc.) stay mock-only for now. */
export async function fetchDashboardData(): Promise<DashboardApiData> {
  const data = await fetchFullState();
  const sales = data.sales as { channelRevenue?: RealChannelRevenueRow[] } | undefined;
  const marketing = data.marketing as { daily?: RealMarketingDailyRow[] } | undefined;
  return {
    channelRevenue: Array.isArray(sales?.channelRevenue) ? sales.channelRevenue : [],
    marketingDaily: Array.isArray(marketing?.daily) ? marketing.daily : [],
  };
}
