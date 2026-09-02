import { SparklesIcon } from 'lucide-react';
import { GradientCard } from '../ui/GradientCard';

export function InsightCard({ title, body }: { title: string; body: string }) {
  return (
    <GradientCard radius={22} padding="p-4" className="card-shadow flex h-full items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[var(--card-silver)]">
        <SparklesIcon size={16} strokeWidth={2.25} />
      </div>
      <div>
        <p className="text-[13px] font-bold text-card-text">{title}</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/55">{body}</p>
      </div>
    </GradientCard>
  );
}
