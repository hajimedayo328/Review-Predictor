# Review Predictor - プロジェクト構築指示書

> **このファイルの使い方**:
> 1. このファイル全体をClaude Codeに貼り付ける
> 2. 「この指示に従ってプロジェクト構造を構築してください」と伝える
> 3. 完成したら、各Phaseを順番に実装していく

---

## プロジェクト概要

**アプリ名**: Review Predictor  
**目的**: データベース授業の課題（全要件対応 + S評価狙い）  
**技術**: Next.js + PostgreSQL + pgvector  
**特徴**: AI API不要、ベクトル演算のみで10,000人のレビューをシミュレーション

---

## 1. ディレクトリ構造の構築

以下の構造を作成してください：

```
review-predictor/
├── README.md                          # プロジェクト概要（簡潔版）
│
├── docs/                              # ドキュメント専用フォルダ
│   ├── DESIGN.md                      # 全体設計書（詳細版）
│   ├── IMPLEMENTATION_GUIDE.md        # Claude Code実行ガイド
│   ├── DATABASE_SCHEMA.md             # データベース設計の詳細
│   ├── NORMALIZATION.md               # 正規化の証明（#8対応）
│   ├── VECTOR_SEARCH.md               # ベクトル検索の仕組み（#11対応）
│   ├── TRANSACTION.md                 # トランザクション設計（#4対応）
│   └── PERFORMANCE.md                 # DB Tuning結果（#8対応）
│
├── prisma/
│   ├── schema.prisma                  # データベーススキーマ
│   ├── seed.ts                        # 10,000人の顧客データ生成
│   └── migrations/                    # マイグレーションファイル
│
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx                   # トップページ
│   │   │
│   │   ├── input/                     # 商品説明入力画面
│   │   │   └── page.tsx
│   │   │
│   │   ├── result/                    # シミュレーション結果表示
│   │   │   └── [simulationId]/
│   │   │       └── page.tsx
│   │   │
│   │   └── api/                       # APIエンドポイント
│   │       ├── simulate/
│   │       │   └── route.ts           # POST: シミュレーション実行
│   │       ├── results/
│   │       │   └── [simulationId]/
│   │       │       └── route.ts       # GET: 結果取得
│   │       └── health/
│   │           └── route.ts           # ヘルスチェック
│   │
│   ├── features/                      # Feature-based構成
│   │   │
│   │   ├── simulation/
│   │   │   ├── engine/
│   │   │   │   ├── predictor.ts       # ベクトル検索 + 評価予測
│   │   │   │   ├── aggregator.ts      # 結果集計
│   │   │   │   └── scorer.ts          # スコアリングロジック
│   │   │   ├── components/
│   │   │   │   ├── ResultChart.tsx    # グラフ表示
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
│   │   │   │   ├── profileGenerator.ts    # 顧客プロファイル生成
│   │   │   │   └── distributionUtils.ts   # 正規分布ロジック
│   │   │   ├── components/
│   │   │   │   └── CustomerSegmentCard.tsx
│   │   │   └── types/
│   │   │       └── customer.types.ts
│   │   │
│   │   ├── product/
│   │   │   ├── components/
│   │   │   │   ├── ProductInput.tsx       # 商品説明入力フォーム
│   │   │   │   └── ProductCard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useProductSubmit.ts
│   │   │   └── types/
│   │   │       └── product.types.ts
│   │   │
│   │   └── vector/
│   │       ├── embedding.ts               # テキスト→ベクトル変換
│   │       ├── search.ts                  # pgvectorクエリ
│   │       └── similarity.ts              # 類似度計算
│   │
│   ├── components/
│   │   └── ui/                            # Shadcn UI共通コンポーネント
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       └── ...
│   │
│   ├── lib/
│   │   ├── prisma.ts                      # Prismaクライアント
│   │   ├── utils.ts                       # 汎用ユーティリティ
│   │   └── constants.ts                   # 定数定義
│   │
│   └── types/
│       └── global.d.ts                    # グローバル型定義
│
├── .env                                   # 環境変数（gitignore）
├── .env.example                           # 環境変数テンプレート
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── postcss.config.js
```

