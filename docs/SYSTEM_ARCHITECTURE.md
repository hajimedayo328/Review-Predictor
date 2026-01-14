# システムアーキテクチャ

## 概要

Review Predictorは、Next.js 14をベースとした**フルスタックWebアプリケーション**です。フロントエンドとバックエンドを同一プロジェクトで管理し、PostgreSQL + pgvectorでデータを永続化します。

---

## アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────────────┐
│                         クライアント（ブラウザ）                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Next.js 14 (App Router)                      │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐    ┌─────────────────────────────────────┐│
│  │   フロントエンド     │    │          バックエンド（API）         ││
│  │                     │    │                                     ││
│  │  /input (入力画面)   │    │  POST /api/simulate                 ││
│  │  /result/[id]       │    │  GET /api/results/[id]              ││
│  │   (結果画面)        │    │  GET /api/simulations/recent        ││
│  │                     │    │                                     ││
│  │  React + Tailwind   │    │  シミュレーションエンジン            ││
│  │  Recharts (グラフ)   │    │  ├─ embedder.ts                    ││
│  │                     │    │  ├─ predictor.ts                   ││
│  │                     │    │  ├─ reviewGenerator.ts             ││
│  │                     │    │  └─ aggregator.ts                  ││
│  └─────────────────────┘    └─────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                              Prisma ORM                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PostgreSQL 15 + pgvector                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────────────┐│
│  │  sellers  │ │ categories│ │ segments  │ │      customers        ││
│  └───────────┘ └───────────┘ └───────────┘ │  (10,000 records)     ││
│  ┌───────────┐ ┌───────────┐               │  + preferenceVector   ││
│  │ products  │ │simulations│               │  + profileVector      ││
│  │+embedding │ └───────────┘               │  + HNSW Index         ││
│  └───────────┘ ┌───────────────────────────┴───────────────────────┘│
│                │           predicted_reviews                        │
│                │  (simulation × 10,000 records per simulation)      │
│                └────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## レイヤー構成

### 1. プレゼンテーション層（フロントエンド）

| ファイル | 役割 |
|---------|------|
| `src/app/input/page.tsx` | 商品説明入力画面 |
| `src/app/result/[simulationId]/page.tsx` | シミュレーション結果表示 |
| `src/app/layout.tsx` | 共通レイアウト |

**使用技術:**
- React 18 (Server Components + Client Components)
- Tailwind CSS
- Recharts（グラフ描画）

### 2. アプリケーション層（API Routes）

| エンドポイント | メソッド | 役割 |
|---------------|---------|------|
| `/api/simulate` | POST | シミュレーション実行 |
| `/api/results/[id]` | GET | 結果取得 |
| `/api/simulations/recent` | GET | 直近のシミュレーション一覧 |
| `/api/health` | GET | ヘルスチェック |

### 3. ドメイン層（ビジネスロジック）

```
src/features/
├── simulation/
│   └── engine/
│       ├── embedder.ts       # テキスト→ベクトル変換
│       ├── predictor.ts      # 評価予測アルゴリズム
│       ├── reviewGenerator.ts # レビューテキスト生成
│       ├── aggregator.ts     # 結果集計
│       └── scorer.ts         # スコア計算
├── vector/
│   ├── embedding.ts          # transformers.js ラッパー
│   ├── search.ts             # pgvector検索
│   └── similarity.ts         # 類似度計算
├── customer/
│   └── types/                # 型定義
└── product/
    └── types/                # 型定義
```

### 4. インフラ層（データアクセス）

| ファイル | 役割 |
|---------|------|
| `src/lib/prisma.ts` | Prismaクライアント |
| `prisma/schema.prisma` | スキーマ定義 |
| `prisma/seed.ts` | 初期データ生成 |

---

## データフロー

### シミュレーション実行時

```
1. ユーザー入力
   └─→ POST /api/simulate { description: "..." }

2. テキスト処理
   └─→ transformers.js でベクトル化（384次元）

3. データベース操作（Transaction 1）
   ├─→ Product 作成（embedding含む）
   └─→ Simulation 作成（status: RUNNING）

4. ベクトル検索
   └─→ pgvector で 10,000人の顧客と類似度計算

5. 予測処理
   ├─→ 各顧客の評価（1-5）を予測
   └─→ レビューテキストを生成

6. データベース操作（バッチINSERT）
   └─→ 10,000件の PredictedReview を挿入

7. 完了処理（Transaction 2）
   └─→ Simulation 更新（status: COMPLETED, avgRating, conversionRate）

8. レスポンス
   └─→ { simulationId: "..." }
```

### 結果取得時

```
1. クライアントリクエスト
   └─→ GET /api/results/[simulationId]

2. データベースクエリ
   ├─→ Simulation + Product 取得
   ├─→ 評価分布集計（GROUP BY rating）
   ├─→ セグメント別集計（GROUP BY segment）
   └─→ サンプルレビュー取得（各評価から数件）

3. レスポンス
   └─→ { simulation, distribution, segments, sampleReviews }
```

---

## 技術スタック詳細

### フロントエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js | 14.x | フレームワーク |
| React | 18.x | UIライブラリ |
| TypeScript | 5.x | 型安全性 |
| Tailwind CSS | 3.x | スタイリング |
| Recharts | 2.x | グラフ描画 |

### バックエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Node.js | 20.x | ランタイム |
| Prisma | 6.x | ORM |
| transformers.js | - | テキスト埋め込み |

### データベース

| 技術 | バージョン | 用途 |
|------|-----------|------|
| PostgreSQL | 15.x | RDBMS |
| pgvector | 0.5.x | ベクトル拡張 |

---

## ディレクトリ構造

```
finalapp/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── input/             # 入力ページ
│   │   └── result/            # 結果ページ
│   ├── features/              # 機能別モジュール
│   │   ├── simulation/        # シミュレーション
│   │   ├── vector/            # ベクトル処理
│   │   ├── customer/          # 顧客関連
│   │   └── product/           # 商品関連
│   └── lib/                   # 共通ライブラリ
├── prisma/
│   ├── schema.prisma          # スキーマ定義
│   ├── migrations/            # マイグレーション
│   └── seed.ts                # シードデータ
├── docs/                      # ドキュメント
└── public/                    # 静的ファイル
```

---

## セキュリティ考慮

### 実装済み

1. **SQLインジェクション対策**
   - Prismaのパラメータ化クエリを使用
   - 生SQLでも文字列エスケープ処理

2. **入力バリデーション**
   - 説明文の最小文字数チェック
   - 型チェック（TypeScript）

### 本番環境で追加すべき

1. **認証・認可**
   - NextAuth.js などの導入

2. **レート制限**
   - シミュレーション実行の頻度制限

3. **HTTPS強制**
   - 本番環境でのSSL/TLS

---

## 関連ドキュメント

- [全体設計書](DESIGN.md)
- [ER図](ER_DIAGRAM.md)
- [パフォーマンスチューニング](PERFORMANCE.md)
