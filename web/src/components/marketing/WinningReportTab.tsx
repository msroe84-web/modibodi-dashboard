import { useMemo } from 'react';
import { TrophyIcon } from 'lucide-react';
import { ChartCard } from '../ui/ChartCard';
import { GradientCard } from '../ui/GradientCard';
import { rankCreatives } from '../../lib/creativeScoring';
import { formatKRW, formatNumber, formatPercent, formatRoas } from '../../lib/format';
import { mockAdCreatives } from '../../data/mockAdCreatives';

const MEDAL_CLASS = ['text-[#e8c14a]', 'text-[#c7cdd6]', 'text-[#c98a52]'];

/** Digest of the current top performers — grade 'best' first, ranked by ROAS, capped at 5. If
 *  fewer than 5 creatives graded 'best', the next-best by ROAS fill the rest so the report never
 *  looks empty on a slow week. */
export function WinningReportTab() {
  const winners = useMemo(() => {
    const scores = rankCreatives(mockAdCreatives);
    const scoreById = new Map(scores.map((s) => [s.id, s]));
    const withStats = mockAdCreatives.map((c) => {
      const score = scoreById.get(c.id)!;
      const roas = c.spend > 0 ? c.revenue / c.spend : 0;
      return { ...c, ...score, roas };
    });
    return [...withStats]
      .sort((a, b) => (a.grade === 'best' ? 0 : 1) - (b.grade === 'best' ? 0 : 1) || b.roas - a.roas)
      .slice(0, 5);
  }, []);

  return (
    <div className="space-y-4">
      <ChartCard title="위닝 소재 TOP 5" subtitle="ROAS 기준 · 베스트 등급 우선">
        <ul className="space-y-2.5">
          {winners.map((w, i) => (
            <li key={w.id} className="flex items-center gap-3 rounded-xl border border-card-hairline px-3 py-2.5">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center ${i < 3 ? MEDAL_CLASS[i] : 'text-white/25'}`}>
                <TrophyIcon size={16} strokeWidth={2.25} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-card-text">{w.name}</p>
                <p className="mt-0.5 text-[11.5px] text-white/45">
                  {w.format} · {w.status === 'active' ? '집행중' : '중지'}
                </p>
              </div>
              <div className="flex shrink-0 gap-4 text-right text-[12px]">
                <div>
                  <p className="text-white/45">ROAS</p>
                  <p className="num-mono font-bold text-card-good">{formatRoas(w.roas)}</p>
                </div>
                <div>
                  <p className="text-white/45">CTR</p>
                  <p className="num-mono font-semibold text-card-text">{formatPercent(w.ctr * 100, 2)}</p>
                </div>
                <div>
                  <p className="text-white/45">매출</p>
                  <p className="num-mono font-semibold text-card-text">{formatKRW(w.revenue)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GradientCard radius={22} padding="p-4" className="card-shadow">
          <p className="text-[12.5px] font-medium text-white/55">TOP 5 합계 매출</p>
          <p className="num-mono mt-2 text-[20px] font-bold text-card-text">
            {formatKRW(winners.reduce((sum, w) => sum + w.revenue, 0))}
          </p>
        </GradientCard>
        <GradientCard radius={22} padding="p-4" className="card-shadow">
          <p className="text-[12.5px] font-medium text-white/55">TOP 5 평균 ROAS</p>
          <p className="num-mono mt-2 text-[20px] font-bold text-card-good">
            {formatRoas(winners.length > 0 ? winners.reduce((sum, w) => sum + w.roas, 0) / winners.length : 0)}
          </p>
        </GradientCard>
        <GradientCard radius={22} padding="p-4" className="card-shadow">
          <p className="text-[12.5px] font-medium text-white/55">TOP 5 합계 전환</p>
          <p className="num-mono mt-2 text-[20px] font-bold text-card-text">
            {formatNumber(winners.reduce((sum, w) => sum + w.conversions, 0))}건
          </p>
        </GradientCard>
      </div>
    </div>
  );
}
