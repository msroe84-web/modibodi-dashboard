import { useState, type ChangeEvent } from 'react';
import { RotateCcwIcon } from 'lucide-react';
import { ChartCard } from '../ui/ChartCard';
import { useSettings } from '../../context/SettingsContext';
import { formatPercent } from '../../lib/format';

function toNumber(raw: string): number {
  if (raw.trim() === '') return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

const inputClass =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-card-text outline-none transition-colors placeholder:text-white/30 focus:border-[var(--card-silver)] focus:ring-1 focus:ring-[var(--card-silver)]';

const rowLabelClass = 'text-[13px] font-medium text-white/80';

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-card-hairline py-2.5 last:border-b-0">
      <span className={rowLabelClass}>{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

export function SettingsTab() {
  const { settings, updateSettings, resetSettings } = useSettings();

  // Local text buffer for fee-rate inputs while a channel is unconfirmed (null),
  // so typed input isn't lost even though it isn't written to settings yet.
  const [feeDrafts, setFeeDrafts] = useState<Record<string, string>>({});

  function handleReset() {
    const ok = window.confirm('모든 설정을 임시값으로 초기화할까요? 로컬에 저장된 수정 내용이 모두 사라집니다.');
    if (ok) resetSettings();
  }

  function handleGoalChange(e: ChangeEvent<HTMLInputElement>) {
    updateSettings({ monthlyRevenueGoal: toNumber(e.target.value) });
  }

  function handleThresholdChange(product: string, e: ChangeEvent<HTMLInputElement>) {
    updateSettings({
      reorderThreshold: { ...settings.reorderThreshold, [product]: toNumber(e.target.value) },
    });
  }

  function handlePriceChange(product: string, field: 'price' | 'cost', e: ChangeEvent<HTMLInputElement>) {
    const current = settings.pricing[product];
    updateSettings({
      pricing: {
        ...settings.pricing,
        [product]: { ...current, [field]: toNumber(e.target.value) },
      },
    });
  }

  function handleAdBudgetChange(channel: string, e: ChangeEvent<HTMLInputElement>) {
    updateSettings({ adBudget: { ...settings.adBudget, [channel]: toNumber(e.target.value) } });
  }

  function handleFeeInputChange(channel: string, confirmed: boolean, e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (confirmed) {
      updateSettings({ feeRates: { ...settings.feeRates, [channel]: toNumber(raw) / 100 } });
    } else {
      // Not confirmed yet: keep the typed value in a local draft only, settings stays null.
      setFeeDrafts((prev) => ({ ...prev, [channel]: raw }));
    }
  }

  function handleFeeConfirmToggle(channel: string, nextConfirmed: boolean) {
    if (nextConfirmed) {
      const draft = feeDrafts[channel];
      const parsed = draft !== undefined ? toNumber(draft) : 0;
      updateSettings({ feeRates: { ...settings.feeRates, [channel]: parsed / 100 } });
    } else {
      const currentRate = settings.feeRates[channel];
      // Seed the draft with the value being un-confirmed so it isn't lost.
      setFeeDrafts((prev) => ({
        ...prev,
        [channel]: currentRate != null ? String(Math.round(currentRate * 1000) / 10) : (prev[channel] ?? ''),
      }));
      updateSettings({ feeRates: { ...settings.feeRates, [channel]: null } });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[20px] font-extrabold text-ink">설정</h1>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-lg border border-card-critical/40 px-3 py-1.5 text-[13px] font-semibold text-card-critical transition-colors hover:bg-card-critical/10"
        >
          <RotateCcwIcon size={14} />
          임시값으로 초기화
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="목표" subtitle="월 매출 목표 (KRW)">
          <FieldRow label="월 매출 목표">
            <input
              type="number"
              className={`${inputClass} w-40 text-right num-mono`}
              value={settings.monthlyRevenueGoal}
              onChange={handleGoalChange}
            />
          </FieldRow>
        </ChartCard>

        <ChartCard title="재고 기준" subtitle="제품별 재고 부족 알림 임계값 (개)">
          {Object.entries(settings.reorderThreshold).map(([product, threshold]) => (
            <FieldRow key={product} label={product}>
              <input
                type="number"
                className={`${inputClass} w-28 text-right num-mono`}
                value={threshold}
                onChange={(e) => handleThresholdChange(product, e)}
              />
            </FieldRow>
          ))}
        </ChartCard>

        <ChartCard title="판매가·원가" subtitle="제품별 판매가 / 원가 (KRW)" className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
            {Object.entries(settings.pricing).map(([product, row]) => {
              const marginPct = row.price > 0 ? ((row.price - row.cost) / row.price) * 100 : 0;
              return (
                <div key={product} className="flex items-center justify-between gap-3 border-b border-card-hairline py-2.5 last:border-b-0">
                  <span className={rowLabelClass}>{product}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end">
                      <span className="mb-0.5 text-[10px] text-white/40">판매가</span>
                      <input
                        type="number"
                        className={`${inputClass} w-24 text-right num-mono`}
                        value={row.price}
                        onChange={(e) => handlePriceChange(product, 'price', e)}
                      />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="mb-0.5 text-[10px] text-white/40">원가</span>
                      <input
                        type="number"
                        className={`${inputClass} w-24 text-right num-mono`}
                        value={row.cost}
                        onChange={(e) => handlePriceChange(product, 'cost', e)}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right text-[11px] text-white/45">
                      마진 {formatPercent(marginPct)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>

        <ChartCard title="수수료율" subtitle="채널별 판매 수수료율 (%) — 미확정 채널은 확정 체크 필요">
          {Object.entries(settings.feeRates).map(([channel, rate]) => {
            const confirmed = rate !== null;
            const displayValue = confirmed
              ? String(Math.round((rate as number) * 1000) / 10)
              : (feeDrafts[channel] ?? '');
            return (
              <FieldRow key={channel} label={channel}>
                <label className="flex items-center gap-1.5 text-[11px] text-white/50">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => handleFeeConfirmToggle(channel, e.target.checked)}
                    className="h-3.5 w-3.5 accent-[var(--card-silver)]"
                  />
                  확정
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className={`${inputClass} w-24 text-right num-mono`}
                    value={displayValue}
                    placeholder={confirmed ? undefined : '미확정'}
                    onChange={(e) => handleFeeInputChange(channel, confirmed, e)}
                  />
                </div>
                <span className="w-3 text-[12px] text-white/40">%</span>
              </FieldRow>
            );
          })}
        </ChartCard>

        <ChartCard title="광고 예산" subtitle="채널별 월 광고 예산 (KRW)">
          {Object.entries(settings.adBudget).map(([channel, budget]) => (
            <FieldRow key={channel} label={channel}>
              <input
                type="number"
                className={`${inputClass} w-32 text-right num-mono`}
                value={budget}
                onChange={(e) => handleAdBudgetChange(channel, e)}
              />
            </FieldRow>
          ))}
        </ChartCard>
      </div>
    </div>
  );
}
