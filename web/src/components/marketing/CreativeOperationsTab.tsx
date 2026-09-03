import { useMemo } from 'react';
import { ChartCard } from '../ui/ChartCard';
import { formatKRW, formatNumber } from '../../lib/format';
import { rankCreatives } from '../../lib/creativeScoring';
import { mockAdCreatives } from '../../data/mockAdCreatives';
import { TODAY } from '../../data/mockOverview';
import type { CreativeGrade } from '../../lib/types';

const GRADE_LABEL: Record<CreativeGrade, string> = { best: '베스트', good: '양호', replace: '교체 권장' };
const GRADE_CLASS: Record<CreativeGrade, string> = {
  best: 'text-card-good bg-card-good/15',
  good: 'text-card-silver bg-white/8',
  replace: 'text-card-critical bg-card-critical/15',
};

function daysRunning(startDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((TODAY.getTime() - start) / 86_400_000));
}

/** Operational view of every creative — status, how long it's been running, current grade — so
 *  someone managing the ad account can see at a glance what needs a refresh or a pause. */
export function CreativeOperationsTab() {
  const rows = useMemo(() => {
    const scores = rankCreatives(mockAdCreatives);
    const scoreById = new Map(scores.map((s) => [s.id, s]));
    return [...mockAdCreatives]
      .map((c) => ({ ...c, grade: scoreById.get(c.id)?.grade ?? 'good', days: daysRunning(c.startDate) }))
      .sort((a, b) => b.days - a.days);
  }, []);

  return (
    <ChartCard title="소재 운영 현황" subtitle="운영일수 · 상태 · 등급 기준">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-white/8 text-left">
              <th className="pb-2 pr-3 font-medium text-white/55">소재명</th>
              <th className="pb-2 pr-3 font-medium text-white/55">포맷</th>
              <th className="pb-2 pr-3 font-medium text-white/55">상태</th>
              <th className="pb-2 pr-3 font-medium text-white/55">시작일</th>
              <th className="pb-2 pr-3 font-medium text-white/55">운영일수</th>
              <th className="pb-2 pr-3 font-medium text-white/55">지출</th>
              <th className="pb-2 font-medium text-white/55">등급</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-white/8 last:border-b-0">
                <td className="py-2.5 pr-3 font-medium text-card-text">{row.name}</td>
                <td className="py-2.5 pr-3 text-white/60">{row.format}</td>
                <td className="py-2.5 pr-3 text-white/60">{row.status === 'active' ? '집행중' : '중지'}</td>
                <td className="num-mono py-2.5 pr-3 text-white/55">{row.startDate}</td>
                <td className="num-mono py-2.5 pr-3 text-white/70">
                  {formatNumber(row.days)}일
                  {row.days >= 60 && row.status === 'active' && (
                    <span className="ml-1.5 rounded-full bg-card-warning/15 px-1.5 py-0.5 text-[10px] font-semibold text-card-warning">
                      리프레시 검토
                    </span>
                  )}
                </td>
                <td className="num-mono py-2.5 pr-3 text-white/70">{formatKRW(row.spend)}</td>
                <td className="py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${GRADE_CLASS[row.grade]}`}>
                    {GRADE_LABEL[row.grade]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
