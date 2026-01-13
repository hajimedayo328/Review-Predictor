# Review Predictor - 実装ガイド

このドキュメントは、Claude Codeを使ってReview Predictorを段階的に実装するための手順書です。

---

## 実装の流れ

### Phase 0: 環境準備（手動）

1. PostgreSQLのインストールとpgvector拡張機能の有効化
2. `.env`ファイルの作成

```env
DATABASE_URL="postgresql://user:password@localhost:5432/review_predictor"
```

---

### Phase 1: データベース基盤構築

**目的**: Prismaスキーマの作成とマイグレーション

**Claude Codeへの指示**:
```
docs/DESIGN.md の「3. データベース設計」を参照して、
prisma/schema.prisma を作成してください。

要件:
- pgvector拡張機能を使用
- Seller, Category, Product, Segment, Customer, Simulation, PredictedReview の7テーブル
- ベクトル型はUnsupported("vector(384)")で定義
- HNSWインデックスを設定

完了後、以下を実行:
npx prisma migrate dev --name init
npx prisma generate
```

---

### Phase 2: 顧客データ生成ロジック

**目的**: 10,000人の多様な顧客プロファイルを生成

**Claude Codeへの指示**:
```
prisma/seed.ts を作成してください。

要件:
- 10,000人のCustomerレコードを生成
- 各顧客は5次元のprofileVectorを持つ
  [価格敏感度, 品質重視度, デザイン重視度, ブランドロイヤリティ, レビュー厳しさ]
- 各次元は正規分布（平均0.5, 標準偏差0.2）でランダム生成
- 4つのSegment（Price Sensitive, Quality Focused, Design Lovers, Brand Loyal）に分類
- preferenceVectorは384次元のランダムベクトル（後でembeddingに置き換え）

完了後、以下を実行:
npx prisma db seed
```

---

### Phase 3: ベクトル埋め込みユーティリティ

**目的**: transformers.jsでテキストをベクトル化

**Claude Codeへの指示**:
```
src/features/vector/embedding.ts を作成してください。

要件:
- @xenova/transformers をインポート
- テキストを384次元ベクトルに変換する関数を実装
- モデル: 'Xenova/all-MiniLM-L6-v2'（軽量・高速）
- キャッシュ機能を実装（同じテキストは再計算しない）

必要なパッケージ:
npm install @xenova/transformers
```

---

### Phase 4: ベクトル検索ロジック

**目的**: pgvectorで類似顧客を検索

**Claude Codeへの指示**:
```
src/features/vector/search.ts を作成してください。

要件:
- 商品embeddingと顧客preferenceVectorのコサイン類似度を計算
- 類似度上位10,000人を取得するクエリ
- Prismaの生SQLクエリを使用

実装例:
SELECT
  customer_id,
  1 - (preference_vector <=> $1::vector) as similarity
FROM customers
ORDER BY preference_vector <=> $1::vector
LIMIT 10000;
```

---

### Phase 5: シミュレーションエンジン

**目的**: 評価予測のコアロジック

**Claude Codeへの指示**:
```
src/features/simulation/engine/predictor.ts を作成してください。

要件:
- 各顧客の類似度とprofileVectorから星評価を計算
- ロジック:
  similarity > 0.7 && 品質重視度 > 0.8 → 星5
  similarity > 0.5 && 価格敏感度 > 0.7 → 星3
  similarity < 0.3 → 星2
  その他 → 星4
- PredictedReviewレコードを生成

並行して aggregator.ts も作成:
- 平均評価、星の分布、セグメント別分析を集計
```

---

### Phase 6: APIエンドポイント

**目的**: シミュレーション実行API

**Claude Codeへの指示**:
```
src/app/api/simulate/route.ts を作成してください。

仕様:
- POST /api/simulate
- リクエストボディ: { description: string }
- 処理フロー:
  1. descriptionをベクトル化
  2. Productレコード作成
  3. Simulationレコード作成（Transactionで囲む）
  4. ベクトル検索で類似顧客取得
  5. 各顧客の評価を予測
  6. PredictedReviewを一括挿入
  7. 集計結果をSimulationに保存
- レスポンス: { simulationId: string }

トランザクション必須（#4 SQL, Transaction対応）
```

---

### Phase 7: 結果取得API

**Claude Codeへの指示**:
```
src/app/api/results/[simulationId]/route.ts を作成してください。

仕様:
- GET /api/results/:simulationId
- Simulationと全PredictedReviewをJOINで取得
- セグメント別の集計結果も含める
- レスポンス形式:
{
  simulation: { avgRating, conversionRate },
  distribution: { 星5: 42%, 星4: 28%, ... },
  segments: [
    { name: "Price Sensitive", avgRating: 3.2 },
    ...
  ]
}
```

---

### Phase 8: フロントエンド（入力画面）

**Claude Codeへの指示**:
```
src/app/input/page.tsx を作成してください。

要件:
- テキストエリア（商品説明入力）
- 送信ボタン
- POST /api/simulate を呼び出し
- 完了後、/result/:simulationId へリダイレクト

src/features/product/components/ProductInput.tsx も作成
```

---

### Phase 9: フロントエンド（結果画面）

**Claude Codeへの指示**:
```
src/app/result/[simulationId]/page.tsx を作成してください。

要件:
- 平均評価の大きな表示
- 星の分布グラフ（棒グラフ）
- セグメント別分析表
- Recharts を使用してグラフ描画

必要なパッケージ:
npm install recharts
```

---

### Phase 10: ドキュメント作成

**手動作業**:

1. **docs/NORMALIZATION.md**: 正規化の証明を記述
2. **docs/PERFORMANCE.md**: EXPLAIN ANALYZEのスクリーンショット
3. **docs/TRANSACTION.md**: トランザクション実装の説明
4. **docs/VECTOR_SEARCH.md**: ベクトル検索の仕組み図解

---

## 完了チェックリスト

- [ ] Phase 1: schema.prisma作成とマイグレーション
- [ ] Phase 2: 10,000人のシードデータ投入
- [ ] Phase 3: transformers.js による埋め込み
- [ ] Phase 4: ベクトル検索クエリ
- [ ] Phase 5: 評価予測ロジック
- [ ] Phase 6: シミュレーションAPI
- [ ] Phase 7: 結果取得API
- [ ] Phase 8: 入力画面
- [ ] Phase 9: 結果表示画面
- [ ] Phase 10: ドキュメント整備

---

## トラブルシューティング

### pgvectorが使えない
```sql
-- PostgreSQLで実行
CREATE EXTENSION IF NOT EXISTS vector;
```

### transformers.jsが遅い
- 初回実行時はモデルダウンロードで時間がかかる
- キャッシュが効けば2回目以降は高速

### メモリ不足
- 10,000人のシミュレーションは約500MBのメモリを使用
- バッチ処理（1000人ずつ）に変更する

---

## 次のステップ

全Phase完了後：

1. プレゼン資料の作成
2. EXPLAIN ANALYZEでパフォーマンス測定
3. 正規化の証明資料を整備
4. デモ動画の撮影
