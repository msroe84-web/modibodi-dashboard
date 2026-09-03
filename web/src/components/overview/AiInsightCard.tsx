import { CheckCircle2Icon, SparklesIcon, AlertTriangleIcon } from 'lucide-react';
import { GradientCard } from '../ui/GradientCard';
import type { Insight, InsightSeverity } from '../../lib/insights';

const SEVERITY_STYLE: Record<InsightSeverity, { icon: typeof AlertTriangleIcon; className: string }> = {
  critical: { icon: AlertTriangleIcon, className: 'bg-card-critical/15 text-card-critical' },
  warning: { icon: AlertTriangleIcon, className: 'bg-card-warning/15 text-card-warning' },
  good: { icon: CheckCircle2Icon, className: 'bg-card-good/15 text-card-good' },
};

export function AiInsightCard({ insights }: { insights: Insight[] }) {
  return (
    <GradientCard radius={22} padding="p-4" className="card-shadow flex h-full flex-col">
      <div className="mb-3 flex items-center gap-1.5 text-[13px] font-bold text-card-text">
        <SparklesIcon size={15} className="text-[var(--card-silver)]" />
        AI 인사이트
      </div>
      {insights.length === 0 ? (
        <p className="text-[12.5px] text-white/40">표시할 인사이트가 없습니다</p>
      ) : (
        <ul className="space-y-2.5">
          {insights.map((insight) => {
            const style = SEVERITY_STYLE[insight.severity];
            const Icon = style.icon;
            return (
              <li key={insight.id} className="flex items-start gap-2.5">
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${style.className}`}>
                  <Icon size={12} strokeWidth={2.5} />
                </span>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-card-text">{insight.title}</p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-white/50">{insight.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </GradientCard>
  );
}
