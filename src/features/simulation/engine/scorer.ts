// スコアリングロジック
// 商品の総合スコアを計算

import { SimulationSummary } from './aggregator';

export interface ProductScore {
  overallScore: number;      // 総合スコア (0-100)
  marketFit: number;         // 市場適合度 (0-100)
  customerSatisfaction: number; // 顧客満足度 (0-100)
  conversionPotential: number;  // コンバージョンポテンシャル (0-100)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
}

/**
 * シミュレーション結果から商品スコアを計算
 * @param summary シミュレーション結果の集計
 * @returns 商品スコア
 */
export function calculateProductScore(summary: SimulationSummary): ProductScore {
  // 顧客満足度: 平均評価を0-100に変換
  const customerSatisfaction = ((summary.avgRating - 1) / 4) * 100;

  // コンバージョンポテンシャル: 星4-5の割合
  const conversionPotential = summary.distribution.star4 + summary.distribution.star5;

  // 市場適合度: セグメント間のバランスを考慮
  const segmentScores = summary.segments.map(s => s.avgRating);
  const avgSegmentScore = segmentScores.length > 0
    ? segmentScores.reduce((a, b) => a + b, 0) / segmentScores.length
    : 0;
  const segmentVariance = segmentScores.length > 0
    ? segmentScores.reduce((sum, s) => sum + Math.pow(s - avgSegmentScore, 2), 0) / segmentScores.length
    : 0;
  // 分散が小さいほど市場適合度が高い
  const marketFit = Math.max(0, 100 - segmentVariance * 50);

  // 総合スコア: 加重平均
  const overallScore = (
    customerSatisfaction * 0.4 +
    conversionPotential * 0.35 +
    marketFit * 0.25
  );

  // リスクレベル判定
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  if (summary.avgRating >= 4 && conversionPotential >= 60) {
    riskLevel = 'LOW';
  } else if (summary.avgRating >= 3 && conversionPotential >= 40) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'HIGH';
  }

  // レコメンデーション生成
  const recommendation = generateRecommendation(summary, riskLevel);

  return {
    overallScore: Math.round(overallScore * 10) / 10,
    marketFit: Math.round(marketFit * 10) / 10,
    customerSatisfaction: Math.round(customerSatisfaction * 10) / 10,
    conversionPotential: Math.round(conversionPotential * 10) / 10,
    riskLevel,
    recommendation,
  };
}

/**
 * レコメンデーションを生成
 */
function generateRecommendation(summary: SimulationSummary, riskLevel: string): string {
  const recommendations: string[] = [];

  // 平均評価に基づくアドバイス
  if (summary.avgRating >= 4.5) {
    recommendations.push('非常に高い評価が期待できます。積極的な市場投入を推奨します。');
  } else if (summary.avgRating >= 4) {
    recommendations.push('良好な評価が期待できます。ターゲット層を明確にして展開しましょう。');
  } else if (summary.avgRating >= 3) {
    recommendations.push('改善の余地があります。顧客フィードバックを参考に商品を調整してください。');
  } else {
    recommendations.push('大幅な改善が必要です。コンセプトの見直しを検討してください。');
  }

  // セグメント分析に基づくアドバイス
  const bestSegment = summary.segments.reduce(
    (best, s) => s.avgRating > best.avgRating ? s : best,
    summary.segments[0]
  );
  const worstSegment = summary.segments.reduce(
    (worst, s) => s.avgRating < worst.avgRating ? s : worst,
    summary.segments[0]
  );

  if (bestSegment && worstSegment && bestSegment.avgRating - worstSegment.avgRating > 1) {
    recommendations.push(
      `「${bestSegment.segmentName}」層への訴求が効果的です。` +
      `「${worstSegment.segmentName}」層へのアプローチを見直してください。`
    );
  }

  return recommendations.join(' ');
}

/**
 * スコアに基づくグレードを取得
 */
export function getScoreGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (score >= 90) return 'S';
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}
