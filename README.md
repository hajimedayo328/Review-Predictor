# Market Mirror - ビジネスアイデア検証プラットフォーム

30人の多様なペルソナによって、あなたのビジネスアイデアを多角的に評価するシステムです。

## 📋 プロジェクト概要

Market Mirrorは、ビジネスアイデアを入力すると、異なる背景を持つ30人のペルソナがそれぞれの視点から評価・フィードバックを提供するWebアプリケーションです。

### 主な機能
- ✨ ビジネスアイデアの入力・管理
- 👥 3つのデッキ（30人）のペルソナによる多角的評価
- 🔄 **PDCAサイクル機能** - 任意の回数アイデアを改善・再評価
- 📊 統計情報の可視化
- 📈 バージョン管理と改善履歴の追跡
- 🎨 モダンで使いやすいUI

---

## 🎯 3つのペルソナデッキ

### 1. Standard Japan（日本の標準層）
日本の平均的な人口分布を反映した10人のペルソナ
- 大学生、会社員、主婦、高齢者など
- 幅広い年齢層と職業

### 2. Inbound Tourist（訪日外国人）
訪日外国人観光客を想定した10人のペルソナ
- 欧米・アジア圏からの観光客
- バックパッカーから富裕層まで

### 3. Biz Tech（ビジネス・テック）
スタートアップやテック業界の10人のペルソナ
- 起業家、エンジニア、デザイナー、投資家など
- イノベーション志向の評価者

---

## 🏗️ 技術スタック

### フロントエンド
- **Next.js 16** (App Router)
- **React 19**
- **Tailwind CSS 4**
- **TypeScript**

### バックエンド
- **PostgreSQL** - リレーショナルデータベース
- **Prisma ORM** - データベースアクセス層
- **Next.js Server Actions** - サーバーサイド処理

### 開発環境
- **Docker** - PostgreSQL コンテナ
- **pnpm/npm** - パッケージ管理

---

## 📊 データベース設計

### ER図とテーブル設計
詳細は [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) を参照してください。

### 主要テーブル

1. **ideas** - ビジネスアイデア
   - タイトル、説明、ターゲット層、カテゴリなど

2. **personas** - 評価者ペルソナ
   - 名前、年齢、職業、年収、性格、購買行動など
   - 3つのカテゴリ（Standard_Japan, Inbound_Tourist, Biz_Tech）

3. **reviews** - 評価・レビュー
   - スコア、コメント、購入意向、改善提案など
   - アイデアとペルソナの多対多の関係を管理

### バージョン管理（PDCA機能）

アイデアは自己参照リレーションでバージョン管理されています：

- `version`: バージョン番号（1, 2, 3...）
- `parentId`: 親アイデアへの参照（改善元）
- `status`: ステータス（draft, improved）

```
Idea (parent) ← Idea (child) ← Idea (grandchild) ...
  v1               v2               v3
```

### リレーションシップ
```
Idea (1) ←→ (多) Review (多) ←→ (1) Persona
Idea (parent) ←→ (多) Idea (children)  # 自己参照
```

- 外部キー制約によるデータ整合性の保証
- カスケード削除の実装
- ユニーク制約（1ペルソナ×1アイデア = 1レビュー）
- 自己参照による階層構造（バージョン管理）

---

## 🔄 PDCA サイクル機能

Market Mirrorの最大の特徴は、**任意の回数PDCAサイクルを回せる**ことです：

1. **Plan（計画）** - アイデアを入力
2. **Do（実行）** - ペルソナによる評価
3. **Check（評価）** - レビュー結果を確認
4. **Act（改善）** - フィードバックを元に改善版を作成

→ 再び Plan に戻り、スコアが向上するまで繰り返す！

詳細は [PDCA_FEATURE.md](./PDCA_FEATURE.md) を参照してください。

---

## 🚀 セットアップ手順

### 1. 前提条件
- Node.js 18以上
- Docker Desktop
- Git

### 2. リポジトリのクローン
```bash
git clone <repository-url>
cd finalapp
```

### 3. 依存関係のインストール
```bash
# ルートディレクトリ
npm install

# Next.jsアプリ
cd market-mirror
npm install
```

### 4. データベースのセットアップ
```bash
# PostgreSQLコンテナを起動
docker-compose up -d

# Prismaマイグレーション実行
npx prisma migrate dev

# シードデータ投入（30人のペルソナ）
npx prisma db seed
```

### 5. 環境変数の設定
```bash
# market-mirror/.env.local を作成
DATABASE_URL="postgresql://user:password@localhost:5432/market_mirror?schema=public"
```

### 6. 開発サーバーの起動
```bash
cd market-mirror
npm run dev
```

アプリケーションは http://localhost:3000 で起動します。

---

## 📂 プロジェクト構造

```
finalapp/
├── prisma/
│   ├── schema.prisma          # Prismaスキーマ定義
│   ├── seed.ts                # シードデータ（30人のペルソナ）
│   └── migrations/            # マイグレーション履歴
├── market-mirror/             # Next.jsアプリケーション
│   ├── app/
│   │   ├── page.tsx           # トップページ（アイデア入力）
│   │   ├── actions.ts         # Server Actions
│   │   └── report/
│   │       └── [id]/
│   │           └── page.tsx   # レポートページ
│   └── lib/
│       └── prisma.ts          # Prismaクライアント
├── DATABASE_DESIGN.md         # データベース設計書
├── TRANSACTION_EXAMPLES.md    # トランザクション実装例
└── README.md                  # このファイル
```

