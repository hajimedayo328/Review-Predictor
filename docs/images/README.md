# 図解の生成方法

このフォルダに以下の画像を配置してください。

## 必要な画像

1. **system-overview.png** - システム概要図
2. （必要に応じて追加）

## Mermaidから画像を生成する方法

### 方法1: Mermaid Live Editor（推奨）

1. https://mermaid.live/ にアクセス
2. 下記のMermaidコードを貼り付け
3. 右上の「PNG」または「SVG」ボタンでダウンロード
4. このフォルダに `system-overview.png` として保存

### 方法2: VS Code拡張機能

1. VS Codeに「Mermaid Markdown」拡張をインストール
2. .mdファイル内でプレビュー表示
3. 右クリック→「画像としてエクスポート」

---

## システム概要図のMermaidコード

```mermaid
graph TB
    subgraph User["ユーザー"]
        A[商品説明を入力]
    end

    subgraph Frontend["フロントエンド"]
        B[入力画面<br/>/input]
        C[結果画面<br/>/result]
    end

    subgraph Backend["バックエンド API"]
        D[POST /api/simulate]
        E[GET /api/results/:id]
    end

    subgraph Engine["シミュレーションエンジン"]
        F[Embedder<br/>テキスト→384次元ベクトル]
        G[類似度検索<br/>pgvector HNSW]
        H[Predictor<br/>評価予測]
        I[ReviewGenerator<br/>レビュー生成]
    end

    subgraph Database["PostgreSQL + pgvector"]
        J[(customers<br/>10,000人)]
        K[(products)]
        L[(simulations)]
        M[(predicted_reviews)]
    end

    A --> B
    B -->|商品説明文| D
    D --> F
    F -->|ベクトル| G
    G -->|類似顧客| J
    J --> H
    H --> I
    I -->|結果保存| L
    I -->|10,000件| M
    C -->|取得| E
    E --> L
    E --> M
    D -->|完了| C

    style A fill:#e1f5fe
    style J fill:#fff3e0
    style L fill:#e8f5e9
    style M fill:#e8f5e9
```

---

## ER図のMermaidコード

```mermaid
erDiagram
    sellers ||--o{ products : "出品"
    categories ||--o{ products : "分類"
    segments ||--o{ customers : "所属"
    products ||--o{ simulations : "対象"
    simulations ||--o{ predicted_reviews : "生成"
    customers ||--o{ predicted_reviews : "評価"

    sellers {
        int id PK
        string name
        string email UK
    }

    categories {
        int id PK
        string name UK
        string description
    }

    products {
        int id PK
        int sellerId FK
        int categoryId FK
        string name
        text description
        decimal price
        vector384 embedding
    }

    segments {
        int id PK
        string name UK
        string description
    }

    customers {
        int id PK
        int segmentId FK
        string name
        vector5 profileVector
        vector384 preferenceVector
    }

    simulations {
        int id PK
        int productId FK
        enum status
        decimal avgRating
        decimal conversionRate
        datetime createdAt
    }

    predicted_reviews {
        int id PK
        int simulationId FK
        int customerId FK
        int rating
        decimal similarity
        text reviewText
    }
```

---

## データフローのMermaidコード

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as フロントエンド
    participant A as API
    participant E as Embedder
    participant DB as PostgreSQL

    U->>F: 商品説明を入力
    F->>A: POST /api/simulate
    A->>E: テキスト→ベクトル変換
    E-->>A: 384次元ベクトル
    A->>DB: 商品レコード作成
    A->>DB: シミュレーション作成
    A->>DB: 類似度検索（HNSW）
    DB-->>A: 10,000人の顧客
    loop 各顧客
        A->>A: 評価予測
        A->>A: レビュー生成
    end
    A->>DB: バッチINSERT（1000件×10）
    A->>DB: 統計更新
    A-->>F: simulationId
    F->>F: /result/:id へリダイレクト
    F->>A: GET /api/results/:id
    A->>DB: 結果取得
    DB-->>A: 統計・レビュー
    A-->>F: JSON
    F-->>U: 結果表示
```
