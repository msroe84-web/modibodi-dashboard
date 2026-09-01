import type { ReactNode } from 'react';

interface GradientCardProps {
  children: ReactNode;
  className?: string;
  radius?: number;
  padding?: string;
}

/** The dashboard's "chart box" card: gradient silver border, black gradient fill. Always dark, regardless of page theme. */
export function GradientCard({ children, className = '', radius = 28, padding = 'p-5' }: GradientCardProps) {
  return (
    <div className="relative h-full w-full" style={{ borderRadius: radius }}>
      <div
        className="absolute -inset-px -z-10"
        style={{ borderRadius: radius, background: 'var(--card-border-grad)' }}
      />
      <div
        className={`relative h-full bg-gradient-to-br from-[var(--card-bg-1)] via-[var(--card-bg-2)] to-[var(--card-bg-1)] text-[var(--card-text)] ${padding} ${className}`}
        style={{ borderRadius: radius }}
      >
        {children}
      </div>
    </div>
  );
}
