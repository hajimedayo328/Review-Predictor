// シミュレーション関連の型定義

export interface SimulationResult {
  simulationId: string;
  avgRating: number;
  conversionRate: number;
  distribution: RatingDistribution;
  segments: SegmentAnalysis[];
}

export interface RatingDistribution {
  star5: number;
  star4: number;
  star3: number;
  star2: number;
  star1: number;
}

export interface SegmentAnalysis {
  name: string;
  avgRating: number;
  customerCount: number;
}

export type SimulationStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
