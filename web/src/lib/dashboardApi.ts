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
  clicks: number;
  conversions: number;
}

export interface DashboardApiData {
  channelRevenue: RealChannelRevenueRow[];
  marketingDaily: RealMarketingDailyRow[];
}

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;
const SECRET_TOKEN = import.meta.env.VITE_SECRET_TOKEN as string | undefined;

/** Fetches the shared Apps Script backend's DashboardData blob and extracts the fields
 *  real-data-integrated so far (sales.channelRevenue, marketing.daily). Other sections
 *  (crm, analytics, monthly sales/marketing rows, etc.) stay mock-only for now. */
export async function fetchDashboardData(): Promise<DashboardApiData> {
  if (!APPS_SCRIPT_URL || !SECRET_TOKEN) {
    throw new Error('APPS_SCRIPT_URL/SECRET_TOKEN이 설정되지 않았습니다 (.env.local 확인)');
  }

  const url = `${APPS_SCRIPT_URL}?token=${encodeURIComponent(SECRET_TOKEN)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`대시보드 데이터 요청 실패 (${res.status})`);
  }
  const json = await res.json();

  return {
    channelRevenue: Array.isArray(json?.sales?.channelRevenue) ? json.sales.channelRevenue : [],
    marketingDaily: Array.isArray(json?.marketing?.daily) ? json.marketing.daily : [],
  };
}
