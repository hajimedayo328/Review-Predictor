# 📊 評価システム詳細設計

## 🎯 評価の構造

各ペルソナは、アイデアを**多角的に評価**します。

---

## 📐 評価項目

### 1. **総合スコア** (`score: Int`)

**範囲**: 1-10点

| スコア | 評価 | 意味 |
|--------|------|------|
| 9-10 | 🌟 素晴らしい | 即座に購入したい・投資したい |
| 7-8 | 👍 良い | 興味があり、条件次第で購入 |
| 5-6 | 😐 普通 | 悪くないが、もう少し改善が必要 |
| 3-4 | 👎 イマイチ | 大幅な改善が必要 |
| 1-2 | ❌ 悪い | このままでは購入しない |

**計算方法（AIプロンプト例）**:
```
以下の観点から総合的に評価してください：
• 自分にとっての有用性 (30%)
• 価格と価値のバランス (25%)
• 実現可能性・信頼性 (20%)
• 独自性・差別化 (15%)
• 使いやすさ (10%)

最終スコア = 加重平均
```

---

### 2. **購入意向** (`willBuy: Boolean`)

**true**: このペルソナは購入する可能性が高い  
**false**: このペルソナは購入しない可能性が高い

**判定基準**:
- `score >= 7.0` → 通常は `willBuy = true`
- `score < 7.0` → 通常は `willBuy = false`

ただし、ペルソナの特性により例外あり：
- 慎重な性格 → スコア8以上でも `false` の場合も
- 衝動買いタイプ → スコア6でも `true` の場合も

---

### 3. **コメント** (`comment: String`)

**形式**: 自然言語（200-500文字程度）

**内容**:
- 良い点
- 懸念点
- 期待すること
- 個人的な感想

**例**:
```
「40代会社員として、この家計簿アプリは非常に魅力的です。
レシート自動読み取り機能は忙しい私にとって大きな価値があります。
ただし、月額500円は少し高く感じます。無料プランがあれば試したいです。
また、銀行口座との連携機能があるとさらに便利だと思います。」
```

---

### 4. **改善提案** (`improvementSuggestion: String`)

**形式**: 具体的な改善アクション（3-5項目）

**内容**:
- 機能追加の提案
- UI/UXの改善
- 価格設定の見直し
- ターゲット層の調整
- マーケティング戦略

**例**:
```
• 無料プランを追加し、基本機能のみ提供
• 銀行口座連携機能を実装
• 月額500円 → 380円に値下げ
• 家族での共有機能を追加
• 節約目標の達成度をグラフ化
```

---

### 5. **価格認識** (`pricePerception: String?`)

**オプション項目**

**選択肢**:
- `"非常に安い"` - 期待以上にお得
- `"安い"` - リーズナブル
- `"適正"` - 妥当な価格
- `"やや高い"` - 少し高く感じる
- `"高い"` - 購入を躊躇する価格
- `"非常に高い"` - 高すぎて購入不可

**判定基準**:
```typescript
if (score >= 8 && willBuy) return "適正" または "安い";
if (score >= 6 && !willBuy) return "やや高い";
if (score < 5) return "高い" または "非常に高い";
```

---

### 6. **信頼レベル** (`trustLevel: Int?`)

**オプション項目**

**範囲**: 1-10点

| レベル | 評価 | 意味 |
|--------|------|------|
| 9-10 | 🔒 完全に信頼 | 個人情報を預けても問題ない |
| 7-8 | ✅ 信頼できる | 一般的な利用は問題ない |
| 5-6 | 🤔 やや不安 | 慎重に使用する |
| 3-4 | ⚠️ 不安 | セキュリティに懸念 |
| 1-2 | ❌ 信頼できない | 使用を避けたい |

**影響要因**:
- 企業・サービスの実績
- セキュリティ対策の説明
- プライバシーポリシーの明確さ
- 口コミ・レビュー（想定）

---

## 🤖 AI評価生成のプロンプト設計

### システムプロンプト

```
あなたは以下のペルソナです：

名前: ${persona.name}
年齢: ${persona.age}歳
性別: ${persona.gender}
職業: ${persona.occupation}
年収: ${persona.annualIncome}円
性格: ${persona.personality}
趣味: ${persona.hobbies}
課題: ${persona.challenges}
購買行動: ${persona.buyingBehavior}

このペルソナになりきって、ビジネスアイデアを評価してください。
あなた自身の価値観、経済状況、ライフスタイルに基づいて判断してください。
```

### ユーザープロンプト

```
以下のビジネスアイデアを評価してください：

【タイトル】
${idea.title}

【説明】
${idea.description}

【ターゲット層】
${idea.targetAudience}

${idea.expectedPrice ? `【想定価格】${idea.expectedPrice}円` : ''}

以下のJSON形式で返してください：

{
  "score": 1-10の整数,
  "comment": "200-500文字の詳細コメント",
  "willBuy": true/false,
  "improvementSuggestion": "具体的な改善提案（箇条書き3-5項目）",
  "pricePerception": "非常に安い/安い/適正/やや高い/高い/非常に高い",
  "trustLevel": 1-10の整数
}

重要:
- あなた自身の価値観で正直に評価してください
- 良い点と悪い点の両方を指摘してください
- 具体的で実行可能な改善提案をしてください
- scoreとwillBuyは必ずしも連動しません（例: 良いが自分には不要 → score 7, willBuy false）
```

---

## 📈 評価の集計・分析

### 1. 平均スコア

```typescript
const avgScore = reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length;
```

**目標値**:
- 8.0以上: 🌟 市場投入可能
- 7.0-7.9: 👍 改善後に投入
- 6.0-6.9: 😐 大幅な改善が必要
- 6.0未満: 👎 コンセプトの見直し推奨

