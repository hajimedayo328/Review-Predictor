# Review Predictor - データフロー図

## データの流れと処理の詳細

このドキュメントでは、Review Predictorにおけるデータの流れを図解とテキストで説明します。

---

## シミュレーション実行時のデータフロー

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: 入力・前処理                                       │
└─────────────────────────────────────────────────────────────┘

[ユーザー]
  商品説明入力: "高級レザーを使用した職人手作りの本革財布..."
       ↓
[フロントエンド: /input]
  バリデーション: 10文字以上チェック
       ↓
[API: POST /api/simulate]
  リクエスト受信
       ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: ベクトル化                                         │
└─────────────────────────────────────────────────────────────┘

[transformers.js: textToEmbedding()]
  テキスト: "高級レザーを使用した..."
       ↓
  モデル: Xenova/all-MiniLM-L6-v2
       ↓
  出力: [0.123, -0.456, 0.789, ..., 0.234] (384次元)
       ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 3: データベース書き込み（トランザクション）          │
└─────────────────────────────────────────────────────────────┘

[BEGIN TRANSACTION]

  [Product テーブル]
    INSERT INTO products (
      id, sellerId, categoryId, name, description,
      embedding, price, createdAt, updatedAt
    )
    VALUES (
      'prod_xxx', 'seller_1', 'cat_1', 'シミュレーション商品',
      '高級レザーを使用した...',
      '[0.123, -0.456, ...]'::vector(384),
      1000, NOW(), NOW()
    )
       ↓
  [Simulation テーブル]
    INSERT INTO simulations (
      id, productId, status, createdAt, updatedAt
    )
    VALUES (
      'sim_xxx', 'prod_xxx', 'RUNNING', NOW(), NOW()
    )

[COMMIT TRANSACTION]
       ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 4: ベクトル検索（pgvector）                          │
└─────────────────────────────────────────────────────────────┘

[pgvector: 類似度検索]
  SELECT
    c.id as customer_id,
    c.name,
    c.segmentId,
    s.name as segment_name,
    c.profileVector,
    (1 - (c.preferenceVector <=> $embedding::vector(384))) as similarity
  FROM customers c
  JOIN segments s ON c.segmentId = s.id
  ORDER BY c.preferenceVector <=> $embedding::vector(384)
  LIMIT 10000
       ↓
  結果: 10,000人の顧客リスト（類似度順）
  [
    { customerId: 'cust_1', similarity: 0.85, segmentName: '品質重視', ... },
    { customerId: 'cust_2', similarity: 0.82, segmentName: 'ブランド重視', ... },
    ...
  ]
       ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 5: 評価予測                                           │
└─────────────────────────────────────────────────────────────┘

[predictor.ts: predictRatings()]
  for each customer in 10,000人:
    1. 類似度をバッチ内で正規化 (0-1にスケーリング)
    2. profileVectorから特性を抽出:
       - 価格敏感度
       - 品質重視度
       - デザイン重視度
       - ブランドロイヤリティ
       - レビュー厳しさ
    3. 評価ロジック適用:
       - similarity > 0.7 && 品質重視度 > 0.7 → ★5
       - similarity > 0.6 && ブランド重視度 > 0.7 → ★4-5
       - similarity > 0.4 && 価格敏感度 > 0.7 → ★3
       - similarity < 0.3 → ★2
       - その他 → ★4
    4. レビュー厳しさで調整
       ↓
  結果: 10,000件の評価予測
  [
    { customerId: 'cust_1', rating: 5, similarity: 0.85 },
    { customerId: 'cust_2', rating: 4, similarity: 0.82 },
    ...
  ]
       ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 6: レビューテキスト生成                               │
└─────────────────────────────────────────────────────────────┘

