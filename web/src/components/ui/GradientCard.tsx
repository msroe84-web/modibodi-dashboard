import type { ReactNode } from 'react';

interface GradientCardProps {
  children: ReactNode;
  className?: string;
  radius?: number;
  padding?: string;
  /** 'gradient' (default) is the dashboard's standard chart-box look. 'glass' is an iOS-style
   * frosted panel — translucent fill + backdrop blur instead of a gradient fill/border, same
   * recipe as the legacy dashboard's `.glass` card. Opt in per card; existing usages are
   * unaffected. */
  variant?: 'gradient' | 'glass';
}

/** The dashboard's "chart box" card: gradient silver border, black gradient fill. Always dark, regardless of page theme. */
export function GradientCard({
  children,
  className = '',
  radius = 28,
  padding = 'p-5',
  variant = 'gradient',
}: GradientCardProps) {
  if (variant === 'glass') {
    return (
      <div
        className={`h-full w-full border border-white/[0.14] bg-white/[0.055] text-[var(--card-text)] backdrop-blur-[22px] ${padding} ${className}`}
        style={{ borderRadius: radius }}
      >
        {children}
      </div>
    );
  }

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
