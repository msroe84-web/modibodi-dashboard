import { AlertTriangleIcon, InfoIcon } from 'lucide-react';
import type { AlertItem } from '../../lib/alerts';
import { GradientCard } from '../ui/GradientCard';

export function AlertBanner({ alerts }: { alerts: AlertItem[] }) {
  if (alerts.length === 0) return null;

  return (
    <GradientCard radius={24} padding="p-3.5" className="card-shadow">
      <div className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-white/60">
        <AlertTriangleIcon size={15} className="text-card-warning" />
        주의 필요
      </div>
      <div className="flex flex-wrap gap-2">
        {alerts.map((alert) => {
          const isCritical = alert.severity === 'critical';
          return (
            <div
              key={alert.id}
              className={`flex min-w-[220px] flex-1 items-start gap-2 rounded-xl border px-3 py-2.5 ${
                isCritical ? 'border-card-critical/25 bg-card-critical/10' : 'border-card-info/25 bg-card-info/10'
              }`}
            >
              {isCritical ? (
                <AlertTriangleIcon size={16} className="mt-0.5 shrink-0 text-card-critical" />
              ) : (
                <InfoIcon size={16} className="mt-0.5 shrink-0 text-card-info" />
              )}
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-card-text">{alert.title}</div>
                <div className="truncate text-[12px] text-white/55">{alert.detail}</div>
              </div>
            </div>
          );
        })}
      </div>
    </GradientCard>
  );
}
