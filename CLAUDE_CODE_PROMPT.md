# Claude Code への依頼プロンプト

## 問題
Prisma Studioでクライアントエラーが発生し、データベースの内容を確認できません。

## 原因
現在のデータベースには古いスキーマ（`Persona`、`Idea`、`reviews`、`proposals`、`analysis_jobs`）が存在していますが、`prisma/schema.prisma`には新しいスキーマ（`Persona`、`Idea`、`PDCACycle`、`Feedback`）が定義されています。この不一致によりPrisma Studioが正常に動作していません。

## 依頼内容

以下の手順でデータベースを新しいスキーマに合わせて修正してください：

1. **データベースをリセット**
   ```bash
   npx prisma migrate reset
   ```
   - 開発環境なので、既存データは削除して問題ありません
   - シードデータの実行も確認してください

2. **新しいスキーマに基づくマイグレーションを作成・適用**
   ```bash
   npx prisma migrate dev --name init_new_schema
   ```

3. **Prisma Clientを再生成**
   ```bash
   npx prisma generate
   ```

4. **Prisma Studioを起動して動作確認**
   ```bash
   npx prisma studio
   ```

## 注意事項
- 既存のコード（`market-mirror/app/api/pdca/execute/route.ts`など）は変更しないでください
- データベースのリセットのみを行ってください
- 新しいスキーマは`prisma/schema.prisma`に既に定義されています

## 期待される結果
- Prisma Studioが正常に起動し、`Persona`、`Idea`、`PDCACycle`、`Feedback`テーブルが表示される
- クライアントエラーが解消される

