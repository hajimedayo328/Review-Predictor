# Review Predictor - 全体設計書

> **作成日**: 2026年1月13日
> **目的**: データベース授業の課題（全要件対応 + S評価狙い）

---

## 1. プロジェクト概要

### 1.1 アプリケーション名
**Review Predictor**

### 1.2 コンセプト
新商品の説明文を入力すると、10,000人の仮想顧客プロファイルがどう評価するかをベクトル演算でシミュレーションするツール。

### 1.3 主要機能
- 商品説明テキストの入力
- テキストをベクトル化（transformers.js）
- 10,000人の顧客プロファイルとの類似度計算
- 評価予測の表示（星の分布、セグメント別分析）

### 1.4 特徴
- **AI API不要**: transformers.js（ローカル）でテキストをベクトル化
- **決定論的**: 同じ入力に対して常に同じ結果（再現性保証）
- **高速処理**: pgvectorのHNSWインデックスで10,000人を瞬時に分析

---

## 2. 技術スタック

### 2.1 フロントエンド
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x
- **UI Components**: Shadcn UI
- **Charts**: Recharts

### 2.2 バックエンド
- **Runtime**: Node.js 20.x
- **API**: Next.js API Routes
- **ORM**: Prisma 5.x
- **Database**: PostgreSQL 15.x + pgvector

### 2.3 ベクトル処理
- **Embedding**: @xenova/transformers
- **Model**: Xenova/all-MiniLM-L6-v2（384次元）

### 2.4 環境変数
```env
DATABASE_URL="postgresql://user:password@localhost:5432/review_predictor"
```

---

## 3. データベース設計

### 3.1 ER図
```
┌─────────────────┐
│     Seller      │
│─────────────────│
│ id (PK)         │──┐
│ name            │  │
│ email           │  │
│ createdAt       │  │
└─────────────────┘  │
                     │
┌─────────────────┐  │
│    Category     │  │
│─────────────────│  │
│ id (PK)         │──┐
│ name            │  ││
│ description     │  ││
└─────────────────┘  ││
                     ││
┌─────────────────┐  ││
│    Product      │  ││
│─────────────────│  ││
│ id (PK)         │  ││
│ sellerId (FK)   │←─┘│
│ categoryId (FK) │←──┘
│ name            │
│ description     │
│ embedding       │ (vector(384))
│ price           │
│ createdAt       │
└─────────────────┘
         │
         │ 1:N
         ↓
┌─────────────────┐
│   Simulation    │
│─────────────────│
│ id (PK)         │──┐
│ productId (FK)  │  │
│ status          │  │
│ avgRating       │  │
│ conversionRate  │  │
│ createdAt       │  │
└─────────────────┘  │
         │           │
         │ 1:N       │
         ↓           │
┌─────────────────┐  │
│ PredictedReview │  │
│─────────────────│  │
│ id (PK)         │  │
│ simulationId(FK)│←─┘
│ customerId (FK) │←──┐
│ rating          │   │
│ similarity      │   │
│ createdAt       │   │
└─────────────────┘   │
                      │
┌─────────────────┐   │
│    Segment      │   │
│─────────────────│   │
│ id (PK)         │──┐│
│ name            │  ││
│ description     │  ││
└─────────────────┘  ││
                     ││
┌─────────────────┐  ││
│    Customer     │  ││
│─────────────────│  ││
│ id (PK)         │←─┴┘
│ segmentId (FK)  │
│ name            │
│ profileVector   │ (vector(5))
│ preferenceVector│ (vector(384))
│ createdAt       │
└─────────────────┘
```

### 3.2 Prisma Schema
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]
}

