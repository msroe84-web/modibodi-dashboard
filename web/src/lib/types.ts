export interface ChannelRevenuePoint {
  date: string;
  channel: string;
  revenue: number;
}

export interface ProductSalesRow {
  product: string;
  /** e.g. "CLB-001" — display-only SKU-style code, not tied to any external system yet. */
  code: string;
  units: number;
  revenue: number;
  /** Product page conversion rate, 0-100. Cumulative/all-time snapshot — not date-range filtered. */
  conversionRate: number;
}

export interface InventoryVariant {
  /** e.g. "블랙" — looked up in lib/colors.ts for the swatch dot. */
  color: string;
  quantity: number;
}

export interface InventoryRow {
  product: string;
  /** Always the sum of `variants[].quantity` — never set independently (see mockOverview.ts). */
  stock: number;
  avgDailySales: number;
  /** Per-color breakdown. Real intake quantities where known, placeholder otherwise — no
   *  per-variant sales-velocity data exists yet (물류 API 연동 전), so days-left is only ever
   *  estimated at the product-total level, never per variant. */
  variants: InventoryVariant[];
}

export interface CalendarEventRow {
  date: string;
  title: string;
  type: 'promo' | 'ad' | 'restock';
}

export type CreativeFormat = 'image' | 'video' | 'carousel';
export type CreativeStatus = 'active' | 'paused';
export type CreativeGrade = 'best' | 'good' | 'replace';

export interface AdCreativeRow {
  id: string;
  name: string;
  format: CreativeFormat;
  /** Single-channel for now — no other channel exposes creative-level data yet, so this isn't
   *  a real dimension to analyze by (see 분류 분석's format/campaign-only breakdowns). */
  channel: 'Meta';
  status: CreativeStatus;
  /** Links to a CampaignRow.id in mockMarketing.ts's `campaigns` (Meta rows only). */
  campaignId: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  startDate: string;
}

/** Cumulative (not date-range filtered) campaign performance. Only impressions/ctr/cpc/
 *  conversions/revenue are stored — clicks/spend/cpa/roas are always derived from these so
 *  they can never drift out of sync with each other. */
export interface CampaignRow {
  id: string;
  channel: string;
  name: string;
  impressions: number;
  /** 0-100 */
  ctr: number;
  cpc: number;
  conversions: number;
  revenue: number;
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
  /** Last user-resized size (px) of the modal's 내용 box, per event. Unset -> standard default size. */
  contentWidth?: number;
  contentHeight?: number;
}
