# Review Predictor - ER図（実体関連図）

## データベース設計の全体像

このドキュメントでは、Review Predictorのデータベース設計をER図（実体関連図）とテキストで説明します。

---

## ER図（テキスト表現）

```
┌─────────────────┐
│     Seller      │
│─────────────────│
│ id (PK)         │──┐
│ name            │  │
│ email (UNIQUE)  │  │
│ createdAt       │  │
│ updatedAt       │  │
└─────────────────┘  │
                     │ 1:N
┌─────────────────┐  │
│    Category     │  │
│─────────────────│  │
│ id (PK)         │──┼──┐
│ name (UNIQUE)   │  │  │
│ description     │  │  │
└─────────────────┘  │  │
                     │  │
                     │  │ 1:N
                     │  │
┌─────────────────┐  │  │
│     Product     │  │  │
│─────────────────│  │  │
│ id (PK)         │──┼──┼──┐
│ sellerId (FK)   │──┘  │  │
│ categoryId (FK) │─────┘  │
│ name            │        │
│ description     │        │
│ embedding       │        │
│   (vector 384)  │        │
│ price           │        │
│ createdAt       │        │
│ updatedAt       │        │
└─────────────────┘        │
                           │ 1:N
┌─────────────────┐        │
│   Simulation    │        │
│─────────────────│        │
│ id (PK)         │──┐     │
│ productId (FK)  │──┘     │
│ status          │        │
│ avgRating       │        │
│ conversionRate  │        │
│ createdAt       │        │
│ updatedAt       │        │
└─────────────────┘        │
         │                  │
         │ 1:N              │
         ↓                  │
┌─────────────────┐         │
│ PredictedReview │         │
│─────────────────│         │
│ id (PK)         │         │
│ simulationId(FK)│─────────┘
│ customerId (FK) │──────────┐
│ rating (1-5)    │          │
│ similarity      │          │
│ reviewText      │          │
│ createdAt       │          │
└─────────────────┘          │
                             │
┌─────────────────┐          │
│    Segment      │          │
│─────────────────│          │
│ id (PK)         │──┐       │
│ name (UNIQUE)   │  │       │
│ description     │  │       │
└─────────────────┘  │       │
                     │ 1:N    │
                     │        │
┌─────────────────┐  │        │
│    Customer     │  │        │
│─────────────────│  │        │
│ id (PK)         │──┼────────┘
│ segmentId (FK)  │──┘
│ name            │
│ profileVector   │
│   (vector 5)    │
│ preferenceVector│
│   (vector 384)  │
│ createdAt       │
└─────────────────┘
```

---

## テーブル間の関係

### 1. Seller（販売者）→ Product（商品）
- **関係**: 1対多（1つの販売者が複数の商品を持つ）
- **外部キー**: `Product.sellerId` → `Seller.id`
- **CASCADE**: なし（販売者削除時は商品は残す）

### 2. Category（カテゴリ）→ Product（商品）
- **関係**: 1対多（1つのカテゴリに複数の商品が属する）
- **外部キー**: `Product.categoryId` → `Category.id`
- **CASCADE**: なし（カテゴリ削除時は商品は残す）

### 3. Product（商品）→ Simulation（シミュレーション）
- **関係**: 1対多（1つの商品に対して複数のシミュレーションを実行可能）
- **外部キー**: `Simulation.productId` → `Product.id`
- **CASCADE**: なし（商品削除時はシミュレーション履歴は残す）

### 4. Simulation（シミュレーション）→ PredictedReview（予測レビュー）
- **関係**: 1対多（1つのシミュレーションに10,000件のレビューが紐づく）
- **外部キー**: `PredictedReview.simulationId` → `Simulation.id`
- **CASCADE**: あり（シミュレーション削除時はレビューも削除）

### 5. Customer（顧客）→ PredictedReview（予測レビュー）
- **関係**: 1対多（1人の顧客が複数のシミュレーションでレビューを残す）
- **外部キー**: `PredictedReview.customerId` → `Customer.id`
- **CASCADE**: なし（顧客削除時はレビュー履歴は残す）

