import type { ReactNode } from 'react';
import { GradientCard } from './GradientCard';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, trailing, children, className = '' }: ChartCardProps) {
  return (
    <GradientCard radius={28} padding="p-5" className={`card-shadow ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-card-text">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[12.5px] text-white/50">{subtitle}</p>}
        </div>
        {trailing}
      </div>
      {children}
    </GradientCard>
  );
}
