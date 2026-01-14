# トランザクション設計

## 概要

Review Predictorのシミュレーション実行では、複数のデータベース操作を**ACID特性**を保ちながら実行しています。本ドキュメントではトランザクション設計の詳細を説明します。

---

## シミュレーション実行のフロー

```
┌─────────────────────────────────────────────────────────────┐
│                    シミュレーション実行                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Transaction 1: 初期化                                │   │
│  │  - Product作成                                      │   │
│  │  - Simulation作成（status: RUNNING）                │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 非トランザクション処理                               │   │
│  │  - ベクトル類似度検索（読み取り専用）                │   │
│  │  - 評価予測アルゴリズム実行                         │   │
│  │  - レビューテキスト生成                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ バッチINSERT（1,000件 × 10回）                       │   │
│  │  - predicted_reviewsに10,000件挿入                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Transaction 2: 完了処理                              │   │
│  │  - Simulation更新（status: COMPLETED）              │   │
│  │  - avgRating, conversionRate保存                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ACID特性の保証

### Atomicity（原子性）

**保証内容:** 商品とシミュレーションの作成は「すべて成功」または「すべて失敗」

```typescript
// src/app/api/simulate/route.ts より
const result = await prisma.$transaction(async (tx) => {
  // デフォルトの販売者とカテゴリを取得
  const defaultSeller = await tx.seller.findFirst();
  const defaultCategory = await tx.category.findFirst();

  if (!defaultSeller || !defaultCategory) {
    throw new Error('Default seller or category not found.');
    // → ここでthrowすると全体がロールバック
  }

  // 商品を作成（生SQLでベクトル挿入）
  await tx.$executeRawUnsafe(`
    INSERT INTO products ...
  `);

  // シミュレーションを作成
  const simulation = await tx.simulation.create({
    data: {
      productId,
      status: 'RUNNING',
    },
  });

  return { productId, simulationId: simulation.id };
});
```

**ロールバックが発生するケース:**
- 販売者・カテゴリが存在しない
- 商品INSERTで制約違反
- シミュレーション作成で外部キー違反

---

### Consistency（一貫性）

**保証内容:** 外部キー制約により参照整合性を維持

```sql
-- 外部キー制約の例（prisma/schema.prismaより）
products.sellerId  → sellers.id
products.categoryId → categories.id
simulations.productId → products.id
predicted_reviews.simulationId → simulations.id (CASCADE DELETE)
predicted_reviews.customerId → customers.id
```

**CASCADE DELETE:**
```prisma
model PredictedReview {
  simulation Simulation @relation(onDelete: Cascade)
  // シミュレーション削除時に予測レビューも自動削除
}
```

---

### Isolation（分離性）

**保証内容:** 同時実行されるシミュレーションは互いに影響しない

**分離レベル:** PostgreSQLのデフォルト（Read Committed）

```
User A: シミュレーション実行中
User B: 同時にシミュレーション実行

→ 各シミュレーションは独立したproductId, simulationIdを持つ
→ 予測レビューは simulationId で紐づくため混在しない
```

**ユニーク制約による保護:**
```prisma
@@unique([simulationId, customerId])
// 同一シミュレーションで同一顧客のレビューは1件のみ
```

---

### Durability（永続性）

**保証内容:** コミット後のデータは永続化される

PostgreSQLのWAL（Write-Ahead Logging）により、コミットされたトランザクションはディスクに永続化される。

---

## バッチINSERTの最適化

10,000件の予測レビューを効率的に挿入するため、**1,000件ずつのバッチ処理**を採用。

```typescript
// バッチで挿入（1000件ずつ）
const BATCH_SIZE = 1000;
for (let i = 0; i < predictions.length; i += BATCH_SIZE) {
  const batch = predictions.slice(i, i + BATCH_SIZE);
  const values = batch.map((p, idx) => {
    const customer = similarCustomers[i + idx];
    const reviewText = reviewTexts[i + idx].replace(/'/g, "''");
    return `('pr_${Date.now()}_${i + idx}', '${simulationId}', '${customer.customerId}', ${p.rating}, ${p.similarity.toFixed(4)}, '${reviewText}', NOW())`;
  }).join(',');

  await prisma.$executeRawUnsafe(`
    INSERT INTO predicted_reviews (id, "simulationId", "customerId", rating, similarity, "reviewText", "createdAt")
    VALUES ${values}
  `);
}
```

**バッチサイズの選定理由:**
| バッチサイズ | INSERT回数 | メリット | デメリット |
|-------------|-----------|---------|-----------|
| 100件 | 100回 | メモリ使用少 | INSERT回数多 |
| **1,000件** | **10回** | **バランス良** | - |
| 10,000件 | 1回 | INSERT1回 | SQLが巨大 |

---

## エラーハンドリング

### シミュレーション失敗時の処理

```typescript
try {
  // シミュレーション処理...
} catch (error) {
  console.error('❌ Simulation error:', error);

  return NextResponse.json(
    {
      error: 'Simulation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    },
    { status: 500 }
  );
}
```

**エラー発生時の状態:**
- Transaction 1成功後にエラー → `status: RUNNING`のまま
- 運用上は定期的に`RUNNING`状態の古いレコードをクリーンアップ

---

## トランザクション設計の判断

### なぜ全体を1つのトランザクションにしないのか？

```
❌ 全体を1トランザクション
┌────────────────────────────────────────────┐
│ BEGIN                                      │
│   → Product作成                            │
│   → Simulation作成                         │
│   → ベクトル検索（時間がかかる）             │
│   → 10,000件INSERT                         │
│   → Simulation更新                         │
│ COMMIT                                     │
└────────────────────────────────────────────┘
問題: 長時間ロックが発生し、他のリクエストがブロックされる
```

```
✅ 採用した設計
┌────────────────────────────────────────────┐
│ Transaction 1: 初期化（短い）               │
│   → Product作成                            │
│   → Simulation作成                         │
└────────────────────────────────────────────┘
            ↓ コミット
┌────────────────────────────────────────────┐
│ 非トランザクション処理                      │
│   → ベクトル検索（読み取り専用）            │
│   → 予測計算                               │
└────────────────────────────────────────────┘
            ↓
┌────────────────────────────────────────────┐
│ バッチINSERT × 10回                        │
└────────────────────────────────────────────┘
            ↓
┌────────────────────────────────────────────┐
│ Transaction 2: 完了処理（短い）              │
└────────────────────────────────────────────┘
メリット: 各トランザクションが短く、同時実行性が高い
```

---

## 関連ドキュメント

- [パフォーマンスチューニング](PERFORMANCE.md)
- [正規化の証明](NORMALIZATION.md)
