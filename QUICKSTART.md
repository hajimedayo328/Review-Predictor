# Market Mirror - クイックスタート

最速でアプリを起動する手順です。

## 前提条件

- Node.js 18以上
- Docker & Docker Compose
- PostgreSQL（Dockerで起動）

## 手順

### 1. データベース起動

```bash
docker-compose up -d
```

### 2. マイグレーション実行

```bash
# Prisma migrate
npx prisma migrate dev

# シードデータ投入（90人のペルソナ）
npx prisma db seed
```

### 3. アプリケーション起動

```bash
cd market-mirror
npm install
npm run dev
```

### 4. ブラウザでアクセス

http://localhost:3000

## トラブルシューティング

### Prismaエラーが出る場合

```bash
# Prisma Clientを再生成
npx prisma generate
```

### データベースをリセットしたい場合

```bash
# 警告: すべてのデータが削除されます
npx prisma migrate reset --force
```

### Prisma Studioでデータを確認

```bash
npx prisma studio
# http://localhost:5555 で開く
```

## 動作確認

1. トップページでアイデアを入力
2. カテゴリ選択（日本標準、ビジネス特化、テック先進）
3. PDCA回数選択（1/3/5/10回）
4. 「PDCAを開始する」ボタンをクリック
5. レポート画面でフィードバックを確認

以上！