---

## 💾 データベース機能

### 実装されている機能

1. **CRUD操作**
   - アイデアの作成・取得
   - レビューの作成・取得
   - ペルソナの取得

2. **リレーションシップ管理**
   - 外部キー制約
   - カスケード削除
   - ユニーク制約

3. **トランザクション処理**
   - 複数レビューの一括作成
   - エラーハンドリングとロールバック
   - 詳細は [TRANSACTION_EXAMPLES.md](./TRANSACTION_EXAMPLES.md) を参照

4. **インデックス最適化**
   - 主キー
   - 外部キー
   - 頻繁に検索されるカラム

---

## 🔍 使い方

### 1. アイデアを入力
トップページでビジネスアイデアを入力：
- デッキを選択（Standard Japan / Inbound Tourist / Biz Tech）
- タイトルと詳細を記入
- 「検証を開始する」ボタンをクリック

### 2. レポートを確認
自動的にレポートページに遷移：
- 入力したアイデア情報を確認
- 選択したデッキの10人のペルソナを表示
- 各ペルソナの基本情報（名前、年齢、職業、年収、性格など）

### 3. AI評価（実装予定）
- 各ペルソナがAIによってアイデアを評価
- スコア、コメント、購入意向、改善提案を生成
- 統計情報を自動集計

### 4. PDCAサイクル
- レポートページで「改善版を作成」ボタンをクリック
- 改善提案を参考にアイデアを修正
- 新しいバージョンとして保存
- 再度ペルソナによる評価を受ける
- 改善履歴をタイムラインで確認

---

## 📈 データベースクエリ例

### アイデアの平均スコア取得
```sql
SELECT 
  i.id,
  i.title,
  AVG(r.score) as avg_score,
  COUNT(r.id) as review_count
FROM ideas i
LEFT JOIN reviews r ON i.id = r.ideaId
GROUP BY i.id, i.title;
```

### カテゴリ別のペルソナ取得
```sql
SELECT category, COUNT(*) as count
FROM personas
GROUP BY category;
```

### 購入意向の集計
```sql
SELECT 
  i.title,
  SUM(CASE WHEN r.willBuy THEN 1 ELSE 0 END) as buy_count,
  COUNT(r.id) as total_reviews
FROM ideas i
JOIN reviews r ON i.id = r.ideaId
GROUP BY i.title;
```

---

## 🛠️ 開発者向け

### Prismaコマンド

```bash
# スキーマからクライアントを生成
npx prisma generate

# マイグレーション作成
npx prisma migrate dev --name migration_name

# データベースリセット＆シード再投入
npx prisma migrate reset

# Prisma Studio起動（GUIでデータ確認）
npx prisma studio
```

### データベース確認

```bash
# PostgreSQLに接続
docker exec -it finalapp-postgres-1 psql -U user -d market_mirror

# テーブル一覧
\dt

# テーブル構造確認
\d ideas
\d personas
\d reviews
```

---

## 📝 今後の実装予定

### Phase 1: AI統合（次のステップ）
- [ ] OpenAI/Claude/Gemini APIの統合
- [ ] ペルソナごとのAI評価生成
- [ ] レビューの自動保存
- [x] **PDCAサイクル機能** ✅

### Phase 2: 機能拡張
- [x] **バージョン管理とPDCAサイクル** ✅
- [x] **改善履歴の可視化** ✅
- [ ] バージョン比較ビュー
- [ ] レビューの編集・削除
- [ ] アイデアの一覧表示
- [ ] カテゴリ別の統計ダッシュボード
- [ ] エクスポート機能（PDF/CSV）

### Phase 3: 最適化
- [ ] ページネーション
- [ ] キャッシング戦略
- [ ] パフォーマンス改善

---

## 🎓 学習ポイント（データベース授業向け）

このプロジェクトでは以下のデータベース概念を実装しています：

### 1. リレーショナルデータベース設計
- ✅ ER図の作成
- ✅ 正規化（第3正規形）
- ✅ 主キー・外部キーの設計

### 2. SQL操作
- ✅ CRUD操作
- ✅ JOIN（内部結合・外部結合）
- ✅ 集約関数（COUNT, AVG, SUM）
- ✅ GROUP BY

### 3. データ整合性
- ✅ 外部キー制約
- ✅ ユニーク制約
- ✅ NOT NULL制約
- ✅ カスケード削除

### 4. トランザクション
- ✅ ACID特性の理解
- ✅ トランザクション分離レベル
- ✅ ロールバック処理

### 5. インデックス最適化
- ✅ 主キーインデックス
- ✅ 外部キーインデックス
- ✅ 複合ユニークインデックス

### 6. 自己参照リレーション
- ✅ 階層構造の実装（親子関係）
- ✅ 再帰的データ取得
- ✅ バージョン管理システム

---

## 🤝 コントリビューション

データベース設計の改善提案や、新機能のアイデアがあればお気軽にご連絡ください。

---

## 📄 ライセンス

このプロジェクトは教育目的で作成されています。

---

## 👤 作成者

データベース授業 - 最終課題
作成日: 2025年12月

---

## 📚 参考資料

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) - データベース設計詳細
- [TRANSACTION_EXAMPLES.md](./TRANSACTION_EXAMPLES.md) - トランザクション実装例
- [PDCA_FEATURE.md](./PDCA_FEATURE.md) - PDCAサイクル機能の詳細
