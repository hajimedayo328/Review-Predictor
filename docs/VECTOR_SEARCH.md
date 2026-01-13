# ベクトル検索の仕組み

> このドキュメントはPhase 10で記述します。

## 概要

pgvectorを使用したベクトル類似度検索の実装について説明します。

## 使用技術

- **pgvector**: PostgreSQLのベクトル拡張
- **HNSW インデックス**: 高速近似最近傍探索
- **transformers.js**: テキストのベクトル化

## ベクトルの構成

### preferenceVector（384次元）
- 顧客の好みをテキスト埋め込みで表現
- all-MiniLM-L6-v2モデルを使用

### profileVector（5次元）
- 顧客の特性を数値で表現
- [価格敏感度, 品質重視度, デザイン重視度, ブランドロイヤリティ, レビュー厳しさ]

## 類似度計算

```sql
-- コサイン類似度
1 - (preference_vector <=> $1::vector) as similarity
```

## HNSWインデックス

TODO: インデックス設計の詳細を記述
