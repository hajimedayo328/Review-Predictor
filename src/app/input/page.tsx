'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface RecentSimulation {
  id: string;
  createdAt: string;
  avgRating: number | null;
  conversionRate: number | null;
  status: string;
  product: {
    name: string;
    category: string;
  };
}

export default function InputPage() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentSimulation[]>([]);
  const [recentError, setRecentError] = useState<string | null>(null);

  // デモ用サンプル説明文
  const sampleDescriptions = [
    {
      label: '高級財布',
      text: '高級イタリアンレザーを使用した職人手作りの本革財布。10年使える耐久性と、使い込むほど味が出る経年変化が特徴。カード収納12枚、小銭入れ付き。シンプルで飽きのこないデザイン。',
    },
    {
      label: 'ワイヤレスイヤホン',
      text: '最新のノイズキャンセリング技術搭載のワイヤレスイヤホン。バッテリー持続時間30時間。IPX5防水対応でスポーツにも最適。クリアな高音質とパワフルな重低音を実現。',
    },
    {
      label: 'オーガニック化粧品',
      text: '100%天然由来成分のオーガニックスキンケアセット。敏感肌の方にも安心。パラベンフリー、合成香料不使用。植物の力で肌本来の美しさを引き出します。',
    },
  ];

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await fetch('/api/simulations/recent');
        if (!res.ok) return;
        const data = await res.json();
        setRecent(data.simulations || []);
      } catch (e) {
        setRecentError('直近のシミュレーション取得に失敗しました');
      }
    };

    fetchRecent();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (description.length < 10) {
      setError('商品説明は10文字以上入力してください');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'シミュレーションに失敗しました');
      }

      // 結果ページへリダイレクト
      router.push(`/result/${data.simulationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Review Predictor
          </h1>
          <p className="text-gray-600 text-lg">
            商品説明を入力して、10,000人の顧客がどう評価するかをシミュレーションします
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                商品説明
              </label>

              {/* サンプル入力ボタン */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs text-gray-500 self-center">サンプル:</span>
                {sampleDescriptions.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => setDescription(sample.text)}
                    disabled={isLoading}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-full border border-gray-300 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>

              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例: 高級レザーを使用した職人手作りの本革財布。シンプルで飽きのこないデザイン。カード収納8枚、小銭入れ付き。"
                className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-800"
                disabled={isLoading}
              />
              <p className="mt-2 text-sm text-gray-500">
                {description.length} / 2000文字
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || description.length < 10}
              className={`w-full py-4 px-6 rounded-lg text-white font-semibold text-lg transition-all
                ${
                  isLoading || description.length < 10
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  シミュレーション中...
                </span>
              ) : (
                'シミュレーションを実行'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              シミュレーションの仕組み
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">1.</span>
                商品説明をAIがベクトル化
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">2.</span>
                10,000人の仮想顧客との類似度を計算
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">3.</span>
                各顧客の評価（1-5星）を予測
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">4.</span>
                セグメント別の分析結果を表示
              </li>
            </ul>
          </div>
        </div>

        {/* 直近のシミュレーション */}
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            直近のシミュレーション
          </h2>
          {recentError && (
            <p className="text-xs text-red-500 mb-2">{recentError}</p>
          )}
          {recent.length === 0 ? (
            <p className="text-sm text-gray-500">
              まだシミュレーション履歴がありません。
            </p>
          ) : (
            <ul className="space-y-3">
              {recent.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between px-4 py-3 bg-white/60 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition"
                  onClick={() => router.push(`/result/${s.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {s.product.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {new Date(s.createdAt).toLocaleString('ja-JP')} ・{' '}
                      {s.product.category}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm text-gray-700">
                      {s.avgRating !== null ? `${s.avgRating.toFixed(1)}★` : '-'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {s.conversionRate !== null
                        ? `高評価率 ${s.conversionRate.toFixed(1)}%`
                        : s.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          データベース授業 最終課題 - Review Predictor
        </p>
      </div>
    </div>
  );
}
