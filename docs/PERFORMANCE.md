# パフォーマンスチューニング

> このドキュメントはPhase 10で記述します。

## 概要

EXPLAIN ANALYZEを使用したクエリ最適化の結果を記録します。

## インデックス設計

### HNSWインデックス（ベクトル検索用）
```sql
CREATE INDEX ON customers USING hnsw (preference_vector vector_cosine_ops);
```

### B-treeインデックス
- `customers.segment_id`
- `simulations.product_id`
- `predicted_reviews.simulation_id`

## EXPLAIN ANALYZE結果

TODO: 実行計画のスクリーンショットを追加

## パフォーマンス指標

| クエリ | 実行時間 | 最適化前 | 最適化後 |
|--------|---------|---------|---------|
| ベクトル検索（10,000件） | TODO | TODO | TODO |
| 結果集計 | TODO | TODO | TODO |

## 最適化のポイント

1. HNSWインデックスのパラメータ調整
2. バッチ挿入の活用
3. 不要なカラムの取得を避ける
