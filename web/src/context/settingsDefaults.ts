export interface AppSettings {
  monthlyRevenueGoal: number;
  /** productName -> low-stock reorder threshold (units) */
  reorderThreshold: Record<string, number>;
  /** productName -> { price, cost } in KRW */
  pricing: Record<string, { price: number; cost: number }>;
  /** channel -> commission rate, 0-1. null = 미확정 */
  feeRates: Record<string, number | null>;
  /** channel -> monthly ad budget in KRW */
  adBudget: Record<string, number>;
}

export const DEFAULT_SETTINGS: AppSettings = {
  monthlyRevenueGoal: 80_000_000,
  reorderThreshold: {
    '클래식 브리프': 80,
    '심프리 하이웨스트': 60,
    '스윔 보텀': 40,
    '틴 브리프': 50,
  },
  pricing: {
    '클래식 브리프': { price: 32_000, cost: 12_800 },
    '심프리 하이웨스트': { price: 36_000, cost: 14_400 },
    '스윔 보텀': { price: 42_000, cost: 18_000 },
    '틴 브리프': { price: 28_000, cost: 11_200 },
  },
  feeRates: {
    자사몰: 0,
    무신사: 0.29,
    '29CM': 0.25,
    W컨셉: 0.28,
    카카오: null,
  },
  adBudget: {
    Meta: 6_000_000,
    네이버: 3_000_000,
    구글: 2_000_000,
    틱톡: 1_500_000,
  },
};
