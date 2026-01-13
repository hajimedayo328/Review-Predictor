# Market Mirror - データベース最終課題

> 90人のペルソナが自動でPDCAサイクルを回すビジネスアイデア評価システム

## 📋 プロジェクト概要

**Market Mirror**は、ビジネスアイデアを入力すると、カテゴリ別に分類された30人のペルソナが自動的にPDCAサイクルを実行し、Do（実行）、Check（評価）、Act（改善）のフィードバックを提供するWebアプリケーションです。

### 主な機能

1. **アイデア入力** - ビジネスアイデアとPDCA実行回数（1/3/5/10回）を選択
2. **カテゴリ選択** - 日本標準、ビジネス特化、テック先進の3カテゴリ（各30人）
3. **自動PDCA実行** - 選択カテゴリの30人が各サイクルでD・C・Aのフィードバックを提供
4. **結果レポート** - サイクルごとのフィードバックを視覚的に表示

### システムの特徴

- **90人のペルソナ**: JAPAN_STANDARD（30人）、BUSINESS_FOCUSED（30人）、TECH_ADVANCED（30人）
- **シンプルな設計**: 4テーブル（Persona, Idea, PDCACycle, Feedback）で完結
- **リレーショナルDB**: PostgreSQL + Prisma ORM
- **直感的なUI**: 入力→実行→結果の3ステップ

## 🗂️ プロジェクト構成

### ディレクトリ構造

```
finalapp/                          # プロジェクトルート
│
├── 📄 README.md                   # プロジェクト全体の説明（最重要）
│
├── 🗄️ prisma/                     # データベース定義
│   ├── schema.prisma              # データベーススキーマ定義（必須）
│   ├── seed.ts                    # 90人のペルソナ定義データ（必須）
│   └── migrations/                # マイグレーション履歴
│
├── 📚 docs/                       # ドキュメント（提出用資料）
│   ├── design_diagrams.md         # 設計図（ER図、アーキテクチャ図など）
│   ├── database_schema.md         # データベース設計書
│   ├── system_architecture.md     # システムアーキテクチャ
│   ├── migration_checklist.md     # 移行チェックリスト
│   ├── database_schema_reference.md # スキーマ参照
│   └── images/                    # 設計図用画像ファイル
│
├── 🚀 market-mirror/              # Next.jsアプリケーション（旧実装・参考用）
│   ├── app/                       # Next.js App Router
│   │   ├── api/                   # API Routes
│   │   ├── components/            # Reactコンポーネント
│   │   └── page.tsx               # ページコンポーネント
│   ├── lib/                       # AI統合ロジック（参考用）
│   │   ├── ai-client.ts           # 統合AIクライアント
│   │   ├── claude-client.ts       # Claude API実装
│   │   ├── openai-client.ts       # OpenAI API実装
│   │   └── mock-client.ts         # モック評価アルゴリズム
│   ├── prisma/                    # Prisma設定（market-mirror用）
│   ├── public/                    # 静的ファイル
│   ├── package.json               # Next.js依存関係
│   └── next.config.ts             # Next.js設定
│
├── 🐳 docker-compose.yml          # PostgreSQL + pgvector設定（必須）
│
└── 📋 その他のドキュメント
    ├── VECTOR_DATABASE.md         # ベクトル検索の実装詳細
    ├── PDCA_SPECIFICATION.md     # PDCAサイクルの仕様
    ├── JOB_QUEUE_ARCHITECTURE.md # ジョブキューアーキテクチャ
    └── QUICKSTART.md              # クイックスタートガイド
```

### ファイルの重要度

#### 🔴 必須（新しい環境に必ず移行）
- `prisma/schema.prisma` - データベーススキーマ定義
- `prisma/seed.ts` - 90人のペルソナ定義データ
- `docker-compose.yml` - データベース設定
- `.env` - 環境変数（APIキーなど）
- `docs/` - ドキュメント全体

#### 🟡 参考（ロジックの参照用）
- `market-mirror/lib/ai-client.ts` - AI統合ロジック
- `market-mirror/lib/mock-client.ts` - モック評価アルゴリズム
- `market-mirror/next.config.ts` - Next.js設定

#### 🟢 不要（削除済み）
- `market-mirror/public/` 内のデフォルトアイコン
- 一時スクリプト（`demo-setup.ts` など）

### データフロー概要

```
[ユーザー]
   │
   ▼
[Next.js App] ←→ [PostgreSQL + pgvector]
   │                    │
   │                    ├─→ ideas（アイデア）
   │                    ├─→ personas（90人のペルソナ）
   │                    ├─→ reviews（評価データ）
   │                    └─→ proposals（改善提案）
   │
   └─→ [AI APIs]
          ├─→ Claude API
          ├─→ OpenAI API
          └─→ Mock Client（APIキー不要）
```

## 🚀 クイックスタート

### 前提条件

- Node.js 18+
- Docker & Docker Compose
- npm または yarn

### セットアップ手順

1. **リポジトリのクローン**
   ```bash
   git clone [repository-url]
   cd finalapp
   ```

2. **環境変数の設定**
   `.env` ファイルを作成し、以下を設定：
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/market_mirror?schema=public"
   
   # オプション: AI APIキー（設定しない場合はモックが使用されます）
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **データベースの起動**
   ```bash
   docker-compose up -d
   ```

4. **データベースのセットアップ**
   ```bash
   # マイグレーション実行
   npx prisma migrate dev
   
   # シードデータ投入（90人のペルソナ）
   npx prisma db seed
   ```

