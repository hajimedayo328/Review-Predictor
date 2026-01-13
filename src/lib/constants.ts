// 定数定義

// 顧客セグメント
export const SEGMENTS = {
  PRICE_SENSITIVE: 'Price Sensitive',
  QUALITY_FOCUSED: 'Quality Focused',
  DESIGN_LOVERS: 'Design Lovers',
  BRAND_LOYAL: 'Brand Loyal',
} as const;

// 顧客数
export const TOTAL_CUSTOMERS = 10000;
export const CUSTOMERS_PER_SEGMENT = 2500;

// ベクトル次元
export const EMBEDDING_DIMENSION = 384;
export const PROFILE_VECTOR_DIMENSION = 5;

// 評価予測の閾値
export const RATING_THRESHOLDS = {
  FIVE_STAR_SIMILARITY: 0.7,
  FIVE_STAR_QUALITY: 0.8,
  THREE_STAR_SIMILARITY: 0.5,
  THREE_STAR_PRICE: 0.7,
  TWO_STAR_SIMILARITY: 0.3,
} as const;

// シミュレーションステータス
export const SIMULATION_STATUS = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;
