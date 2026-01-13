// Review Predictor - Seed Data
// 10,000人の仮想顧客プロファイルを生成

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 正規分布でランダムな値を生成（Box-Muller変換）
function normalRandom(mean: number = 0.5, stdDev: number = 0.2): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  let value = mean + z * stdDev;
  // 0-1の範囲にクリップ
  return Math.max(0, Math.min(1, value));
}

// 384次元のランダムベクトルを生成（正規化済み）
function generateRandomVector(dimension: number): number[] {
  const vector = Array.from({ length: dimension }, () => Math.random() - 0.5);
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return vector.map(v => v / norm);
}

// 日本人の名前を生成
function generateJapaneseName(index: number): string {
  const lastNames = [
    '佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤',
    '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水',
    '山崎', '森', '池田', '橋本', '阿部', '石川', '山下', '中島', '石井', '小川',
    '前田', '岡田', '長谷川', '藤田', '後藤', '近藤', '村上', '遠藤', '青木', '坂本',
    '斉藤', '福田', '太田', '西村', '藤井', '金子', '岡本', '藤原', '三浦', '中野'
  ];
  const firstNames = [
    '太郎', '花子', '一郎', '次郎', '三郎', '美咲', '陽菜', '葵', '結衣', '咲良',
    '蓮', '湊', '大翔', '悠真', '樹', '陽向', '芽依', '凛', '杏', '紬',
    '健太', '翔太', '拓也', '大輔', '雄太', '達也', '恵', '優子', '美香', '真由美'
  ];

  const lastName = lastNames[index % lastNames.length];
  const firstName = firstNames[Math.floor(index / lastNames.length) % firstNames.length];
  return `${lastName} ${firstName}`;
}

// セグメントごとのプロファイル傾向を定義
const segmentProfiles = {
  'Price Sensitive': { priceMean: 0.8, qualityMean: 0.3, designMean: 0.3, brandMean: 0.2, strictMean: 0.6 },
  'Quality Focused': { priceMean: 0.3, qualityMean: 0.8, designMean: 0.5, brandMean: 0.5, strictMean: 0.7 },
  'Design Lovers': { priceMean: 0.4, qualityMean: 0.5, designMean: 0.8, brandMean: 0.6, strictMean: 0.5 },
  'Brand Loyal': { priceMean: 0.2, qualityMean: 0.6, designMean: 0.5, brandMean: 0.8, strictMean: 0.4 },
};

async function main() {
  console.log('🌱 Review Predictor シードデータ投入開始...\n');

  // 既存データをクリア
  console.log('🗑️  既存データをクリア中...');
  await prisma.predictedReview.deleteMany();
  await prisma.simulation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.segment.deleteMany();
  await prisma.category.deleteMany();
  await prisma.seller.deleteMany();

  // カテゴリを作成
  console.log('📁 カテゴリを作成中...');
  const categories = await Promise.all([
    prisma.category.create({ data: { name: '家電', description: '家庭用電化製品' } }),
    prisma.category.create({ data: { name: 'ファッション', description: '衣料品・アクセサリー' } }),
    prisma.category.create({ data: { name: '食品', description: '食料品・飲料' } }),
    prisma.category.create({ data: { name: '美容', description: '化粧品・スキンケア' } }),
    prisma.category.create({ data: { name: '書籍', description: '本・雑誌・電子書籍' } }),
  ]);
  console.log(`   ✅ ${categories.length}カテゴリ作成完了`);

  // セグメントを作成
  console.log('👥 セグメントを作成中...');
  const segments = await Promise.all([
    prisma.segment.create({ data: { name: 'Price Sensitive', description: '価格に敏感な顧客層' } }),
    prisma.segment.create({ data: { name: 'Quality Focused', description: '品質重視の顧客層' } }),
    prisma.segment.create({ data: { name: 'Design Lovers', description: 'デザイン重視の顧客層' } }),
    prisma.segment.create({ data: { name: 'Brand Loyal', description: 'ブランド重視の顧客層' } }),
  ]);
  console.log(`   ✅ ${segments.length}セグメント作成完了`);

  // デフォルト販売者を作成
  console.log('🏪 デフォルト販売者を作成中...');
  const defaultSeller = await prisma.seller.create({
    data: {
      name: 'システム販売者',
      email: 'system@review-predictor.local',
    },
  });
  console.log(`   ✅ 販売者作成完了`);

  // 10,000人の顧客を作成
  console.log('👤 10,000人の顧客を作成中...');
  const TOTAL_CUSTOMERS = 10000;
  const CUSTOMERS_PER_SEGMENT = 2500;
  const BATCH_SIZE = 500;

  let customerCount = 0;

  for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
    const segment = segments[segmentIndex];
    const profile = segmentProfiles[segment.name as keyof typeof segmentProfiles];

    console.log(`   📊 ${segment.name}セグメント (${CUSTOMERS_PER_SEGMENT}人)...`);

    for (let batch = 0; batch < CUSTOMERS_PER_SEGMENT / BATCH_SIZE; batch++) {
      const customers = [];

      for (let i = 0; i < BATCH_SIZE; i++) {
        const globalIndex = customerCount + i;
        const name = generateJapaneseName(globalIndex);

        // セグメントの傾向に基づいてプロファイルベクトルを生成
        const profileVector = [
          normalRandom(profile.priceMean, 0.15),    // 価格敏感度
          normalRandom(profile.qualityMean, 0.15),  // 品質重視度
          normalRandom(profile.designMean, 0.15),   // デザイン重視度
          normalRandom(profile.brandMean, 0.15),    // ブランドロイヤリティ
          normalRandom(profile.strictMean, 0.15),   // レビュー厳しさ
        ];

        // 384次元の好みベクトルを生成
        const preferenceVector = generateRandomVector(384);

        customers.push({
          segmentId: segment.id,
          name,
          profileVector: `[${profileVector.join(',')}]`,
          preferenceVector: `[${preferenceVector.join(',')}]`,
        });
      }

      // 生SQLでバッチ挿入（Unsupported型のため）
      for (const customer of customers) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO customers (id, "segmentId", name, "profileVector", "preferenceVector", "createdAt")
          VALUES (
            gen_random_uuid()::text,
            '${customer.segmentId}',
            '${customer.name.replace(/'/g, "''")}',
            '${customer.profileVector}'::vector(5),
            '${customer.preferenceVector}'::vector(384),
            NOW()
          )
        `);
      }

      customerCount += BATCH_SIZE;
      process.stdout.write(`      ${customerCount}/${TOTAL_CUSTOMERS} 完了\r`);
    }
  }

  console.log(`\n   ✅ ${TOTAL_CUSTOMERS}人の顧客作成完了`);

  // HNSWインデックスを作成
  console.log('🔍 ベクトル検索用インデックスを作成中...');
  try {
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS customers_preference_vector_idx
      ON customers
      USING hnsw (preference_vector vector_cosine_ops)
    `);
    console.log('   ✅ HNSWインデックス作成完了');
  } catch (error) {
    console.log('   ⚠️  インデックスは既に存在するか、作成できませんでした');
  }

  // 統計情報を表示
  console.log('\n📊 シードデータ統計:');
  const stats = await Promise.all([
    prisma.category.count(),
    prisma.segment.count(),
    prisma.seller.count(),
    prisma.customer.count(),
  ]);

  console.log(`   カテゴリ: ${stats[0]}`);
  console.log(`   セグメント: ${stats[1]}`);
  console.log(`   販売者: ${stats[2]}`);
  console.log(`   顧客: ${stats[3]}`);

  console.log('\n✅ シードデータ投入完了！');
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

