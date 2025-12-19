/**
 * デモ用セットアップスクリプト
 * 
 * 実行方法：
 * npx tsx demo-setup.ts
 * 
 * 内容：
 * 1. テスト用アイデアを3つ作成
 * 2. 各アイデアにモックレビューを生成
 * 3. 統計情報を表示
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// モックAI評価関数
function mockAIEvaluate(persona: any, idea: any) {
  let baseScore = 5 + Math.random() * 3; // 5-8の範囲
  
  // カテゴリマッチでボーナス
  if (persona.category === idea.category) {
    baseScore += 1;
  }
  
  // 年齢層による調整
  if (persona.age < 30 && idea.title.includes('AI')) {
    baseScore += 1;
  }
  if (persona.age > 50 && (idea.title.includes('シンプル') || idea.title.includes('簡単'))) {
    baseScore += 0.5;
  }
  
  const score = Math.min(10, Math.max(1, Math.round(baseScore)));
  const willBuy = score >= 7 ? Math.random() > 0.3 : Math.random() > 0.7;
  
  const comments = [
    `${idea.title}は${persona.name}にとって魅力的です。`,
    `このアイデアは私のニーズに合っています。`,
    `興味深いコンセプトだと思います。`,
    `もう少し具体的な説明が欲しいです。`,
    `価格が気になります。`,
  ];
  
  const comment = comments[Math.floor(Math.random() * comments.length)] + ` スコア: ${score}/10`;
  
  const suggestions = [
    `ターゲット層を${persona.occupation}向けにもっと明確にすると良いでしょう。`,
    `価格設定を${persona.age}代の予算感に合わせると受け入れられやすいです。`,
    `UIをもっとシンプルにすることをお勧めします。`,
  ];
  
  const improvementSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
  
  const pricePerceptions = ['安い', '適切', '高い', 'わからない'];
  const pricePerception = pricePerceptions[Math.floor(Math.random() * pricePerceptions.length)];
  
  const trustLevel = Math.round(3 + Math.random() * 2); // 3-5
  
  return {
    score,
    willBuy,
    comment,
    improvementSuggestion,
    pricePerception,
    trustLevel,
  };
}

// テスト用アイデア
const testIdeas = [
  {
    title: 'AI家計簿アプリ「スマート・マネー」',
    description: `レシートをスマホで撮影するだけで自動で支出を記録。
AIが家計のムダを分析し、節約アドバイスを提供。
月額500円で利用可能。

【特徴】
- OCRによるレシート自動読み取り
- カテゴリ別支出分析
- 節約目標設定＆達成サポート
- 家族で共有可能`,
    category: 'Standard_Japan',
    targetAudience: '20代〜40代の家計管理を効率化したい方',
  },
  {
    title: 'AI翻訳機能付き観光マップアプリ',
    description: `訪日外国人向けの観光マップアプリ。
リアルタイムAI翻訳で言語の壁を解消。
オフラインでも利用可能。

【特徴】
- 多言語対応（英語、中国語、韓国語など）
- AR機能で観光スポットを案内
- 緊急時の医療機関検索
- 地元グルメレコメンド`,
    category: 'Inbound_Tourist',
    targetAudience: '訪日外国人観光客',
  },
  {
    title: 'スタートアップ向けプロジェクト管理ツール',
    description: `少人数チーム向けのシンプルなプロジェクト管理ツール。
タスク管理、ドキュメント共有、コミュニケーションを一元化。
月額3,000円〜。

【特徴】
- 直感的なUIで即座に使い始められる
- Slack、GitHub連携
- ガントチャート自動生成
- タイムトラッキング機能`,
    category: 'Biz_Tech',
    targetAudience: '5人以下のスタートアップチーム',
  },
];

async function main() {
  console.log('🚀 デモセットアップを開始します...\n');
  
  // 既存のレビューとアイデアをクリア
  console.log('📝 既存データをクリア中...');
  await prisma.review.deleteMany();
  await prisma.idea.deleteMany();
  console.log('✅ クリア完了\n');
  
  // テストアイデアを作成
  console.log('💡 テストアイデアを作成中...');
  for (const ideaData of testIdeas) {
    const idea = await prisma.idea.create({
      data: ideaData,
    });
    
    console.log(`  ✅ 作成: ${idea.title} (ID: ${idea.id})`);
    
    // ペルソナを取得
    const personas = await prisma.persona.findMany({
      where: { category: ideaData.category },
    });
    
    console.log(`  👥 ${personas.length}人のペルソナがレビュー中...`);
    
    // レビューを生成
    for (const persona of personas) {
      const evaluation = mockAIEvaluate(persona, idea);
      
      await prisma.review.create({
        data: {
          ideaId: idea.id,
          personaId: persona.id,
          score: evaluation.score,
          willBuy: evaluation.willBuy,
          comment: evaluation.comment,
          improvementSuggestion: evaluation.improvementSuggestion,
          pricePerception: evaluation.pricePerception,
          trustLevel: evaluation.trustLevel,
        },
      });
    }
    
    // 統計情報を計算
    const reviews = await prisma.review.findMany({
      where: { ideaId: idea.id },
    });
    
    const avgScore = (reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length).toFixed(1);
    const buyCount = reviews.filter((r) => r.willBuy).length;
    const buyRate = ((buyCount / reviews.length) * 100).toFixed(0);
    
    console.log(`  📊 統計: 平均${avgScore}点 | 購入意向${buyRate}% (${buyCount}/${reviews.length}人)\n`);
  }
  
  console.log('✨ セットアップ完了！\n');
  console.log('🌐 次のステップ：');
  console.log('  1. ブラウザで http://localhost:3000 を開く');
  console.log('  2. 「最近のアイデア」セクションで3つのアイデアを確認');
  console.log('  3. 各アイデアをクリックしてレポートページを確認\n');
  console.log('📊 Prisma Studioで確認：');
  console.log('  npx prisma studio\n');
}

main()
  .catch((e) => {
    console.error('❌ エラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