### 2. 購入意向率

```typescript
const buyCount = reviews.filter(r => r.willBuy).length;
const buyRate = (buyCount / reviews.length) * 100;
```

**目標値**:
- 70%以上: 🎯 非常に有望
- 50-69%: ✅ 有望
- 30-49%: 🤔 ニッチ市場向け
- 30%未満: ⚠️ 市場性に課題

### 3. スコア分布

```typescript
const distribution = {
  excellent: reviews.filter(r => r.score >= 9).length,  // 9-10
  good: reviews.filter(r => r.score >= 7 && r.score < 9).length,  // 7-8
  average: reviews.filter(r => r.score >= 5 && r.score < 7).length,  // 5-6
  poor: reviews.filter(r => r.score < 5).length,  // 1-4
};
```

### 4. 価格認識の分布

```typescript
const pricePerception = {
  tooExpensive: reviews.filter(r => r.pricePerception?.includes('非常に高い') || r.pricePerception?.includes('高い')).length,
  fair: reviews.filter(r => r.pricePerception === '適正').length,
  cheap: reviews.filter(r => r.pricePerception?.includes('安い')).length,
};
```

### 5. 改善提案の頻出ワード

```typescript
const allSuggestions = reviews.map(r => r.improvementSuggestion).join('\n');
const keywords = extractKeywords(allSuggestions);
// 例: ["価格", "機能追加", "UI改善", "無料プラン"] など
```

---

## 🎨 UI表示例

### レポートページ

```
┌─────────────────────────────────┐
│ 📊 評価結果                     │
├─────────────────────────────────┤
│ 総合スコア: 7.8 / 10            │
│ ⭐⭐⭐⭐⭐⭐⭐⭐☆☆           │
│                                 │
│ 購入意向: 6/10人 (60%)          │
│ 信頼レベル: 平均 7.2            │
│ 価格認識: 適正 (50%)            │
│          やや高い (30%)         │
│          安い (20%)             │
├─────────────────────────────────┤
│ 📈 スコア分布                   │
│ 9-10点: ████ (2人)              │
│ 7-8点:  ████████ (5人)          │
│ 5-6点:  ████ (2人)              │
│ 1-4点:  ██ (1人)                │
└─────────────────────────────────┘
```

### ペルソナカード（詳細）

```
┌─────────────────────────────────┐
│ 👤 山田太郎 (35歳・男性)        │
│ 会社員 / 年収600万円            │
├─────────────────────────────────┤
│ スコア: 8.5 / 10 ⭐⭐⭐⭐⭐⭐⭐⭐☆☆ │
│ 購入意向: ✅ Yes                │
│ 価格認識: 適正                  │
│ 信頼レベル: 8 / 10              │
├─────────────────────────────────┤
│ 💬 コメント                     │
│ 「40代会社員として...」         │
├─────────────────────────────────┤
│ 💡 改善提案                     │
│ • 無料プランを追加              │
│ • 銀行口座連携を実装            │
│ • 月額を380円に値下げ           │
└─────────────────────────────────┘
```

---

## 🔄 PDCA サイクルでの活用

### 改善のトリガー

```typescript
// スコアが低い項目を優先的に改善
if (avgScore < 7.0) {
  // 低評価の理由を分析
  const lowScoreReasons = reviews
    .filter(r => r.score < 7)
    .map(r => r.improvementSuggestion);
  
  // AIに改善案を生成させる
  generateImprovement(lowScoreReasons);
}

// 購入意向率が低い場合
if (buyRate < 50%) {
  // 価格設定を見直す
  if (priceExpensive > 50%) {
    suggestPriceReduction();
  }
}
```

---

## 📊 データベースクエリ例

### 1. 高評価レビューのみ取得

```sql
SELECT * FROM reviews
WHERE score >= 8
ORDER BY score DESC;
```

### 2. 購入意向者の平均スコア

```sql
SELECT AVG(score) as avg_score
FROM reviews
WHERE willBuy = true;
```

### 3. スコア分布の集計

```sql
SELECT 
  CASE 
    WHEN score >= 9 THEN '9-10'
    WHEN score >= 7 THEN '7-8'
    WHEN score >= 5 THEN '5-6'
    ELSE '1-4'
  END as score_range,
  COUNT(*) as count
FROM reviews
GROUP BY score_range
ORDER BY score_range DESC;
```

### 4. 価格認識の集計

```sql
SELECT 
  pricePerception,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reviews), 1) as percentage
FROM reviews
WHERE pricePerception IS NOT NULL
GROUP BY pricePerception
ORDER BY count DESC;
```

---

## 🎯 評価システムの拡張案

### Phase 1（現在実装済み）
- ✅ 総合スコア（1-10）
- ✅ 購入意向（Yes/No）
- ✅ コメント
- ✅ 改善提案
- ✅ 価格認識
- ✅ 信頼レベル

### Phase 2（将来の拡張）
- [ ] カテゴリ別スコア
  - 機能性スコア
  - デザインスコア
  - 価格スコア
  - 独自性スコア
- [ ] 感情分析
  - ポジティブ/ネガティブ判定
  - 感情の強度
- [ ] 競合比較
  - 類似サービスとの比較評価
- [ ] シェア意向
  - SNSで共有したいか
  - 友人に勧めたいか

---

## 📝 まとめ

Market Mirrorの評価システムは：

1. ✅ **多角的評価** - 点数だけでなく、購入意向、コメント、改善提案など
2. ✅ **ペルソナベース** - 各ペルソナの価値観を反映
3. ✅ **定量+定性** - 数値データと自然言語の両方
4. ✅ **改善指向** - 次のPDCAサイクルに活用
5. ✅ **完全記録** - すべての評価をDBに保存

---

作成日: 2025-12-19