model Seller {
  id        String    @id @default(cuid())
  name      String
  email     String    @unique
  products  Product[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  description String?
  products    Product[]
}

model Product {
  id          String       @id @default(cuid())
  sellerId    String
  seller      Seller       @relation(fields: [sellerId], references: [id])
  categoryId  String
  category    Category     @relation(fields: [categoryId], references: [id])
  name        String
  description String       @db.Text
  embedding   Unsupported("vector(384)")
  price       Decimal      @db.Decimal(10, 2)
  simulations Simulation[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([sellerId])
  @@index([categoryId])
}

model Segment {
  id          String     @id @default(cuid())
  name        String     @unique
  description String?
  customers   Customer[]
}

model Customer {
  id               String            @id @default(cuid())
  segmentId        String
  segment          Segment           @relation(fields: [segmentId], references: [id])
  name             String
  profileVector    Unsupported("vector(5)")
  preferenceVector Unsupported("vector(384)")
  predictedReviews PredictedReview[]
  createdAt        DateTime          @default(now())

  @@index([segmentId])
}

model Simulation {
  id              String            @id @default(cuid())
  productId       String
  product         Product           @relation(fields: [productId], references: [id])
  status          SimulationStatus  @default(PENDING)
  avgRating       Decimal?          @db.Decimal(3, 2)
  conversionRate  Decimal?          @db.Decimal(5, 2)
  predictedReviews PredictedReview[]
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([productId])
}

enum SimulationStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}

model PredictedReview {
  id           String     @id @default(cuid())
  simulationId String
  simulation   Simulation @relation(fields: [simulationId], references: [id], onDelete: Cascade)
  customerId   String
  customer     Customer   @relation(fields: [customerId], references: [id])
  rating       Int
  similarity   Decimal    @db.Decimal(5, 4)
  createdAt    DateTime   @default(now())

  @@unique([simulationId, customerId])
  @@index([simulationId])
}
```

### 3.3 顧客プロファイルの設計

各顧客は2種類のベクトルを持つ：

**profileVector (5次元)**: 顧客の特性
```
[価格敏感度, 品質重視度, デザイン重視度, ブランドロイヤリティ, レビュー厳しさ]
```

**preferenceVector (384次元)**: 好みのテキストを埋め込んだベクトル

### 3.4 セグメント構成

| セグメント名 | 説明 | 人数 |
|-------------|------|-----|
| Price Sensitive | 価格に敏感な顧客 | 2,500人 |
| Quality Focused | 品質重視の顧客 | 2,500人 |
| Design Lovers | デザイン重視の顧客 | 2,500人 |
| Brand Loyal | ブランド重視の顧客 | 2,500人 |

**合計: 10,000人**

---

## 4. シミュレーションロジック

### 4.1 評価予測アルゴリズム

```typescript
function predictRating(similarity: number, profile: number[]): number {
  const [priceS, qualityS, designS, brandS, strictness] = profile;

  // 類似度と品質重視度が高い → 星5
  if (similarity > 0.7 && qualityS > 0.8) return 5;

  // 類似度と価格敏感度が高い → 星3
  if (similarity > 0.5 && priceS > 0.7) return 3;

  // 類似度が低い → 星2
  if (similarity < 0.3) return 2;

  // 厳しさで調整
  const baseRating = similarity > 0.5 ? 4 : 3;
  return strictness > 0.7 ? baseRating - 1 : baseRating;
}
```

### 4.2 処理フロー

```
[入力] 商品説明テキスト
    ↓
[Step 1] テキストをベクトル化（transformers.js）
    ↓
[Step 2] Productレコード作成
    ↓
[Step 3] Simulationレコード作成（トランザクション開始）
    ↓
[Step 4] pgvectorで10,000人の類似度を計算
    ↓
[Step 5] 各顧客の評価を予測
    ↓
[Step 6] PredictedReviewを一括挿入
    ↓
[Step 7] 集計結果をSimulationに保存（トランザクション完了）
    ↓
[出力] シミュレーション結果
```

---

## 5. ディレクトリ構造

```
review-predictor/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── input/
│   │   │   └── page.tsx
│   │   ├── result/
│   │   │   └── [simulationId]/
│   │   │       └── page.tsx
│   │   └── api/
│   │       ├── simulate/
│   │       │   └── route.ts
│   │       ├── results/
│   │       │   └── [simulationId]/
│   │       │       └── route.ts
│   │       └── health/
│   │           └── route.ts
│   │
│   ├── features/
│   │   ├── simulation/
│   │   │   ├── engine/
│   │   │   │   ├── predictor.ts
│   │   │   │   ├── aggregator.ts
│   │   │   │   └── scorer.ts
│   │   │   ├── components/
│   │   │   │   ├── ResultChart.tsx
│   │   │   │   ├── RatingDistribution.tsx
│   │   │   │   └── SegmentAnalysis.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useSimulation.ts
│   │   │   │   └── useResults.ts
│   │   │   └── types/
│   │   │       └── simulation.types.ts
│   │   │
│   │   ├── customer/
│   │   │   ├── generator/
│   │   │   │   ├── profileGenerator.ts
│   │   │   │   └── distributionUtils.ts
│   │   │   ├── components/
│   │   │   │   └── CustomerSegmentCard.tsx
│   │   │   └── types/
│   │   │       └── customer.types.ts
│   │   │
│   │   ├── product/
│   │   │   ├── components/
│   │   │   │   ├── ProductInput.tsx
│   │   │   │   └── ProductCard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useProductSubmit.ts
│   │   │   └── types/
│   │   │       └── product.types.ts
│   │   │
│   │   └── vector/
│   │       ├── embedding.ts
│   │       ├── search.ts
│   │       └── similarity.ts
│   │
│   ├── components/
│   │   └── ui/
│   │
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   │
│   └── types/
│       └── global.d.ts
│
├── docs/
│   ├── DESIGN.md
│   ├── IMPLEMENTATION_GUIDE.md
│   ├── DATABASE_SCHEMA.md
│   ├── NORMALIZATION.md
│   ├── VECTOR_SEARCH.md
│   ├── TRANSACTION.md
│   └── PERFORMANCE.md
│
├── .env.example
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── postcss.config.js
```

---

## 6. シラバス対応マッピング

### #2 Disk and File
- pgvectorのHNSWインデックスの物理構造
- インデックス設計と効率的なクエリ実行

### #3 RDB Table
- 7つの正規化されたテーブル
- Seller, Category, Product, Segment, Customer, Simulation, PredictedReview

### #4 SQL, Transaction
- シミュレーション実行時のACID保証
- Prismaの`$transaction`を使用

### #5 Foreign Key, JOIN, SubQuery
- 複雑な集計クエリ
- セグメント別の評価分析

### #8 正規化, DB Tuning
- 第3正規形の証明
- EXPLAIN ANALYZEによるパフォーマンス測定

### #10 分散DB
- Read Replica構成の提案
- 水平スケーリングの設計

### #11 Vector DB (RAG, OTA)
- pgvectorによるベクトル類似度検索
- HNSWインデックスの活用

---

## 7. 今後の拡張案

1. **過去のシミュレーション履歴表示**
2. **セグメント別フィルタリング機能**
3. **エクスポート機能（CSV/PDF）**
4. **A/Bテスト機能**
5. **リアルレビューデータとの比較分析**

---

*このドキュメントはプロジェクトの設計の唯一の真実の情報源（Single Source of Truth）です。*