[reviewGenerator.ts: generateReviewText()]
  for each prediction in 10,000件:
    1. 評価に応じたテンプレート選択:
       - ★5: "期待以上の品質でした！"
       - ★4: "良い商品だと思います。"
       - ★3: "普通だと思います。"
       - ★2: "期待外れでした。"
       - ★1: "期待していたものと大きく違いました。"
    2. セグメント別コメント追加:
       - ブランド重視: "信頼できるブランドなので安心です。"
       - デザイン重視: "デザインが素晴らしいです！"
       - 価格重視: "この価格でこの品質は最高です！"
       - 品質重視: "品質が非常に高いです！"
    3. 類似度に基づくコメント追加
    4. プロファイルベクトルに基づくコメント追加
       ↓
  結果: 10,000件のレビューテキスト
  [
    { customerId: 'cust_1', rating: 5, reviewText: '期待以上の品質でした！信頼できるブランドなので安心です。...' },
    { customerId: 'cust_2', rating: 4, reviewText: '良い商品だと思います。デザインは良いと思います。...' },
    ...
  ]
       ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 7: 結果集計                                           │
└─────────────────────────────────────────────────────────────┘

[aggregator.ts: aggregateResults()]
  1. 全体の平均評価計算:
     avgRating = sum(ratings) / 10000
       ↓
  2. コンバージョン率計算:
     conversionRate = (rating >= 4 の人数) / 10000 * 100
       ↓
  3. 評価分布計算:
     star1 = (rating == 1 の人数) / 10000 * 100
     star2 = (rating == 2 の人数) / 10000 * 100
     ...
       ↓
  4. セグメント別集計:
     for each segment:
       - セグメント内の平均評価
       - セグメント内の評価分布
       ↓
  結果: 集計サマリー
  {
    totalCustomers: 10000,
    avgRating: 2.5,
    conversionRate: 9.2,
    distribution: { star1: 28, star2: 45, star3: 20, star4: 5, star5: 2 },
    segments: [
      { name: 'ブランド重視', avgRating: 2.4, customerCount: 2500, ... },
      ...
    ]
  }
       ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 8: データベース書き込み（バッチ処理）                │
└─────────────────────────────────────────────────────────────┘

[BEGIN TRANSACTION]

  [PredictedReview テーブル]
    for batch in [1000件ずつ × 10バッチ]:
      INSERT INTO predicted_reviews (
        id, simulationId, customerId, rating, similarity, reviewText, createdAt
      )
      VALUES
        ('pr_1', 'sim_xxx', 'cust_1', 5, 0.85, '期待以上の品質でした！...', NOW()),
        ('pr_2', 'sim_xxx', 'cust_2', 4, 0.82, '良い商品だと思います。...', NOW()),
        ...
      (1000件)

[COMMIT TRANSACTION]
       ↓
  [Simulation テーブル更新]
    UPDATE simulations
    SET status = 'COMPLETED',
        avgRating = 2.5,
        conversionRate = 9.2,
        updatedAt = NOW()
    WHERE id = 'sim_xxx'
       ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 9: レスポンス・リダイレクト                            │
└─────────────────────────────────────────────────────────────┘

[API レスポンス]
  {
    success: true,
    simulationId: 'sim_xxx',
    summary: {
      totalCustomers: 10000,
      avgRating: 2.5,
      conversionRate: 9.2
    }
  }
       ↓
[フロントエンド: リダイレクト]
  router.push('/result/sim_xxx')
       ↓
[結果画面表示]
  GET /api/results/sim_xxx
       ↓
  [JOINクエリでデータ取得]
    SELECT
      s.*, p.*,
      COUNT(pr.id) as total_reviews,
      AVG(pr.rating) as avg_rating,
      ...
    FROM simulations s
    JOIN products p ON s.productId = p.id
    LEFT JOIN predicted_reviews pr ON s.id = pr.simulationId
    WHERE s.id = 'sim_xxx'
    GROUP BY s.id, p.id
       ↓
  [セグメント別集計]
    SELECT
      seg.name,
      AVG(pr.rating) as avg_rating,
      COUNT(pr.id) as customer_count,
      ...
    FROM predicted_reviews pr
    JOIN customers c ON pr.customerId = c.id
    JOIN segments seg ON c.segmentId = seg.id
    WHERE pr.simulationId = 'sim_xxx'
    GROUP BY seg.name
       ↓
  [結果画面に表示]
    - 平均評価: 2.5 ★
    - 高評価率: 9.2%
    - 評価分布グラフ
    - セグメント別分析
    - 類似度分布
    - サンプルレビュー
