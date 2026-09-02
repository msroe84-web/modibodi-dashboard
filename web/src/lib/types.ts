export interface ChannelRevenuePoint {
  date: string;
  channel: string;
  revenue: number;
}

export interface ProductSalesRow {
  product: string;
  units: number;
  revenue: number;
}

export interface InventoryRow {
  product: string;
  stock: number;
  avgDailySales: number;
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
  /** Last user-resized size (px) of the modal's 내용 box, per event. Unset -> standard default size. */
  contentWidth?: number;
  contentHeight?: number;
}
