# クイックスタートガイド

先生が簡単に動作確認できるための手順書

---

## 📋 前提条件

- Node.js 18以上
- Docker Desktop（PostgreSQL用）
- Git

---

## 🚀 5分でセットアップ

### 1. リポジトリのクローン

```bash
git clone [リポジトリURL]
cd finalapp
```

### 2. PostgreSQL起動

```bash
docker-compose up -d
```

**確認：**
```bash
docker ps
# → postgres:16 が起動していることを確認
```

### 3. データベースセットアップ

```bash
# マイグレーション実行 + 30人のペルソナを自動生成
npx prisma migrate reset

# "Do you want to continue? › (y/N)" → y を入力
```

**実行内容：**
- データベースをリセット
- 4テーブル作成（Idea, Persona, Review, Proposal）
- 30人のペルソナを自動挿入

### 4. 依存関係インストール

```bash
cd market-mirror
npm install
```

### 5. 開発サーバー起動

```bash
npm run dev
```

**起動確認：**
```
  ▲ Next.js 15.1.3
  - Local:        http://localhost:3000
```

---

## 🔍 動作確認手順

### Step 1: データベースの確認

```bash
# 別のターミナルで
npx prisma studio
```

ブラウザで `http://localhost:5555` を開く

**確認ポイント：**
- ✅ `Persona`テーブルに30件のデータ
- ✅ 3つのカテゴリ（Standard_Japan, Inbound_Tourist, Biz_Tech）各10人

### Step 2: アプリケーションの動作確認

#### 2-1. アイデア作成

1. ブラウザで `http://localhost:3000` を開く
2. ターゲットデッキを選択（例：🇯🇵 Standard Japan）
3. 以下を入力：

```
タイトル：
AI家計簿アプリ「スマート・マネー」

詳細説明：
レシートをスマホで撮影するだけで自動で支出を記録。
AIが家計のムダを分析し、節約アドバイスを提供。
月額500円で利用可能。
```

4. PDCA実行回数：1回（デフォルト）
5. 「🚀 検証を開始する」をクリック

#### 2-2. レポート確認

自動で `/report/1` に遷移

**確認ポイント：**
- ✅ アイデア情報（タイトル、説明、カテゴリ）
- ✅ 10人のペルソナカード
- ✅ 各カードに「レビュー待機中」と表示
  - ※ モックAIが実装済みですが、手動実行が必要です（後述）

#### 2-3. モックレビュー生成（オプション）

レビューデータを生成するスクリプトを実行：

```bash
# market-mirrorディレクトリ内で
npx tsx -e "
import { prisma } from './lib/prisma';

async function generateReview() {
  const idea = await prisma.idea.findFirst({ orderBy: { createdAt: 'desc' } });
  const personas = await prisma.persona.findMany({ where: { category: idea.category } });
  
  for (const persona of personas) {
    const score = Math.floor(Math.random() * 5) + 5; // 5-9点
    await prisma.review.create({
      data: {
        ideaId: idea.id,
        personaId: persona.id,
        score,
        willBuy: score >= 7,
        comment: \`\${persona.name}（\${persona.age}歳）です。このアイデアは\${score}点です。\`,
        improvementSuggestion: 'UIをもっとシンプルにすると良いでしょう。',
        pricePerception: score >= 8 ? '適切' : '高い',
        trustLevel: Math.floor(Math.random() * 2) + 3, // 3-5
      },
    });
  }
  
  console.log('✅ レビュー生成完了');
  await prisma.\$disconnect();
}

generateReview();
"
```

**実行後、ブラウザをリロード**

**確認ポイント：**
- ✅ 統計情報が表示される（平均スコア、購入意向率、信頼度）
- ✅ スコア分布グラフ
- ✅ 各ペルソナカードにスコアと評価内容
- ✅ 「📝 コメントを読む」で詳細表示

---

## 🗑️ CASCADE削除の確認

### 手順

1. トップページ（http://localhost:3000）をスクロール
2. 「📋 最近のアイデア」セクションに先ほど作成したアイデアが表示
3. 右上のゴミ箱アイコンをクリック
4. 確認ダイアログで「OK」

### 確認

Prisma Studioで確認：

```bash
npx prisma studio
```

**確認ポイント：**
- ✅ `Idea`テーブルから削除されている
- ✅ `Review`テーブルから関連する10件も自動削除（CASCADE）

---

## 🔄 トランザクションの確認

### ターミナルログを確認

開発サーバーのターミナルに以下のようなログが表示されます：

```
prisma:query BEGIN
prisma:query INSERT INTO "ideas" ...
prisma:query SELECT "personas" WHERE "category" = $1
prisma:query INSERT INTO "reviews" ...
prisma:query COMMIT
```

**ポイント：**
- `BEGIN` → `COMMIT`: トランザクション開始〜終了
- 複数のINSERTが1つのトランザクション内で実行
- エラーが発生した場合は自動で`ROLLBACK`

