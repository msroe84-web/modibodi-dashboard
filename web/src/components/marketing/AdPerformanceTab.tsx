import { useMemo, useState } from 'react';
import { ImagesIcon, ListFilterIcon, RefreshCwIcon } from 'lucide-react';
import { GradientCard } from '../ui/GradientCard';
import { ClassificationAnalysisTab } from './ClassificationAnalysisTab';
import { CreativeOperationsTab } from './CreativeOperationsTab';
import { PerformanceAnalysisTab } from './PerformanceAnalysisTab';
import { WinningReportTab } from './WinningReportTab';
import { rankCreatives } from '../../lib/creativeScoring';
import { mockAdCreatives } from '../../data/mockAdCreatives';
import { formatNumber, formatPercent } from '../../lib/format';

type SubTab = 'performance' | 'operations' | 'winning' | 'classification';

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'performance', label: '성과분석' },
  { id: 'operations', label: '소재 운영' },
  { id: 'winning', label: '위닝 보고서' },
  { id: 'classification', label: '분류 분석' },
];

export function AdPerformanceTab() {
  const [subTab, setSubTab] = useState<SubTab>('performance');

  const scored = useMemo(() => {
    const scores = rankCreatives(mockAdCreatives);
    const scoreById = new Map(scores.map((s) => [s.id, s]));
    return mockAdCreatives.map((c) => ({ ...c, ...scoreById.get(c.id)! }));
  }, []);

  const replaceCount = scored.filter((c) => c.grade === 'replace').length;
  const avgCtr = scored.length > 0 ? scored.reduce((sum, c) => sum + c.ctr, 0) / scored.length : 0;
  const avgCpaSamples = scored.filter((c) => Number.isFinite(c.cpa));
  const avgCpa =
    avgCpaSamples.length > 0 ? avgCpaSamples.reduce((sum, c) => sum + c.cpa, 0) / avgCpaSamples.length : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-ink">광고 성과 분석</h1>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            Meta 소재별 성과를 한눈에 확인하고 교체가 필요한 소재를 빠르게 찾아보세요.
          </p>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 p-0.5">
          {SUB_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                subTab === t.id ? 'bg-white/15 text-card-text' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
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

      {subTab === 'performance' && <PerformanceAnalysisTab />}
      {subTab === 'operations' && <CreativeOperationsTab />}
      {subTab === 'winning' && <WinningReportTab />}
      {subTab === 'classification' && <ClassificationAnalysisTab />}

      <p className="text-[11.5px] text-ink-muted">
        * 현재는 목업 데이터입니다. Meta 소재 단위 API 연동 후 실데이터로 자동 갱신될 예정입니다.
      </p>
    </div>
  );
}
