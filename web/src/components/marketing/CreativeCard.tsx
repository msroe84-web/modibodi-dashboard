import { GalleryHorizontalIcon, ImageIcon, VideoIcon, type LucideIcon } from 'lucide-react';
import { GradientCard } from '../ui/GradientCard';
import { formatKRW, formatNumber, formatPercent } from '../../lib/format';
import type { AdCreativeRow, CreativeGrade, CreativeFormat } from '../../lib/types';
import type { CreativeScore } from '../../lib/creativeScoring';

export type ScoredCreative = AdCreativeRow & CreativeScore;

const FORMAT_ICON: Record<CreativeFormat, LucideIcon> = {
  image: ImageIcon,
  video: VideoIcon,
  carousel: GalleryHorizontalIcon,
};

const GRADE_CONFIG: Record<CreativeGrade, { label: string; className: string }> = {
  best: { label: '베스트', className: 'text-card-good bg-card-good/15' },
  good: { label: '양호', className: 'text-card-silver bg-white/8' },
  replace: { label: '교체 권장', className: 'text-card-critical bg-card-critical/15' },
};

export function CreativeCard({ creative }: { creative: ScoredCreative }) {
  const FormatIcon = FORMAT_ICON[creative.format];
  const grade = GRADE_CONFIG[creative.grade];

  return (
    <GradientCard radius={22} padding="p-4" className="card-shadow">
      <div className="relative mb-3 flex aspect-[4/3] items-center justify-center rounded-xl bg-white/6">
        <FormatIcon size={28} strokeWidth={1.75} className="text-white/25" />
        <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${grade.className}`}>
          {grade.label}
        </span>
      </div>
      <p className="truncate text-[13.5px] font-semibold text-card-text">{creative.name}</p>
      <div className="mt-1 flex items-center gap-2 text-[11px] text-white/45">
        <span>{creative.channel}</span>
        <span>·</span>
        <span>{creative.status === 'active' ? '집행중' : '중지'}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-card-hairline pt-3 text-[12px]">
        <div>
          <p className="text-white/45">지출</p>
          <p className="num-mono font-semibold text-card-text">{formatKRW(creative.spend)}</p>
        </div>
        <div>
          <p className="text-white/45">전환</p>
          <p className="num-mono font-semibold text-card-text">{formatNumber(creative.conversions)}건</p>
        </div>
        <div>
          <p className="text-white/45">CTR</p>
          <p className="num-mono font-semibold text-card-text">{formatPercent(creative.ctr * 100, 2)}</p>
        </div>
        <div>
          <p className="text-white/45">CPA</p>
          <p className="num-mono font-semibold text-card-text">
            {Number.isFinite(creative.cpa) ? formatKRW(creative.cpa) : '전환 없음'}
          </p>
        </div>
      </div>
    </GradientCard>
  );
}
