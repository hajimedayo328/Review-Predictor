// 評価予測エンジン
// 顧客の類似度とプロファイルから星評価を予測

import { SimilarCustomer } from '@/features/vector/search';

export interface PredictedRating {
  customerId: string;
  rating: number; // 1-5
  similarity: number;
}

// プロファイルベクトルのインデックス
const PROFILE_INDEX = {
  PRICE_SENSITIVITY: 0,    // 価格敏感度
  QUALITY_FOCUS: 1,        // 品質重視度
  DESIGN_FOCUS: 2,         // デザイン重視度
  BRAND_LOYALTY: 3,        // ブランドロイヤリティ
  REVIEW_STRICTNESS: 4,    // レビュー厳しさ
} as const;

/**
 * 単一顧客の評価を予測
 * @param similarity 商品との類似度 (0-1)
 * @param profileVector 顧客のプロファイルベクトル (5次元)
 * @returns 予測評価 (1-5)
 */
export function predictRating(similarity: number, profileVector: number[]): number {
  const priceSensitivity = profileVector[PROFILE_INDEX.PRICE_SENSITIVITY] || 0.5;
  const qualityFocus = profileVector[PROFILE_INDEX.QUALITY_FOCUS] || 0.5;
  const designFocus = profileVector[PROFILE_INDEX.DESIGN_FOCUS] || 0.5;
  const brandLoyalty = profileVector[PROFILE_INDEX.BRAND_LOYALTY] || 0.5;
  const reviewStrictness = profileVector[PROFILE_INDEX.REVIEW_STRICTNESS] || 0.5;

  // 基本スコア: 類似度を基準に計算
  let baseScore = similarity * 5;

  // 類似度が高い + 品質重視 → 星5傾向
  if (similarity > 0.7 && qualityFocus > 0.7) {
    baseScore = Math.min(5, baseScore + 0.8);
  }

  // 類似度が高い + ブランド重視 → 星4-5傾向
  if (similarity > 0.6 && brandLoyalty > 0.7) {
    baseScore = Math.min(5, baseScore + 0.5);
  }

  // 類似度中程度 + 価格敏感 → 星3傾向
  if (similarity > 0.4 && similarity < 0.7 && priceSensitivity > 0.7) {
    baseScore = Math.max(2, baseScore - 0.5);
  }

  // 類似度が低い → 星2以下傾向
  if (similarity < 0.3) {
    baseScore = Math.min(2.5, baseScore);
  }

  // レビュー厳しさで調整
  if (reviewStrictness > 0.7) {
    baseScore = Math.max(1, baseScore - 0.5);
  } else if (reviewStrictness < 0.3) {
    baseScore = Math.min(5, baseScore + 0.3);
  }

  // デザイン重視者は中間評価になりやすい
  if (designFocus > 0.7 && similarity > 0.4 && similarity < 0.7) {
    baseScore = Math.min(5, Math.max(3, baseScore));
  }

  // 1-5の整数に丸める
  return Math.max(1, Math.min(5, Math.round(baseScore)));
}

/**
 * 複数顧客の評価を一括予測
 * @param customers 類似度計算済みの顧客リスト
 * @returns 予測評価のリスト
 */
export function predictRatings(customers: SimilarCustomer[]): PredictedRating[] {
  if (customers.length === 0) return [];

  // 類似度をバッチ内で 0-1 に正規化して、分布が★1〜★5に散らばりやすくする
  let minSim = Number.POSITIVE_INFINITY;
  let maxSim = Number.NEGATIVE_INFINITY;

  for (const c of customers) {
    if (c.similarity < minSim) minSim = c.similarity;
    if (c.similarity > maxSim) maxSim = c.similarity;
  }

  // 全部同じ値だった場合のゼロ除算防止
  const range = maxSim - minSim || 1;

  return customers.map(customer => {
    const normalizedSim = (customer.similarity - minSim) / range; // 0〜1 にスケーリング

    return {
      customerId: customer.customerId,
      // 正規化された類似度を使って評価を計算
      rating: predictRating(normalizedSim, customer.profileVector),
      // 元の類似度はそのまま保持（集計や表示用）
      similarity: customer.similarity,
    };
  });
}

/**
 * 評価分布を計算
 * @param ratings 予測評価のリスト
 * @returns 各星の割合
 */
export function calculateRatingDistribution(ratings: PredictedRating[]): {
  star1: number;
  star2: number;
  star3: number;
  star4: number;
  star5: number;
} {
  const counts = { star1: 0, star2: 0, star3: 0, star4: 0, star5: 0 };
  const total = ratings.length;

  for (const { rating } of ratings) {
    switch (rating) {
      case 1: counts.star1++; break;
      case 2: counts.star2++; break;
      case 3: counts.star3++; break;
      case 4: counts.star4++; break;
      case 5: counts.star5++; break;
    }
  }

  // パーセンテージに変換
  return {
    star1: total > 0 ? (counts.star1 / total) * 100 : 0,
    star2: total > 0 ? (counts.star2 / total) * 100 : 0,
    star3: total > 0 ? (counts.star3 / total) * 100 : 0,
    star4: total > 0 ? (counts.star4 / total) * 100 : 0,
    star5: total > 0 ? (counts.star5 / total) * 100 : 0,
  };
}
