import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { formatSignedPercent } from '../../lib/format';

export function TrendBadge({ changePct }: { changePct: number }) {
  const isUp = changePct >= 0;
  const Icon = isUp ? TrendingUpIcon : TrendingDownIcon;

  const colorClasses = isUp
    ? 'bg-card-good/15 text-card-good'
    : 'bg-card-critical/18 text-card-critical';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold ${colorClasses}`}>
      <Icon size={12} strokeWidth={2.5} />
      {formatSignedPercent(changePct)}
    </span>
  );
}