5. **アプリケーションの起動**
   ```bash
   cd market-mirror
   npm install
   npm run dev
   ```

6. **ブラウザでアクセス**
   - アプリケーション: http://localhost:3000
   - Prisma Studio: `npx prisma studio` → http://localhost:5555

## 📊 データベース設計（DESIGN_DOCUMENT.md準拠）

### ER図

```
Persona (90人固定)
  ├── id: String (PK, cuid)
  ├── name: String
  ├── category: Category Enum (JAPAN_STANDARD, BUSINESS_FOCUSED, TECH_ADVANCED)
  ├── age: Int
  ├── occupation: String
  └── background: Text

Idea
  ├── id: String (PK, cuid)
  ├── content: Text
  ├── category: Category Enum
  ├── cycleCount: Int (1/3/5/10)
  └── status: IdeaStatus Enum (PENDING, RUNNING, COMPLETED, FAILED)

PDCACycle
  ├── id: String (PK, cuid)
  ├── ideaId: String (FK → Idea)
  ├── cycleNumber: Int
  └── UNIQUE(ideaId, cycleNumber)

Feedback
  ├── id: String (PK, cuid)
  ├── cycleId: String (FK → PDCACycle)
  ├── personaId: String (FK → Persona)
  ├── doResponse: Text
  ├── checkResponse: Text
  ├── actResponse: Text
  └── UNIQUE(cycleId, personaId)
```

### ペルソナ構成

- **JAPAN_STANDARD**: 30人（一般的な日本人）
- **BUSINESS_FOCUSED**: 30人（経営者・投資家）
- **TECH_ADVANCED**: 30人（エンジニア・研究者）

**合計: 90人**

詳細は `prisma/seed.ts` を参照してください。

## 🔧 技術スタック

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS

### Backend
- Next.js Server Actions
- Next.js API Routes
- Prisma ORM

### Database
- PostgreSQL 15+
- pgvector (ベクトル検索)

### AI Integration
- Anthropic Claude API
- OpenAI API
- Mock Client (APIキー不要)

## 📚 ドキュメント

### 🎯 最重要ドキュメント（AIが最初に参照）

- **[プロジェクト全体設計書](./docs/DESIGN_DOCUMENT.md)**: **このドキュメント1つでプロジェクト全体を理解し実装できる状態にする設計書**

### 必須ドキュメント

- **[設計図](./docs/design_diagrams.md)**: ER図、アーキテクチャ図、フロー図
- **[データベース設計書](./docs/database_schema.md)**: 詳細なデータベース設計
- **[システムアーキテクチャ](./docs/system_architecture.md)**: システム全体の設計

### 参考ドキュメント

- **[移行チェックリスト](./docs/migration_checklist.md)**: 新しい環境への移行手順
- **[データベーススキーマ参照](./docs/database_schema_reference.md)**: スキーマの完全な定義
- **[VECTOR_DATABASE.md](./VECTOR_DATABASE.md)**: ベクトル検索の実装詳細
- **[PDCA_SPECIFICATION.md](./PDCA_SPECIFICATION.md)**: PDCAサイクルの仕様
- **[JOB_QUEUE_ARCHITECTURE.md](./JOB_QUEUE_ARCHITECTURE.md)**: ジョブキューアーキテクチャ

## 🔑 重要なファイル

### 必須移行ファイル

以下のファイルは新しい環境に移行する際、**必ずコピー**してください：

1. **`prisma/schema.prisma`** - データベーススキーマ定義
2. **`prisma/seed.ts`** - 90人のペルソナ定義データ
3. **`docker-compose.yml`** - PostgreSQL + pgvector設定
4. **`.env`** - 環境変数（APIキーなど）
5. **`docs/`** - ドキュメントディレクトリ全体

### 参考ファイル

以下のファイルはロジックの参照用として保持：

- `market-mirror/lib/ai-client.ts` - AI統合ロジック
- `market-mirror/lib/mock-client.ts` - モック評価アルゴリズム
- `market-mirror/next.config.ts` - Next.js設定

詳細は [移行チェックリスト](./docs/migration_checklist.md) を参照してください。

## 🧪 開発・テスト

### データベース操作

```bash
# Prisma Studio起動（GUIでデータベースを確認）
npx prisma studio

# マイグレーションリセット（開発環境のみ）
npx prisma migrate reset

# シードデータのみ再投入
npx prisma db seed
```

### AI評価のテスト

APIキーがない場合、自動的にモッククライアントが使用されます。
モック評価は決定論的で、同じペルソナとアイデアの組み合わせで同じ結果を返します。

## 📝 注意事項

1. **ペルソナデータ**: `prisma/seed.ts` には90人すべてのペルソナデータが含まれています。データの欠損がないか確認してください。

2. **ベクトル検索**: pgvectorを使用する場合は `docker-compose.yml` の設定を確認してください。

3. **APIキー**: `.env` ファイルに `ANTHROPIC_API_KEY` または `OPENAI_API_KEY` を設定しない場合、自動的にモッククライアントが使用されます。

## 🗑️ 削除済みファイル

以下のファイルは既に削除済みです（不要なため）：

- `market-mirror/public/` 内のデフォルトアイコン
- 一時スクリプト（`demo-setup.ts`, `generate-reviews.ts` など）
- 空ディレクトリ（`market-mirror/types/`）

## 📄 ライセンス

このプロジェクトはデータベース授業の最終課題として作成されました。

## 🤝 貢献

このプロジェクトは学習目的のため、プルリクエストは受け付けていません。

---

**最終更新**: 2024年12月

