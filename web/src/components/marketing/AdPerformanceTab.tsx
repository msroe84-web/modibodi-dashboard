import { useMemo, useState } from 'react';
import { ImagesIcon, ListFilterIcon, RefreshCwIcon } from 'lucide-react';
import { GradientCard } from '../ui/GradientCard';
import { ChartCard } from '../ui/ChartCard';
import { CreativeCard, type ScoredCreative } from './CreativeCard';
import { rankCreatives } from '../../lib/creativeScoring';
import { mockAdCreatives } from '../../data/mockAdCreatives';
import { formatNumber, formatPercent } from '../../lib/format';
import type { CreativeGrade } from '../../lib/types';

const GRADE_FILTERS: { id: CreativeGrade | 'all'; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'best', label: '베스트' },
  { id: 'good', label: '양호' },
  { id: 'replace', label: '교체 권장' },
];

export function AdPerformanceTab() {
  const [gradeFilter, setGradeFilter] = useState<CreativeGrade | 'all'>('all');

  const scored: ScoredCreative[] = useMemo(() => {
    const scores = rankCreatives(mockAdCreatives);
    const scoreById = new Map(scores.map((s) => [s.id, s]));
    return mockAdCreatives.map((c) => ({ ...c, ...scoreById.get(c.id)! }));
  }, []);

  const replaceCount = scored.filter((c) => c.grade === 'replace').length;
  const avgCtr = scored.reduce((sum, c) => sum + c.ctr, 0) / scored.length;
  const avgCpaSamples = scored.filter((c) => Number.isFinite(c.cpa));
  const avgCpa = avgCpaSamples.reduce((sum, c) => sum + c.cpa, 0) / avgCpaSamples.length;

  const visible = gradeFilter === 'all' ? scored : scored.filter((c) => c.grade === gradeFilter);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-extrabold text-ink">광고 성과 분석</h1>
        <p className="mt-0.5 text-[13px] text-ink-secondary">
          Meta 소재별 성과를 한눈에 확인하고 교체가 필요한 소재를 빠르게 찾아보세요.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GradientCard radius={22} padding="p-4" className="card-shadow">
          <div className="flex items-center gap-2 text-[12.5px] font-medium text-white/55">
            <ImagesIcon size={15} className="text-[var(--card-silver)]" />
            총 소재 수
          </div>
          <p className="num-mono mt-2 text-[22px] font-bold text-card-text">{scored.length}개</p>
        </GradientCard>
        <GradientCard radius={22} padding="p-4" className="card-shadow">
          <div className="flex items-center gap-2 text-[12.5px] font-medium text-white/55">
            <ListFilterIcon size={15} className="text-[var(--card-silver)]" />
            평균 CTR · CPA
          </div>
          <p className="num-mono mt-2 text-[15px] font-bold text-card-text">
            {formatPercent(avgCtr * 100, 2)} · {formatNumber(Math.round(avgCpa))}원
          </p>
        </GradientCard>
        <GradientCard radius={22} padding="p-4" className="card-shadow">
          <div className="flex items-center gap-2 text-[12.5px] font-medium text-white/55">
            <RefreshCwIcon size={15} className="text-card-critical" />
            교체 권장 소재
          </div>
          <p className="num-mono mt-2 text-[22px] font-bold text-card-critical">{replaceCount}개</p>
        </GradientCard>
      </div>

      <ChartCard
        title="소재별 성과"
        subtitle="CPA는 낮을수록, CTR은 높을수록 상대 순위가 높습니다."
        trailing={
          <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 p-0.5">
            {GRADE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setGradeFilter(f.id)}
                className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  gradeFilter === f.id ? 'bg-white/15 text-card-text' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      >
        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((c) => (
              <CreativeCard key={c.id} creative={c} />
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-[13px] text-white/40">해당 등급의 소재가 없습니다.</p>
        )}
      </ChartCard>

      <p className="text-[11.5px] text-ink-muted">
        * 현재는 목업 데이터입니다. Meta 소재 단위 API 연동 후 실데이터로 자동 갱신될 예정입니다.
      </p>
    </div>
  );
}