---

## 📊 JOINとSubQueryの確認

### Prisma Studioで確認

1. `Review`テーブルを開く
2. 任意のレビューをクリック
3. `idea`と`persona`のリレーションが表示される

### コードで確認

`market-mirror/app/report/[id]/page.tsx` の以下の部分：

```typescript
// INNER JOIN の例
const idea = await prisma.idea.findUnique({
  where: { id },
  include: {
    reviews: {
      include: {
        persona: true,  // JOIN personas
      },
    },
  },
});

// 生成されるSQL:
// SELECT i.*, r.*, p.*
// FROM ideas i
// INNER JOIN reviews r ON i.id = r.ideaId
// INNER JOIN personas p ON r.personaId = p.id
```

---

## 📈 正規化の確認

### ER図の確認

`README.md`のER図セクションを参照

### 正規化レベル

- ✅ **第1正規形**: すべてのカラムが単一値
- ✅ **第2正規形**: 主キーへの完全関数従属
- ✅ **第3正規形**: 推移的関数従属を除去

### 実例

#### Reviewテーブル（第2正規形）

```
Review {
  id: 1,
  ideaId: 5,
  personaId: 10,
  score: 8,        // (ideaId, personaId) に完全従属
  comment: "...",  // (ideaId, personaId) に完全従属
}
```

#### Categoryの正規化（第3正規形）

```typescript
// 推移的従属を避けるため、アプリケーション層で管理
export const CATEGORY_INFO = {
  Standard_Japan: { name: '日本の標準層', icon: '🇯🇵' },
  // categoryから推移的に決まる情報をDBに持たない
};
```

---

## 🔍 追加の動作確認

### 1. 複数アイデアの作成

同じ手順で2-3個のアイデアを作成

**確認ポイント：**
- トップページの一覧に表示される
- 各アイデアのID、作成日時、統計情報が表示

### 2. カテゴリ別の動作

3つのカテゴリすべてでアイデアを作成：
- 🇯🇵 Standard Japan
- ✈️ Inbound Tourist
- 💼 Biz Tech

**確認ポイント：**
- カテゴリごとに異なる10人のペルソナが評価

### 3. エラーハンドリング

#### 必須項目の未入力

1. タイトルを空欄でsubmit
2. エラーメッセージ表示を確認

#### 長すぎる入力

1. タイトルに200文字以上を入力
2. エラーメッセージ表示を確認

---

## 🧪 テストデータの生成（オプション）

すべてのアイデアにレビューを一括生成：

```bash
cd market-mirror
npx tsx -e "
import { prisma } from './lib/prisma';

async function generateAllReviews() {
  const ideas = await prisma.idea.findMany();
  
  for (const idea of ideas) {
    const existingReviews = await prisma.review.count({ where: { ideaId: idea.id } });
    if (existingReviews > 0) continue;
    
    const personas = await prisma.persona.findMany({ where: { category: idea.category } });
    
    for (const persona of personas) {
      const score = Math.floor(Math.random() * 5) + 5;
      await prisma.review.create({
        data: {
          ideaId: idea.id,
          personaId: persona.id,
          score,
          willBuy: score >= 7,
          comment: \`\${persona.name}のコメント（スコア:\${score}/10）\`,
          improvementSuggestion: '改善提案',
          pricePerception: score >= 8 ? '適切' : '高い',
          trustLevel: Math.floor(Math.random() * 2) + 3,
        },
      });
    }
  }
  
  console.log('✅ 全レビュー生成完了');
  await prisma.\$disconnect();
}

generateAllReviews();
"
```

---

## 📸 スクリーンショット確認項目

先生が確認すべき画面：

1. **トップページ**
   - ✅ アイデア作成フォーム
   - ✅ 最近のアイデア一覧

2. **レポートページ**
   - ✅ アイデア詳細
   - ✅ 統計情報（4つのカード）
   - ✅ スコア分布グラフ
   - ✅ ペルソナカード（10枚）
   - ✅ コメント詳細（展開時）

3. **Prisma Studio**
   - ✅ 4つのテーブル
   - ✅ リレーション表示

---

## 🆘 トラブルシューティング

### Dockerが起動しない

```bash
# Dockerが起動しているか確認
docker ps

# 起動していない場合
docker-compose down
docker-compose up -d
```

### データベース接続エラー

```bash
# 環境変数の確認
cat .env

# 正しい内容：
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/market_mirror"
```

### マイグレーションエラー

```bash
# データベースを完全にリセット
docker-compose down -v
docker-compose up -d
npx prisma migrate reset
```

### ポート競合

```bash
# 3000番ポートが使用中の場合
lsof -ti:3000 | xargs kill -9

# 5432番ポートが使用中の場合
docker-compose down
docker-compose up -d
```

---

## 📞 連絡先

質問・不明点があれば[学生情報]までご連絡ください。

---

**所要時間**: 初回セットアップ 5分 + 動作確認 10分 = **合計約15分**
