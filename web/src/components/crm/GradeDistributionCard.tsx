import { ChartCard } from '../ui/ChartCard';
import { formatNumber, formatPercent } from '../../lib/format';
import type { GradeDistributionRow } from '../../data/mockCrm';

const SERIES_VARS = ['--card-series-1', '--card-series-2', '--card-series-3', '--card-series-4', '--card-series-5', '--card-series-6'];

/** Same color-dot legend list pattern as ChannelShareCard — no donut here, just the list, per
 *  spec ("도넛 대신 기존 채널 비중 카드와 동일한 막대+색점 패턴"). */
export function GradeDistributionCard({ rows }: { rows: GradeDistributionRow[] }) {
  const total = rows.reduce((acc, r) => acc + r.count, 0);

  return (
    <ChartCard title="멤버십 등급 분포" subtitle="스냅샷 기준">
      <ul className="space-y-2.5">
        {rows.map((row, i) => {
          const pct = total > 0 ? (row.count / total) * 100 : 0;
          return (
            <li key={row.grade} className="flex items-center justify-between gap-2 text-[13px]">
              <span className="flex min-w-0 items-center gap-2 text-white/70">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: `var(${SERIES_VARS[i % SERIES_VARS.length]})` }}
                />
                <span className="truncate font-medium">{row.grade}</span>
              </span>
              <span className="num-mono shrink-0 text-[12.5px] text-white/55">
                {formatNumber(row.count)}명 · <span className="font-semibold text-card-text">{formatPercent(pct, 0)}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}
