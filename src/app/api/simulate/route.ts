import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { textToEmbedding, vectorToString } from '@/features/vector/embedding';
import { searchSimilarCustomers } from '@/features/vector/search';
import { predictRatings } from '@/features/simulation/engine/predictor';
import { aggregateResults } from '@/features/simulation/engine/aggregator';
import { generateReviewText } from '@/features/simulation/engine/reviewGenerator';

// シミュレーション実行API
// POST /api/simulate

export const maxDuration = 300; // 5分（PDCA実行用）

interface SimulateRequest {
  description: string;
  productName?: string;
  price?: number;
  categoryId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SimulateRequest = await request.json();
    const { description, productName, price, categoryId } = body;

    // バリデーション
    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'description is required' },
        { status: 400 }
      );
    }

    if (description.length < 10) {
      return NextResponse.json(
        { error: 'description must be at least 10 characters' },
        { status: 400 }
      );
    }

    console.log('🚀 Starting simulation...');
    console.log(`   Description: ${description.substring(0, 50)}...`);

    // Step 1: テキストをベクトル化
    console.log('📊 Step 1: Generating embedding...');
    const embedding = await textToEmbedding(description);
    console.log(`   Embedding dimension: ${embedding.length}`);

    // Step 2: トランザクションでデータベース操作
    console.log('💾 Step 2: Creating database records...');

    const result = await prisma.$transaction(async (tx) => {
      // デフォルトの販売者とカテゴリを取得
      const defaultSeller = await tx.seller.findFirst();
      const defaultCategory = categoryId
        ? await tx.category.findUnique({ where: { id: categoryId } })
        : await tx.category.findFirst();

      if (!defaultSeller || !defaultCategory) {
        throw new Error('Default seller or category not found. Please run seed first.');
      }

      // 商品を作成（生SQLでベクトル挿入）
      const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await tx.$executeRawUnsafe(`
        INSERT INTO products (id, "sellerId", "categoryId", name, description, embedding, price, "createdAt", "updatedAt")
        VALUES (
          '${productId}',
          '${defaultSeller.id}',
          '${defaultCategory.id}',
          '${(productName || 'シミュレーション商品').replace(/'/g, "''")}',
          '${description.replace(/'/g, "''")}',
          '${vectorToString(embedding)}'::vector(384),
          ${price || 1000},
          NOW(),
          NOW()
        )
      `);

      // シミュレーションを作成
      const simulation = await tx.simulation.create({
        data: {
          productId,
          status: 'RUNNING',
        },
      });

      return { productId, simulationId: simulation.id };
    });

    console.log(`   Product ID: ${result.productId}`);
    console.log(`   Simulation ID: ${result.simulationId}`);

    // Step 3: ベクトル検索で類似顧客を取得
    console.log('🔍 Step 3: Searching similar customers...');
    const similarCustomers = await searchSimilarCustomers(embedding, 10000);
    console.log(`   Found ${similarCustomers.length} customers`);

    // Step 4: 各顧客の評価を予測
    console.log('⭐ Step 4: Predicting ratings...');
    const predictions = predictRatings(similarCustomers);

    // Step 5: 結果を集計
    console.log('📈 Step 5: Aggregating results...');
    const ratingsWithSegment = predictions.map((p, i) => ({
      ...p,
      segmentName: similarCustomers[i].segmentName,
    }));
    const summary = aggregateResults(ratingsWithSegment);

    // Step 6: レビューテキストを生成
    console.log('📝 Step 6: Generating review texts...');
    const reviewTexts = predictions.map((p, i) => {
      const customer = similarCustomers[i];
      return generateReviewText({
        rating: p.rating,
        segmentName: customer.segmentName,
        similarity: p.similarity,
        profileVector: customer.profileVector,
      });
    });

    // Step 7: PredictedReviewを一括挿入（レビューテキスト含む）
    console.log('💾 Step 7: Saving predicted reviews...');

    // バッチで挿入（1000件ずつ）
    const BATCH_SIZE = 1000;
    for (let i = 0; i < predictions.length; i += BATCH_SIZE) {
      const batch = predictions.slice(i, i + BATCH_SIZE);
      const values = batch.map((p, idx) => {
        const customer = similarCustomers[i + idx];
        const reviewText = reviewTexts[i + idx].replace(/'/g, "''"); // SQLエスケープ
        return `('pr_${Date.now()}_${i + idx}', '${result.simulationId}', '${customer.customerId}', ${p.rating}, ${p.similarity.toFixed(4)}, '${reviewText}', NOW())`;
      }).join(',');

      await prisma.$executeRawUnsafe(`
        INSERT INTO predicted_reviews (id, "simulationId", "customerId", rating, similarity, "reviewText", "createdAt")
        VALUES ${values}
      `);
    }

    // Step 8: シミュレーション結果を更新
    console.log('✅ Step 8: Finalizing simulation...');
    await prisma.simulation.update({
      where: { id: result.simulationId },
      data: {
        status: 'COMPLETED',
        avgRating: summary.avgRating,
        conversionRate: summary.conversionRate,
      },
    });

    console.log('🎉 Simulation completed!');
    console.log(`   Average Rating: ${summary.avgRating}`);
    console.log(`   Conversion Rate: ${summary.conversionRate}%`);

    return NextResponse.json({
      success: true,
      simulationId: result.simulationId,
      summary: {
        totalCustomers: summary.totalCustomers,
        avgRating: summary.avgRating,
        conversionRate: summary.conversionRate,
      },
    });
  } catch (error) {
    console.error('❌ Simulation error:', error);

    return NextResponse.json(
      {
        error: 'Simulation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
