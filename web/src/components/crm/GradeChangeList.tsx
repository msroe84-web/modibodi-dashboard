import { ArrowRightIcon } from 'lucide-react';
import { ChartCard } from '../ui/ChartCard';
import type { GradeChangeRow } from '../../data/mockCrm';

export function GradeChangeList({ rows }: { rows: GradeChangeRow[] }) {
  return (
    <ChartCard title="등급 이동" subtitle="최근 등급 변경">
      <ul className="space-y-2">
        {rows.map((row) => {
          const isUp = row.direction === 'up';
          return (
            <li key={row.id} className="flex items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-[13px]">
              <span className="flex min-w-0 items-center gap-1.5 text-card-text">
                <span className="truncate font-medium">{row.customerLabel}</span>
                <span className="shrink-0 text-white/40">{row.fromGrade}</span>
                <ArrowRightIcon size={12} className="shrink-0 text-white/30" />
                <span className="shrink-0 font-medium text-white/70">{row.toGrade}</span>
              </span>
              <span
                className={`num-mono shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${
                  isUp ? 'bg-card-good/15 text-card-good' : 'bg-card-critical/15 text-card-critical'
                }`}
              >
                {isUp ? '+1' : '-1'}
              </span>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}
