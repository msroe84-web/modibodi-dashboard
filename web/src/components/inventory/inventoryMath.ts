import type { InventoryRow } from '../../lib/types';

export interface InventoryStatusRow extends InventoryRow {
  /** Reorder threshold for this product, if configured. */
  threshold: number | undefined;
  /** Estimated days of stock remaining at current avg daily sales pace. */
  daysLeft: number;
  /** Whether this product is at/under its reorder threshold — mirrors src/lib/alerts.ts. */
  isLowStock: boolean;
}

/**
 * Attaches reorder threshold + days-left + low-stock flag to each inventory row.
 * Mirrors the exact "소진임박" rule used in src/lib/alerts.ts (stock <= threshold),
 * so this tab and the Overview alert widget always agree on which products are flagged.
 */
export function buildInventoryStatus(
  inventory: InventoryRow[],
  reorderThreshold: Record<string, number>,
): InventoryStatusRow[] {
  return inventory.map((row) => {
    const threshold = reorderThreshold[row.product];
    const daysLeft = row.avgDailySales > 0 ? Math.floor(row.stock / row.avgDailySales) : Infinity;
    const isLowStock = threshold !== undefined && row.stock <= threshold;
    return { ...row, threshold, daysLeft, isLowStock };
  });
}

export function sumStock(inventory: InventoryRow[]): number {
  return inventory.reduce((sum, row) => sum + row.stock, 0);
}

export function countLowStock(rows: InventoryStatusRow[]): number {
  return rows.filter((r) => r.isLowStock).length;
}
