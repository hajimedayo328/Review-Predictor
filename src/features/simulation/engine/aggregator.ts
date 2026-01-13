// 結果集計エンジン
// シミュレーション結果を集計・分析

import { PredictedRating, calculateRatingDistribution } from './predictor';

export interface SegmentAnalysis {
  segmentName: string;
  customerCount: number;
  avgRating: number;
  distribution: {
    star1: number;
    star2: number;
    star3: number;
    star4: number;
    star5: number;
  };
}

export interface SimulationSummary {
  totalCustomers: number;
  avgRating: number;
  conversionRate: number; // 星4以上の割合
  distribution: {
    star1: number;
    star2: number;
    star3: number;
    star4: number;
    star5: number;
  };
  segments: SegmentAnalysis[];
}

interface RatingWithSegment extends PredictedRating {
  segmentName: string;
}

/**
 * シミュレーション結果を集計
 * @param ratings 予測評価のリスト（セグメント情報付き）
 * @returns 集計結果
 */
export function aggregateResults(ratings: RatingWithSegment[]): SimulationSummary {
  const totalCustomers = ratings.length;

  if (totalCustomers === 0) {
    return {
      totalCustomers: 0,
      avgRating: 0,
      conversionRate: 0,
      distribution: { star1: 0, star2: 0, star3: 0, star4: 0, star5: 0 },
      segments: [],
    };
  }

  // 全体の平均評価
  const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = totalRating / totalCustomers;

  // コンバージョン率（星4以上の割合）
  const highRatings = ratings.filter(r => r.rating >= 4).length;
  const conversionRate = (highRatings / totalCustomers) * 100;

  // 全体の分布
  const distribution = calculateRatingDistribution(ratings);

  // セグメント別分析
  const segmentMap = new Map<string, RatingWithSegment[]>();
  for (const rating of ratings) {
    const existing = segmentMap.get(rating.segmentName) || [];
    existing.push(rating);
    segmentMap.set(rating.segmentName, existing);
  }

  const segments: SegmentAnalysis[] = [];
  for (const [segmentName, segmentRatings] of segmentMap) {
    const segmentTotal = segmentRatings.reduce((sum, r) => sum + r.rating, 0);
    const segmentAvg = segmentTotal / segmentRatings.length;
    const segmentDist = calculateRatingDistribution(segmentRatings);

    segments.push({
      segmentName,
      customerCount: segmentRatings.length,
      avgRating: Math.round(segmentAvg * 100) / 100,
      distribution: segmentDist,
    });
  }

  // セグメント名でソート
  segments.sort((a, b) => a.segmentName.localeCompare(b.segmentName));

  return {
    totalCustomers,
    avgRating: Math.round(avgRating * 100) / 100,
    conversionRate: Math.round(conversionRate * 100) / 100,
    distribution,
    segments,
  };
}

/**
 * 評価の統計情報を計算
 */
export function calculateStatistics(ratings: PredictedRating[]): {
  mean: number;
  median: number;
  mode: number;
  stdDev: number;
} {
  if (ratings.length === 0) {
    return { mean: 0, median: 0, mode: 0, stdDev: 0 };
  }

  const values = ratings.map(r => r.rating);
  const n = values.length;

  // 平均
  const mean = values.reduce((a, b) => a + b, 0) / n;

  // 中央値
  const sorted = [...values].sort((a, b) => a - b);
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];

  // 最頻値
  const counts = new Map<number, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  let mode = 1;
  let maxCount = 0;
  for (const [value, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      mode = value;
    }
  }

  // 標準偏差
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(variance);

  return {
    mean: Math.round(mean * 100) / 100,
    median,
    mode,
    stdDev: Math.round(stdDev * 100) / 100,
  };
}