### 6. Segment（セグメント）→ Customer（顧客）
- **関係**: 1対多（1つのセグメントに複数の顧客が属する）
- **外部キー**: `Customer.segmentId` → `Segment.id`
- **CASCADE**: なし（セグメント削除時は顧客は残す）

---

## 制約とインデックス

### ユニーク制約
- `Seller.email`: メールアドレスは一意
- `Category.name`: カテゴリ名は一意
- `Segment.name`: セグメント名は一意
- `PredictedReview(simulationId, customerId)`: 1つのシミュレーションで同じ顧客のレビューは1件のみ

### インデックス
- `Product.sellerId`: 販売者別の商品検索を高速化
- `Product.categoryId`: カテゴリ別の商品検索を高速化
- `Simulation.productId`: 商品別のシミュレーション履歴検索を高速化
- `PredictedReview.simulationId`: シミュレーション別のレビュー取得を高速化
- `Customer.segmentId`: セグメント別の顧客検索を高速化

### ベクトルインデックス（pgvector）
- `Product.embedding`: HNSWインデックス（商品説明のベクトル検索用）
- `Customer.preferenceVector`: HNSWインデックス（顧客好みのベクトル検索用）

---

## 正規化の説明

このデータベース設計は**第3正規形（3NF）**に準拠しています：

1. **第1正規形（1NF）**: すべての属性が原子値（分割不可能）
2. **第2正規形（2NF）**: 部分関数従属を排除
   - 例：`Product`テーブルで`sellerId`と`categoryId`は主キーに完全従属
3. **第3正規形（3NF）**: 推移的関数従属を排除
   - 例：`Product`テーブルに販売者名を直接保存せず、`Seller`テーブルを参照

### 正規化のメリット
- **データの重複排除**: 販売者情報やカテゴリ情報の重複を防ぐ
- **更新の一貫性**: 1箇所の更新で全体に反映
- **ストレージ効率**: 重複データを削減
- **整合性保証**: 外部キー制約で参照整合性を維持

---

## データフロー

### シミュレーション実行時のデータフロー

```
1. 商品説明入力
   ↓
2. Product レコード作成（embedding含む）
   ↓
3. Simulation レコード作成（status: RUNNING）
   ↓
4. ベクトル検索で類似顧客を取得（Customer.preferenceVector）
   ↓
5. 各顧客の評価を予測（rating, similarity計算）
   ↓
6. レビューテキスト生成（reviewText）
   ↓
7. PredictedReview レコード一括挿入（10,000件）
   ↓
8. Simulation レコード更新（status: COMPLETED, avgRating, conversionRate）
```

---

## テーブル別のデータ量目安

- **Seller**: 1〜数件（デフォルト1件）
- **Category**: 数件〜数十件（デフォルト数件）
- **Product**: シミュレーション実行数分（増加）
- **Segment**: 4件固定（ブランド重視、デザイン重視、価格重視、品質重視）
- **Customer**: 10,000件固定（シードデータ）
- **Simulation**: シミュレーション実行数分（増加）
- **PredictedReview**: シミュレーション数 × 10,000件（増加）

---

## クエリパターン例

### 1. 商品別のシミュレーション結果取得
```sql
SELECT s.*, p.name, p.description
FROM simulations s
JOIN products p ON s."productId" = p.id
WHERE s.id = 'simulation_id';
```

### 2. セグメント別の平均評価
```sql
SELECT seg.name, AVG(pr.rating) as avg_rating
FROM predicted_reviews pr
JOIN customers c ON pr."customerId" = c.id
JOIN segments seg ON c."segmentId" = seg.id
WHERE pr."simulationId" = 'simulation_id'
GROUP BY seg.name;
```

### 3. ベクトル類似度検索（pgvector）
```sql
SELECT c.id, c.name,
       1 - (c."preferenceVector" <=> $1::vector(384)) as similarity
FROM customers c
ORDER BY c."preferenceVector" <=> $1::vector(384)
LIMIT 10000;
```

---

*このER図は、データベース授業の要件（正規化、外部キー、JOIN、ベクトルDB）を満たす設計となっています。*


