import type { AppSettings } from '../context/settingsDefaults';
import type { CalendarEventRow, InventoryRow } from './types';

export type AlertSeverity = 'critical' | 'info';

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
}

const EVENT_LOOKAHEAD_DAYS = 7;

export function buildAlerts(params: {
  inventory: InventoryRow[];
  adSpendMonthToDate: Record<string, number>;
  upcomingEvents: CalendarEventRow[];
  settings: AppSettings;
  today?: Date;
}): AlertItem[] {
  const { inventory, adSpendMonthToDate, upcomingEvents, settings } = params;
  const today = params.today ?? new Date();
  const alerts: AlertItem[] = [];

  for (const row of inventory) {
    const threshold = settings.reorderThreshold[row.product];
    if (threshold === undefined || row.avgDailySales <= 0) continue;
    const daysLeft = Math.floor(row.stock / row.avgDailySales);
    if (row.stock <= threshold) {
      alerts.push({
        id: `stock-${row.product}`,
        severity: 'critical',
        title: `${row.product} 재고 소진임박`,
        detail: `현재 ${row.stock}개 · 약 ${daysLeft}일분 남음`,
      });
    }
  }

  for (const [channel, budget] of Object.entries(settings.adBudget)) {
    const spent = adSpendMonthToDate[channel];
    if (spent === undefined || budget <= 0) continue;
    const ratio = spent / budget;
    if (ratio >= 1) {
      alerts.push({
        id: `budget-${channel}`,
        severity: 'critical',
        title: `${channel} 광고 예산 초과`,
        detail: `소진율 ${Math.round(ratio * 100)}% (${spent.toLocaleString('ko-KR')}원 / ${budget.toLocaleString('ko-KR')}원)`,
      });
    }
  }

  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + EVENT_LOOKAHEAD_DAYS);
  for (const ev of upcomingEvents) {
    const evDate = new Date(`${ev.date}T00:00:00`);
    if (evDate >= today && evDate <= cutoff) {
      alerts.push({
        id: `event-${ev.date}-${ev.title}`,
        severity: 'info',
        title: ev.title,
        detail: formatDday(evDate, today),
      });
    }
  }

  return alerts.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'critical' ? -1 : 1));
}

function formatDday(target: Date, today: Date): string {
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  return days === 0 ? 'D-Day' : `D-${days}`;
}
