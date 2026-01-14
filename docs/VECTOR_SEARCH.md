# ベクトル検索の仕組み

## 概要

Review Predictorでは、**pgvector**拡張を使用してベクトル類似度検索を実現しています。商品説明文と10,000人の顧客プロファイルの類似度を高速に計算します。

---

## 使用技術

| 技術 | 役割 |
|------|------|
| **pgvector** | PostgreSQLベクトル拡張 |
| **HNSW インデックス** | 高速近似最近傍探索 |
| **transformers.js** | テキストをベクトルに変換 |
| **all-MiniLM-L6-v2** | 埋め込みモデル（384次元） |

---

## ベクトルの構成

### 1. preferenceVector（384次元）

顧客の好みを**テキスト埋め込み**で表現したベクトル。

```typescript
// シード時に生成（prisma/seed.ts）
const preferenceVector = generateRandomVector(384);
// 実際は顧客の好みを表すテキストを埋め込んだベクトル
```

**用途:** 商品説明文との類似度計算に使用

### 2. profileVector（5次元）

顧客の特性を**数値**で表現したベクトル。

```typescript
// 5次元の意味
[
  価格敏感度,        // 0.0〜1.0
  品質重視度,        // 0.0〜1.0
  デザイン重視度,    // 0.0〜1.0
  ブランドロイヤリティ, // 0.0〜1.0
  レビュー厳しさ     // 0.0〜1.0
]
```

**用途:** 評価予測アルゴリズムでの調整に使用

### 3. embedding（384次元）

商品説明文をベクトル化したもの。

```typescript
// src/features/vector/embedding.ts
export async function textToEmbedding(text: string): Promise<number[]> {
  const pipe = await getEmbeddingPipeline();
  const output = await pipe(text, {
    pooling: 'mean',
    normalize: true,
  });
  return Array.from(output.data as Float32Array);
}
```

---

## 類似度計算

### コサイン類似度

pgvectorの`<=>`演算子でコサイン距離を計算し、1から引いて類似度に変換。

```sql
-- src/features/vector/search.ts より
SELECT
  c.id as "customerId",
  c.name as "customerName",
  c."segmentId",
  s.name as "segmentName",
  (1 - (c."preferenceVector" <=> $1::vector(384))) as similarity
FROM customers c
JOIN segments s ON c."segmentId" = s.id
ORDER BY c."preferenceVector" <=> $1::vector(384)
LIMIT 10000
```

### 距離演算子の種類

| 演算子 | 意味 | 用途 |
|--------|------|------|
| `<=>` | コサイン距離 | **本システムで採用** |
| `<->` | L2距離（ユークリッド） | 画像など |
| `<#>` | 内積の負値 | 正規化済みベクトル |

**コサイン距離を選んだ理由:**
- テキスト埋め込みはベクトルの「向き」が重要
- 大きさの違いを無視できる
- 意味的な類似性を測定するのに適している

---

## HNSWインデックス

### インデックスの作成

```sql
-- prisma/migrations/内で作成
CREATE INDEX customers_preference_vector_idx
ON customers
USING hnsw ("preferenceVector" vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

### HNSWの仕組み

**HNSW (Hierarchical Navigable Small World)**は、グラフベースの近似最近傍探索アルゴリズム。

```
Level 2:  ●─────────────●
          │             │
Level 1:  ●───●───●───●───●
          │   │   │   │   │
Level 0:  ●●●●●●●●●●●●●●●●●●●
          (全ノード)
```

**検索アルゴリズム:**
1. 最上位レベルから開始
2. 各レベルで最も近いノードへ移動
3. 下位レベルに移動して精度を上げる
4. 最下位レベルで最近傍を特定

### パラメータの意味

| パラメータ | 意味 | 本システムの値 |
|-----------|------|---------------|
| `m` | 各ノードの接続数 | 16 |
| `ef_construction` | 構築時の候補数 | 64 |
| `ef_search` | 検索時の候補数 | 40（デフォルト） |

**パラメータの影響:**
- `m`を増やす → 精度↑、メモリ使用量↑
- `ef_construction`を増やす → 構築時間↑、精度↑
- `ef_search`を増やす → 検索時間↑、精度↑

---

## 検索の計算量

| 方式 | 計算量 | 10,000件での目安 |
|------|--------|-----------------|
| 全件スキャン | O(n) | 約100ms |
| **HNSW** | **O(log n)** | **約10ms** |

**10倍の高速化**を実現。

---

## 実装コード

### 類似顧客の検索

```typescript
// src/features/vector/search.ts
export async function searchSimilarCustomers(
  embedding: number[],
  limit: number = 10000
): Promise<SimilarCustomer[]> {
  const vectorString = `[${embedding.join(',')}]`;

  const results = await prisma.$queryRaw<SimilarCustomer[]>`
    SELECT
      c.id as "customerId",
      c.name as "customerName",
      c."segmentId",
      s.name as "segmentName",
      (1 - (c."preferenceVector" <=> ${vectorString}::vector(384))) as similarity,
      c."profileVector"::text as "profileVectorStr"
    FROM customers c
    JOIN segments s ON c."segmentId" = s.id
    ORDER BY c."preferenceVector" <=> ${vectorString}::vector(384)
    LIMIT ${limit}
  `;

  return results.map(r => ({
    ...r,
    profileVector: parseVectorString((r as any).profileVectorStr),
  }));
}
```

### テキストのベクトル化

```typescript
// src/features/vector/embedding.ts
import { pipeline } from '@xenova/transformers';

let embeddingPipeline: any = null;

async function getEmbeddingPipeline(): Promise<any> {
  if (!embeddingPipeline) {
    console.log('🔄 Loading embedding model...');
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('✅ Embedding model loaded');
  }
  return embeddingPipeline;
}

export async function textToEmbedding(text: string): Promise<number[]> {
  const pipe = await getEmbeddingPipeline();
  const output = await pipe(text, {
    pooling: 'mean',
    normalize: true,
  });
  return Array.from(output.data as Float32Array);
}
```

---

## 類似度から評価への変換

類似度スコア（0〜1）は、評価予測アルゴリズムの入力として使用されます。

```typescript
// src/features/simulation/engine/predictor.ts
let score = normalizedSimilarity * 5;  // 基本スコア（0〜5）

// セグメント特性による調整
if (segment === 'Quality Focused' && similarity > 0.7) {
  score += 0.8;  // 品質重視層は高類似度で高評価
}
// ... 他の調整

return Math.round(clamp(score, 1, 5));  // 1〜5の整数
```

---

## 関連ドキュメント

- [パフォーマンスチューニング](PERFORMANCE.md)
- [トランザクション設計](TRANSACTION.md)
- [全体設計書](DESIGN.md)
