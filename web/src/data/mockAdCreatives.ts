import type { AdCreativeRow } from '../lib/types';

/**
 * Meta creative-level performance, mocked. Deliberately spread across a wide CTR/CPA range
 * so `rankCreatives` (creativeScoring.ts) produces a visible mix of best/good/replace grades.
 * Real Meta creative-API sync (incl. thumbnail images) is out of scope — see the design spec.
 */
export const mockAdCreatives: AdCreativeRow[] = [
  { id: 'ad-1', name: '클래식 브리프 여름 세일 숏폼', format: 'video', channel: 'Meta', status: 'active', spend: 950_000, impressions: 210_000, clicks: 6_300, conversions: 210, startDate: '2026-07-02' },
  { id: 'ad-2', name: '심프리 하이웨스트 UGC 후기', format: 'video', channel: 'Meta', status: 'active', spend: 820_000, impressions: 180_000, clicks: 5_400, conversions: 205, startDate: '2026-07-10' },
  { id: 'ad-3', name: '틴 브리프 백투스쿨 캐러셀', format: 'carousel', channel: 'Meta', status: 'active', spend: 700_000, impressions: 150_000, clicks: 3_000, conversions: 140, startDate: '2026-07-18' },
  { id: 'ad-4', name: '스윔 보텀 여름 마감 이미지', format: 'image', channel: 'Meta', status: 'active', spend: 600_000, impressions: 130_000, clicks: 2_340, conversions: 110, startDate: '2026-06-28' },
  { id: 'ad-5', name: '클래식 브리프 비교 이미지', format: 'image', channel: 'Meta', status: 'active', spend: 680_000, impressions: 160_000, clicks: 2_560, conversions: 118, startDate: '2026-07-05' },
  { id: 'ad-6', name: '심프리 하이웨스트 베네핏 캐러셀', format: 'carousel', channel: 'Meta', status: 'active', spend: 590_000, impressions: 140_000, clicks: 2_100, conversions: 96, startDate: '2026-07-22' },
  { id: 'ad-7', name: '틴 브리프 인플루언서 영상', format: 'video', channel: 'Meta', status: 'active', spend: 760_000, impressions: 175_000, clicks: 2_450, conversions: 118, startDate: '2026-08-01' },
  { id: 'ad-8', name: '스윔 보텀 착용컷 이미지', format: 'image', channel: 'Meta', status: 'active', spend: 540_000, impressions: 120_000, clicks: 1_440, conversions: 78, startDate: '2026-06-20' },
  { id: 'ad-9', name: '클래식 브리프 정적 배너', format: 'image', channel: 'Meta', status: 'active', spend: 610_000, impressions: 145_000, clicks: 1_305, conversions: 62, startDate: '2026-06-15' },
  { id: 'ad-10', name: '심프리 하이웨스트 초기 티저', format: 'video', channel: 'Meta', status: 'active', spend: 430_000, impressions: 95_000, clicks: 760, conversions: 34, startDate: '2026-06-10' },
  { id: 'ad-11', name: '틴 브리프 구정보 배너', format: 'image', channel: 'Meta', status: 'active', spend: 470_000, impressions: 110_000, clicks: 770, conversions: 29, startDate: '2026-06-05' },
  { id: 'ad-12', name: '스윔 보텀 재고소진 카피', format: 'image', channel: 'Meta', status: 'active', spend: 520_000, impressions: 100_000, clicks: 600, conversions: 18, startDate: '2026-06-01' },
  { id: 'ad-13', name: '클래식 브리프 구버전 캐러셀', format: 'carousel', channel: 'Meta', status: 'paused', spend: 410_000, impressions: 90_000, clicks: 450, conversions: 9, startDate: '2026-05-20' },
  { id: 'ad-14', name: '심프리 하이웨스트 테스트 소재 A', format: 'image', channel: 'Meta', status: 'active', spend: 260_000, impressions: 60_000, clicks: 240, conversions: 0, startDate: '2026-05-15' },
];
