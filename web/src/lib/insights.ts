import { aggregate, filterSeries, getPresetRange, getPreviousRange, percentChange, type TimeSeriesPoint } from './dateRange';
import { formatPercent, formatRoas } from './format';
import type { ProductSalesRow } from './types';

export type InsightSeverity = 'critical' | 'warning' | 'good';

export interface Insight {
  id: string;
  severity: InsightSeverity;
  title: string;
  body: string;
}

export interface ChannelPerfForInsight {
  channel: string;
  spend: number;
  revenue: number;
  roas: number;
}

interface BuildInsightsParams {
  channelPerf: ChannelPerfForInsight[];
  products: ProductSalesRow[];
  repeatRateSeries: TimeSeriesPoint[];
  adSpendSeries: TimeSeriesPoint[];
  newCustomersSeries: TimeSeriesPoint[];
  monthToDateRevenue: number;
  monthlyGoal: number;
  today: Date;
}

const SEVERITY_ORDER: Record<InsightSeverity, number> = { critical: 0, warning: 1, good: 2 };

/** Every insight is computed fresh from the current mock (or, once real APIs land, real) data —
 *  nothing here is a hardcoded sentence. Returned pre-sorted 긴급 > 주의 > 긍정. */
export function buildInsights({
  channelPerf,
  products,
  repeatRateSeries,
  adSpendSeries,
  newCustomersSeries,
  monthToDateRevenue,
  monthlyGoal,
  today,
}: BuildInsightsParams): Insight[] {
  const insights: Insight[] = [];

  const spendingChannels = channelPerf.filter((c) => c.spend > 0);
  if (spendingChannels.length > 0) {
    const worst = [...spendingChannels].sort((a, b) => a.roas - b.roas)[0];
    const best = [...spendingChannels].sort((a, b) => b.roas - a.roas)[0];

    insights.push({
      id: 'channel-roas-worst',
      severity: worst.roas < 1 ? 'critical' : 'warning',
      title: `${worst.channel} ROAS ${worst.roas < 1 ? '적자' : '저조'}`,
      body: `선택 기간 ROAS ${formatRoas(worst.roas)}로 전 채널 중 가장 낮습니다.${
        worst.roas < 1 ? ' 광고비가 매출보다 큽니다 — 집행을 점검하세요.' : ''
      }`,
    });

    if (best.channel !== worst.channel) {
      insights.push({
        id: 'channel-roas-best',
        severity: 'good',
        title: `${best.channel} ROAS 최고`,
        body: `선택 기간 ROAS ${formatRoas(best.roas)}로 전 채널 중 가장 높습니다. 예산 확대를 검토해볼 만합니다.`,
      });
    }
  }

  // CAC (고객획득비용) — always the trailing 7 days ending "today", regardless of the page's
  // date-range picker, so this reading doesn't jump around as the user browses other ranges.
  const last7 = getPresetRange('7d', today);
  const prev7 = getPreviousRange(last7);
  const spendLast7 = aggregate(filterSeries(adSpendSeries, last7), 'sum');
  const spendPrev7 = aggregate(filterSeries(adSpendSeries, prev7), 'sum');
  const newCustLast7 = aggregate(filterSeries(newCustomersSeries, last7), 'sum');
  const newCustPrev7 = aggregate(filterSeries(newCustomersSeries, prev7), 'sum');
  const cacLast7 = newCustLast7 > 0 ? spendLast7 / newCustLast7 : 0;
  const cacPrev7 = newCustPrev7 > 0 ? spendPrev7 / newCustPrev7 : 0;
  if (cacLast7 > 0 && cacPrev7 > 0) {
    const cacChange = percentChange(cacLast7, cacPrev7);
    insights.push({
      id: 'cac-trend',
      severity: cacChange > 0 ? 'warning' : 'good',
      title: `고객획득비용(CAC) ${cacChange > 0 ? '상승' : '하락'}`,
      body: `최근 7일 CAC가 직전 7일 대비 ${formatPercent(Math.abs(cacChange))} ${cacChange > 0 ? '올랐습니다' : '내렸습니다'}.`,
    });
  }

  if (products.length > 0) {
    const lowestConversion = [...products].sort((a, b) => a.conversionRate - b.conversionRate)[0];
    insights.push({
      id: 'product-cvr-worst',
      severity: 'warning',
      title: `${lowestConversion.product} 전환율 저조`,
      body: `전체 상품 중 전환율이 ${formatPercent(lowestConversion.conversionRate)}로 가장 낮습니다. 상세페이지 점검을 고려하세요.`,
    });
  }

  // 재구매율 전월 대비 — calendar-month comparison anchored on `today`, independent of the picker.
  const monthStart = `${today.toISOString().slice(0, 7)}-01`;
  const thisMonthRange = { start: monthStart, end: today.toISOString().slice(0, 10) };
  const prevMonthRange = getPreviousRange(thisMonthRange);
  const repeatThisMonth = aggregate(filterSeries(repeatRateSeries, thisMonthRange), 'avg');
  const repeatPrevMonth = aggregate(filterSeries(repeatRateSeries, prevMonthRange), 'avg');
  if (repeatThisMonth > 0 && repeatPrevMonth > 0) {
    const repeatChange = percentChange(repeatThisMonth, repeatPrevMonth);
    insights.push({
      id: 'repeat-rate-mom',
      severity: repeatChange >= 0 ? 'good' : 'warning',
      title: `재구매율 전월 대비 ${repeatChange >= 0 ? '상승' : '하락'}`,
      body: `이번 달 재구매율 ${formatPercent(repeatThisMonth)}로 전월 대비 ${formatPercent(Math.abs(repeatChange))} ${
        repeatChange >= 0 ? '올랐습니다' : '내렸습니다'
      }.`,
    });
  }

  if (monthlyGoal > 0) {
    const dayOfMonth = today.getUTCDate();
    const daysInMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0)).getUTCDate();
    const expectedByNow = monthlyGoal * (dayOfMonth / daysInMonth);
    const pacePct = expectedByNow > 0 ? (monthToDateRevenue / expectedByNow) * 100 : 0;
    insights.push({
      id: 'revenue-pace',
      severity: pacePct >= 85 ? 'good' : 'warning',
      title: pacePct >= 100 ? '이번 달 매출 목표 페이스 초과' : pacePct >= 85 ? '이번 달 매출 목표 페이스 순항' : '이번 달 매출 목표 페이스 지연',
      body: `이번 달 ${dayOfMonth}일차 기준 목표 대비 진행률 ${formatPercent(pacePct, 0)}입니다.`,
    });
  }

  return insights.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
