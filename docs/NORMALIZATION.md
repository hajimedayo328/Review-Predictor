# 正規化の証明

## 概要

Review Predictorのデータベースは**第3正規形（3NF）**を満たしています。本ドキュメントでは各テーブルの正規化状態を証明します。

---

## 正規化の定義

| 正規形 | 条件 |
|--------|------|
| **第1正規形（1NF）** | すべての属性が原子値（スカラー値）である |
| **第2正規形（2NF）** | 1NFかつ、部分関数従属が存在しない |
| **第3正規形（3NF）** | 2NFかつ、推移的関数従属が存在しない |

---

## 各テーブルの正規化証明

### 1. sellers（販売者）テーブル

```
sellers(id, name, email, createdAt, updatedAt)
```

| 正規形 | 判定 | 理由 |
|--------|------|------|
| 1NF | ✅ | すべての属性が原子値（文字列、日時） |
| 2NF | ✅ | 主キーが単一属性（id）のため部分関数従属は存在しない |
| 3NF | ✅ | 非キー属性間に推移的従属なし（name, emailはidにのみ従属） |

**関数従属性:**
- id → name, email, createdAt, updatedAt

---

### 2. categories（カテゴリ）テーブル

```
categories(id, name, description)
```

| 正規形 | 判定 | 理由 |
|--------|------|------|
| 1NF | ✅ | すべての属性が原子値 |
| 2NF | ✅ | 主キーが単一属性（id） |
| 3NF | ✅ | 非キー属性間に推移的従属なし |

**関数従属性:**
- id → name, description

---

### 3. products（商品）テーブル

```
products(id, sellerId, categoryId, name, description, embedding, price, createdAt, updatedAt)
```

| 正規形 | 判定 | 理由 |
|--------|------|------|
| 1NF | ✅ | vector(384)は配列だが、pgvectorでは原子的なデータ型として扱われる |
| 2NF | ✅ | 主キーが単一属性（id） |
| 3NF | ✅ | sellerId, categoryIdは外部キーであり、それぞれの詳細情報は別テーブルに分離 |

**関数従属性:**
- id → sellerId, categoryId, name, description, embedding, price, createdAt, updatedAt
- sellerId → (sellersテーブルへの参照)
- categoryId → (categoriesテーブルへの参照)

**3NF違反の回避:**
もし商品テーブルに`sellerName`や`categoryName`を含めると推移的従属が発生するが、外部キーで分離しているため問題なし。

---

### 4. segments（セグメント）テーブル

```
segments(id, name, description)
```

| 正規形 | 判定 | 理由 |
|--------|------|------|
| 1NF | ✅ | すべての属性が原子値 |
| 2NF | ✅ | 主キーが単一属性（id） |
| 3NF | ✅ | 非キー属性間に推移的従属なし |

**関数従属性:**
- id → name, description

---

### 5. customers（顧客）テーブル

```
customers(id, segmentId, name, profileVector, preferenceVector, createdAt)
```

| 正規形 | 判定 | 理由 |
|--------|------|------|
| 1NF | ✅ | ベクトル型はpgvectorで原子的に扱われる |
| 2NF | ✅ | 主キーが単一属性（id） |
| 3NF | ✅ | segmentIdは外部キー、セグメント情報は別テーブル |

**関数従属性:**
- id → segmentId, name, profileVector, preferenceVector, createdAt
- segmentId → (segmentsテーブルへの参照)

**ベクトル属性について:**
- `profileVector(5)`: [価格敏感度, 品質重視度, デザイン重視度, ブランドロイヤリティ, レビュー厳しさ]
- `preferenceVector(384)`: テキスト埋め込みベクトル

これらは顧客の属性を数値ベクトルとして表現したものであり、1つの意味を持つ原子的なデータとして扱う。

---

### 6. simulations（シミュレーション）テーブル

```
simulations(id, productId, status, avgRating, conversionRate, createdAt, updatedAt)
```

| 正規形 | 判定 | 理由 |
|--------|------|------|
| 1NF | ✅ | すべての属性が原子値 |
| 2NF | ✅ | 主キーが単一属性（id） |
| 3NF | ✅ | productIdは外部キー、商品情報は別テーブル |

**関数従属性:**
- id → productId, status, avgRating, conversionRate, createdAt, updatedAt

**計算属性について:**
`avgRating`と`conversionRate`は予測レビューから計算可能だが、以下の理由で非正規化として許容：
1. 10,000件のレビューから毎回計算するのは非効率
2. キャッシュとして保存することでクエリ性能が向上
3. simulationIdとの1:1関係であり冗長性は最小限

---

### 7. predicted_reviews（予測レビュー）テーブル

```
predicted_reviews(id, simulationId, customerId, rating, similarity, reviewText, createdAt)
```

| 正規形 | 判定 | 理由 |
|--------|------|------|
| 1NF | ✅ | すべての属性が原子値 |
| 2NF | ✅ | 主キーが単一属性（id） |
| 3NF | ✅ | 外部キーのみで推移的従属なし |

**関数従属性:**
- id → simulationId, customerId, rating, similarity, reviewText, createdAt

**複合ユニーク制約:**
```sql
@@unique([simulationId, customerId])
```
同一シミュレーションで同一顧客のレビューは1件のみ存在可能。

---

## 正規化のまとめ

| テーブル | 1NF | 2NF | 3NF | 備考 |
|----------|-----|-----|-----|------|
| sellers | ✅ | ✅ | ✅ | - |
| categories | ✅ | ✅ | ✅ | - |
| products | ✅ | ✅ | ✅ | 外部キーで分離 |
| segments | ✅ | ✅ | ✅ | - |
| customers | ✅ | ✅ | ✅ | ベクトル型は原子的 |
| simulations | ✅ | ✅ | ✅ | 計算属性はキャッシュ |
| predicted_reviews | ✅ | ✅ | ✅ | - |

**結論:** 全7テーブルが第3正規形（3NF）を満たしている。

---

## 非正規化の検討

### 許容した非正規化

1. **simulations.avgRating / conversionRate**
   - 理由: 10,000件のレビューからの毎回計算を避けるキャッシュ
   - 更新タイミング: シミュレーション完了時に1回のみ計算・保存

### 採用しなかった非正規化

1. **productsにcategoryNameを含める**
   - 理由: カテゴリ名変更時に全商品の更新が必要になる
   - 解決: JOIN で取得

2. **predicted_reviewsにcustomerNameを含める**
   - 理由: 10,000件×シミュレーション数のデータ冗長
   - 解決: 必要時にJOINで取得

---

## 関連ドキュメント

- [ER図](ER_DIAGRAM.md)
- [パフォーマンスチューニング](PERFORMANCE.md)