```

---

## データの流れ（図解）

```
┌──────────┐
│  入力    │
│ テキスト │
└────┬─────┘
     │
     ↓
┌──────────────┐
│ ベクトル化   │
│ (384次元)    │
└────┬─────────┘
     │
     ↓
┌──────────────┐      ┌──────────────┐
│ Product      │      │ Simulation   │
│ (保存)       │─────→│ (作成)       │
└──────────────┘      └──────┬───────┘
                              │
                              ↓
                    ┌─────────────────┐
                    │ ベクトル検索     │
                    │ (pgvector)      │
                    └────┬────────────┘
                         │
                         ↓
              ┌──────────────────────┐
              │ 10,000人の顧客取得   │
              │ (類似度順)           │
              └────┬─────────────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │ 評価予測             │
        │ (1-5星)             │
        └────┬─────────────────┘
             │
             ↓
  ┌──────────────────────┐
  │ レビューテキスト生成  │
  │ (テンプレートベース)  │
  └────┬─────────────────┘
       │
       ↓
┌──────────────────────┐
│ 結果集計             │
│ (平均、分布、セグメント)│
└────┬─────────────────┘
     │
     ↓
┌──────────────────────┐      ┌──────────────────────┐
│ PredictedReview      │      │ Simulation更新      │
│ (10,000件保存)       │      │ (結果反映)          │
└──────────────────────┘      └──────────────────────┘
```

---

## クエリパターン

### 1. ベクトル検索クエリ
```sql
-- 商品embeddingと顧客preferenceVectorの類似度計算
SELECT
  c.id,
  c.name,
  s.name as segment_name,
  c.profileVector,
  1 - (c.preferenceVector <=> $1::vector(384)) as similarity
FROM customers c
JOIN segments s ON c.segmentId = s.id
ORDER BY c.preferenceVector <=> $1::vector(384)
LIMIT 10000;
```

### 2. 結果取得クエリ（JOIN）
```sql
-- シミュレーション結果の取得
SELECT
  s.id,
  s.avgRating,
  s.conversionRate,
  p.name as product_name,
  p.description,
  COUNT(pr.id) as total_reviews
FROM simulations s
JOIN products p ON s.productId = p.id
LEFT JOIN predicted_reviews pr ON s.id = pr.simulationId
WHERE s.id = $1
GROUP BY s.id, p.id;
```

### 3. セグメント別集計クエリ（GROUP BY）
```sql
-- セグメント別の平均評価と分布
SELECT
  seg.name as segment_name,
  AVG(pr.rating) as avg_rating,
  COUNT(pr.id) as customer_count,
  SUM(CASE WHEN pr.rating = 1 THEN 1 ELSE 0 END)::float / COUNT(pr.id) * 100 as star1_pct,
  SUM(CASE WHEN pr.rating = 2 THEN 1 ELSE 0 END)::float / COUNT(pr.id) * 100 as star2_pct,
  ...
FROM predicted_reviews pr
JOIN customers c ON pr.customerId = c.id
JOIN segments seg ON c.segmentId = seg.id
WHERE pr.simulationId = $1
GROUP BY seg.name;
```

---

## トランザクションの使用箇所

### 1. 商品・シミュレーション作成時
```typescript
await prisma.$transaction(async (tx) => {
  // Product作成
  await tx.product.create({ ... });
  
  // Simulation作成
  await tx.simulation.create({ ... });
});
```

### 2. レビュー一括挿入時
```typescript
await prisma.$transaction(async (tx) => {
  // 10,000件を1,000件ずつバッチ処理
  for (let i = 0; i < reviews.length; i += 1000) {
    await tx.predictedReview.createMany({ ... });
  }
});
```

**ACID保証**:
- **Atomicity**: すべて成功するか、すべてロールバック
- **Consistency**: 外部キー制約で整合性保証
- **Isolation**: 他のトランザクションから分離
- **Durability**: コミット後は永続化

---

*このデータフローは、データベース授業の要件（トランザクション、JOIN、GROUP BY、ベクトル検索）を満たす設計となっています。*


