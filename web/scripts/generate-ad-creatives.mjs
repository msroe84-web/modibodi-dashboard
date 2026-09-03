#!/usr/bin/env node
/**
 * Regenerates src/data/adCreatives.json — the dummy creative dataset backing the 광고 소재 분석
 * tab's 4 sub-tabs. Deterministic (seeded PRNG), so re-running produces byte-identical output
 * unless CREATIVE_COUNT or the seed changes. All values are placeholders (모디보디 is pre-launch).
 *
 * Usage: node scripts/generate-ad-creatives.mjs > src/data/adCreatives.json
 */

const CREATIVE_COUNT = 24;
const SEED = 20260901 + 97;
const TODAY = new Date('2026-09-01T00:00:00Z');

// Mirrors mockOverview.ts's PRODUCTS and mockMarketing.ts's Meta campaign ids — kept as plain
// literals here since this script runs standalone (no TS import) before the app builds.
const PRODUCTS = ['클래식 브리프', '심프리 하이웨스트', '스윔 보텀', '틴 브리프'];
const CAMPAIGN_IDS = ['meta-brand', 'meta-retarget'];
const FORMATS = ['image', 'video', 'carousel'];
const HOOKS = ['후기/UGC', '비교', '할인/세일', '착용컷', '브랜드 스토리', '베네핏 설명'];

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(SEED);

function pick(arr) {
  return arr[Math.floor(rand() * arr.length)];
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

const creatives = [];
for (let i = 0; i < CREATIVE_COUNT; i++) {
  const product = pick(PRODUCTS);
  const format = FORMATS[i % FORMATS.length];
  const hook = pick(HOOKS);
  const campaignId = pick(CAMPAIGN_IDS);
  // Spread performance intentionally wide, like the original hand-written mock, so
  // rankCreatives() and the format/campaign breakdowns show a real mix rather than a flat line.
  const tier = i < 6 ? 'top' : i < 16 ? 'mid' : 'bottom';
  const spend = Math.round((tier === 'top' ? 700_000 : tier === 'mid' ? 500_000 : 350_000) * (0.7 + rand() * 0.6));
  const ctr = (tier === 'top' ? 0.028 : tier === 'mid' ? 0.016 : 0.006) * (0.75 + rand() * 0.5);
  const cpc = 280 + rand() * 220;
  const impressions = Math.max(1, Math.round(spend / cpc / ctr));
  const clicks = Math.max(0, Math.round(impressions * ctr));
  const cvr = (tier === 'top' ? 0.055 : tier === 'mid' ? 0.035 : 0.012) * (0.7 + rand() * 0.6);
  const conversions = tier === 'bottom' && rand() < 0.15 ? 0 : Math.max(0, Math.round(clicks * cvr));
  const roas = tier === 'top' ? 3.2 : tier === 'mid' ? 2.1 : 0.9;
  const revenue = Math.round(spend * roas * (0.8 + rand() * 0.4));
  const runningDays = 10 + Math.floor(rand() * 80);
  const status = tier === 'bottom' && rand() < 0.35 ? 'paused' : 'active';

  creatives.push({
    id: `ad-${i + 1}`,
    name: `${product} ${hook} ${format === 'video' ? '숏폼' : format === 'carousel' ? '캐러셀' : '이미지'}`,
    format,
    channel: 'Meta',
    status,
    campaignId,
    spend,
    impressions,
    clicks,
    conversions,
    revenue,
    startDate: isoDate(daysAgo(runningDays)),
  });
}

process.stdout.write(JSON.stringify(creatives, null, 2) + '\n');
