'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

interface SimulationResult {
  simulation: {
    id: string;
    status: string;
    avgRating: number | null;
    conversionRate: number | null;
    createdAt: string;
  };
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    seller: string;
  };
  distribution: {
    star1: number;
    star2: number;
    star3: number;
    star4: number;
    star5: number;
  };
  segments: {
    name: string;
    avgRating: number;
    customerCount: number;
    distribution: {
      star1: number;
      star2: number;
      star3: number;
      star4: number;
      star5: number;
    };
  }[];
  similarityDistribution: {
    bucket: number;
    count: number;
  }[];
  sampleReviews: {
    rating: number;
    reviewText: string;
    similarity: number;
    segmentName: string;
  }[];
  totalReviews: number;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

// セグメント名の表示用ラベル（英語 → 日本語）
const SEGMENT_LABELS: Record<string, string> = {
  'Brand Loyal': 'ブランド重視',
  'Design Lovers': 'デザイン重視',
  'Price Sensitive': '価格重視',
  'Quality Focused': '品質重視',
};

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const simulationId = params.simulationId as string;
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('このシミュレーション結果を削除しますか？\nこの操作は取り消せません。')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/simulations/${simulationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '削除に失敗しました');
      }

      alert('シミュレーション結果を削除しました');
      router.push('/input');
    } catch (err) {
      alert(err instanceof Error ? err.message : '削除に失敗しました');
      setDeleting(false);
    }
  };

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await fetch(`/api/results/${simulationId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '結果の取得に失敗しました');
        }

        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [simulationId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">結果を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '結果が見つかりません'}</p>
          <Link
            href="/input"
            className="text-blue-600 hover:underline"
          >
            入力画面に戻る
          </Link>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: '1', value: result.distribution.star1, label: '1' },
    { name: '2', value: result.distribution.star2, label: '2' },
    { name: '3', value: result.distribution.star3, label: '3' },
    { name: '4', value: result.distribution.star4, label: '4' },
    { name: '5', value: result.distribution.star5, label: '5' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            シミュレーション結果
          </h1>
          <p className="text-gray-600">
            {result.totalReviews.toLocaleString()}人の顧客による予測評価
          </p>
        </div>

        {/* メインスコア */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* 平均評価 */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">平均評価</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-6xl font-bold text-gray-800">
                  {result.simulation.avgRating?.toFixed(1) || '-'}
                </span>
                <span className="text-3xl text-yellow-500">★</span>
              </div>
              <div className="flex justify-center mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-2xl ${
                      star <= Math.round(result.simulation.avgRating || 0)
                        ? 'text-yellow-500'
                        : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            {/* コンバージョン率 */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">高評価率（★4以上）</p>
              <div className="text-6xl font-bold text-green-600">
                {result.simulation.conversionRate?.toFixed(1) || '-'}
                <span className="text-3xl">%</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {Math.round(
                  (result.totalReviews * (result.simulation.conversionRate || 0)) / 100
                ).toLocaleString()}
                人が高評価
              </p>
            </div>
          </div>
        </div>

        {/* 評価分布 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">評価分布</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={30}
                  tickFormatter={(value) => `★${value}`}
                />
                <Tooltip
                  formatter={(value) => [`${(value as number).toFixed(1)}%`, '割合']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* セグメント分析 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            セグメント別分析
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {result.segments.map((segment) => (
              <div
                key={segment.name}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800">
                    {SEGMENT_LABELS[segment.name] ?? segment.name}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {segment.customerCount.toLocaleString()}人
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-800">
                    {segment.avgRating.toFixed(1)}
                  </span>
                  <span className="text-yellow-500">★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
                    <div
                      className="bg-blue-500 rounded-full h-2"
                      style={{ width: `${(segment.avgRating / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* セグメント別分布グラフ */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              セグメント別評価分布
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={result.segments.map(seg => ({
                    segment: SEGMENT_LABELS[seg.name] ?? seg.name,
                    '★1': seg.distribution.star1,
                    '★2': seg.distribution.star2,
                    '★3': seg.distribution.star3,
                    '★4': seg.distribution.star4,
                    '★5': seg.distribution.star5,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="segment" />
                  <YAxis unit="%" />
                  <Tooltip formatter={(value) => [`${(value as number).toFixed(1)}%`, '割合']} />
                  <Legend />
                  <Bar dataKey="★1" stackId="a" fill={COLORS[0]} />
                  <Bar dataKey="★2" stackId="a" fill={COLORS[1]} />
                  <Bar dataKey="★3" stackId="a" fill={COLORS[2]} />
                  <Bar dataKey="★4" stackId="a" fill={COLORS[3]} />
                  <Bar dataKey="★5" stackId="a" fill={COLORS[4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 類似度分布 */}
        {result.similarityDistribution && result.similarityDistribution.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              類似度分布
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              商品説明と顧客プロファイルの類似度の分布を表示します。
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.similarityDistribution.map(d => ({
                  ...d,
                  label: `${(d.bucket * 100).toFixed(0)}%`,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${(value as number).toLocaleString()}人`, '顧客数']} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* サンプルレビュー */}
        {result.sampleReviews && result.sampleReviews.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              サンプルレビュー
            </h2>
            <div className="space-y-4">
              {result.sampleReviews.map((review, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-lg ${
                              star <= review.rating
                                ? 'text-yellow-500'
                                : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {SEGMENT_LABELS[review.segmentName] ?? review.segmentName}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      類似度: {(review.similarity * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-gray-700">{review.reviewText}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 商品情報 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">商品情報</h2>
          <div className="space-y-3 text-sm">
            <p>
              <span className="text-gray-500">カテゴリ: </span>
              <span className="text-gray-800">{result.product.category}</span>
            </p>
            <p>
              <span className="text-gray-500">説明: </span>
              <span className="text-gray-800">{result.product.description}</span>
            </p>
          </div>
        </div>

        {/* アクション */}
        <div className="flex justify-center gap-4">
          <Link
            href="/input"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            新しいシミュレーション
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
          >
            {deleting ? '削除中...' : 'この結果を削除'}
          </button>
        </div>
      </div>
    </div>
  );
}