---

## 2. README.md の内容

以下の内容でREADME.mdを作成してください：

```markdown
# Review Predictor

新商品の説明文を入力すると、10,000人の仮想顧客プロファイルがどう評価するかをベクトル演算でシミュレーションするツール。

## 特徴

- **AI API不要**: transformers.js（ローカル）でテキストをベクトル化
- **決定論的**: 同じ入力に対して常に同じ結果（再現性保証）
- **高速処理**: pgvectorのHNSWインデックスで10,000人を瞬時に分析
- **データベース授業対応**: 正規化、トランザクション、ベクトルDB等の全要件を実装

## 技術スタック

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL + pgvector
- **ORM**: Prisma
- **Embedding**: transformers.js (Xenova)
- **UI**: Tailwind CSS + Shadcn UI

## シラバス対応

このプロジェクトは以下のデータベース授業要件を全て満たしています：

- **#2 Disk and File**: pgvectorのHNSWインデックスの物理構造
- **#3 RDB Table**: Product, Customer, Segment等の正規化テーブル
- **#4 SQL, Transaction**: シミュレーション実行時のACID保証
- **#5 Foreign Key, JOIN, SubQuery**: 複雑な集計クエリ
- **#8 正規化, DB Tuning**: 第3正規形 + EXPLAIN ANALYZE
- **#10 分散DB**: Read Replica構成の提案
- **#11 Vector DB (RAG, OTA)**: ベクトル類似度検索でレビュー予測

詳細は [docs/DESIGN.md](docs/DESIGN.md) を参照。

## セットアップ

### 前提条件

- Node.js 20.x 以上
- PostgreSQL 15.x 以上（pgvector拡張機能必須）

### インストール

```bash
# 依存パッケージのインストール
npm install

# pgvector拡張機能の有効化
psql -d your_database -c "CREATE EXTENSION IF NOT EXISTS vector;"

# データベースマイグレーション
npx prisma migrate dev

# 10,000人の顧客データシード
npx prisma db seed

# 開発サーバー起動
npm run dev
```

## 使い方

1. `http://localhost:3000/input` にアクセス
2. 商品説明文を入力（例: "高級レザー使用、職人手作り"）
3. シミュレーション実行
4. 結果画面で予測評価を確認

## 開発ガイド

実装手順の詳細は [docs/IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md) を参照。

## ドキュメント

- [全体設計書](docs/DESIGN.md)
- [データベース設計](docs/DATABASE_SCHEMA.md)
- [正規化の証明](docs/NORMALIZATION.md)
- [ベクトル検索の仕組み](docs/VECTOR_SEARCH.md)
- [トランザクション設計](docs/TRANSACTION.md)
- [パフォーマンスチューニング](docs/PERFORMANCE.md)

## ライセンス

MIT
```

---

## 3. docs/DESIGN.md の内容

先ほど作成した `REVIEW_PREDICTOR_DESIGN.md` の内容をそのまま `docs/DESIGN.md` に配置してください。

---

## 4. docs/IMPLEMENTATION_GUIDE.md の内容

以下の内容で実装ガイドを作成してください：

```markdown
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

おめでとうございます！Review Predictorの完成です🎉
```

---

## 5. 実行手順

このファイルをClaude Codeに貼り付けて、以下のように指示してください：

```
この「Review Predictor - プロジェクト構築指示書」に従って、
まずディレクトリ構造を作成してください。

具体的には:
1. docs/ フォルダと各.mdファイルの作成
2. src/features/ 配下の空フォルダ作成
3. README.md の作成

完了したら、次はPhase 1（Prismaスキーマ）に進みます。
```

---

## 注意事項

- このファイル自体は設計書に含めない（メタファイルなので）
- 実際の開発は docs/IMPLEMENTATION_GUIDE.md に従う
- 各Phaseは順番に実行すること（依存関係あり）

---

以上です。この指示書を使ってプロジェクトを構築してください。
