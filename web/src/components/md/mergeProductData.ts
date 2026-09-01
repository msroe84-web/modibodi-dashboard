import type { InventoryRow, ProductSalesRow } from '../../lib/types';

export interface MergedProductRow {
  product: string;
  units: number;
  revenue: number;
  price: number;
  cost: number;
  marginPct: number;
  stock: number;
  avgDailySales: number;
  daysOfStockLeft: number;
}

/**
 * Pure join: combines sales (mockOverview.productSales), pricing (settings.pricing),
 * and inventory (mockOverview.inventory) on the `product` name key. Creates no new
 * source data — every field here already lives in one of the three inputs.
 */
export function mergeProductData(
  productSales: ProductSalesRow[],
  pricing: Record<string, { price: number; cost: number }>,
  inventory: InventoryRow[],
): MergedProductRow[] {
  const inventoryByProduct = new Map(inventory.map((row) => [row.product, row]));

  return productSales.map((sale) => {
    const inv = inventoryByProduct.get(sale.product);
    const price = pricing[sale.product]?.price ?? 0;
    const cost = pricing[sale.product]?.cost ?? 0;
    const stock = inv?.stock ?? 0;
    const avgDailySales = inv?.avgDailySales ?? 0;

    return {
      product: sale.product,
      units: sale.units,
      revenue: sale.revenue,
      price,
      cost,
      marginPct: price > 0 ? ((price - cost) / price) * 100 : 0,
      stock,
      avgDailySales,
      daysOfStockLeft: avgDailySales > 0 ? stock / avgDailySales : Infinity,
    };
  });
}
