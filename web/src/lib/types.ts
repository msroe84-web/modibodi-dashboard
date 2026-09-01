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
