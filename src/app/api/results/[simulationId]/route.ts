import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 結果取得API
// GET /api/results/:simulationId

interface RouteParams {
  params: {
    simulationId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { simulationId } = params;

    if (!simulationId) {
      return NextResponse.json(
        { error: 'simulationId is required' },
        { status: 400 }
      );
    }

    // シミュレーションを取得
    const simulation = await prisma.simulation.findUnique({
      where: { id: simulationId },
      include: {
        product: {
          include: {
            category: true,
            seller: true,
          },
        },
      },
    });

    if (!simulation) {
      return NextResponse.json(
        { error: 'Simulation not found' },
        { status: 404 }
      );
    }

    // 予測レビューを集計
    const ratingCounts = await prisma.$queryRaw<{ rating: number; count: bigint }[]>`
      SELECT rating, COUNT(*) as count
      FROM predicted_reviews
      WHERE "simulationId" = ${simulationId}
      GROUP BY rating
      ORDER BY rating
    `;

    // セグメント別集計（分布も含む）
    const segmentStats = await prisma.$queryRaw<{
      segmentName: string;
      avgRating: number;
      customerCount: bigint;
      star1: number;
      star2: number;
      star3: number;
      star4: number;
      star5: number;
    }[]>`
      SELECT
        s.name as "segmentName",
        AVG(pr.rating) as "avgRating",
        COUNT(pr.id) as "customerCount",
        SUM(CASE WHEN pr.rating = 1 THEN 1 ELSE 0 END)::float / COUNT(pr.id) * 100 as "star1",
        SUM(CASE WHEN pr.rating = 2 THEN 1 ELSE 0 END)::float / COUNT(pr.id) * 100 as "star2",
        SUM(CASE WHEN pr.rating = 3 THEN 1 ELSE 0 END)::float / COUNT(pr.id) * 100 as "star3",
        SUM(CASE WHEN pr.rating = 4 THEN 1 ELSE 0 END)::float / COUNT(pr.id) * 100 as "star4",
        SUM(CASE WHEN pr.rating = 5 THEN 1 ELSE 0 END)::float / COUNT(pr.id) * 100 as "star5"
      FROM predicted_reviews pr
      JOIN customers c ON pr."customerId" = c.id
      JOIN segments s ON c."segmentId" = s.id
      WHERE pr."simulationId" = ${simulationId}
      GROUP BY s.name
      ORDER BY s.name
    `;

    // 類似度分布（ヒストグラム用）
    const similarityDistribution = await prisma.$queryRaw<{
      bucket: number;
      count: bigint;
    }[]>`
      SELECT
        FLOOR(similarity * 10) / 10.0 as bucket,
        COUNT(*) as count
      FROM predicted_reviews
      WHERE "simulationId" = ${simulationId}
      GROUP BY bucket
      ORDER BY bucket
    `;

    // サンプルレビュー（各評価から数件ずつ）
    const sampleReviews = await prisma.$queryRaw<{
      rating: number;
      reviewText: string | null;
      similarity: number;
      segmentName: string;
    }[]>`
      SELECT DISTINCT ON (pr.rating)
        pr.rating,
        pr."reviewText",
        pr.similarity,
        s.name as "segmentName"
      FROM predicted_reviews pr
      JOIN customers c ON pr."customerId" = c.id
      JOIN segments s ON c."segmentId" = s.id
      WHERE pr."simulationId" = ${simulationId}
        AND pr."reviewText" IS NOT NULL
      ORDER BY pr.rating, RANDOM()
      LIMIT 10
    `;

    // 評価分布を計算
    const totalReviews = ratingCounts.reduce((sum, r) => sum + Number(r.count), 0);
    const distribution = {
      star1: 0,
      star2: 0,
      star3: 0,
      star4: 0,
      star5: 0,
    };

    for (const { rating, count } of ratingCounts) {
      const percentage = totalReviews > 0 ? (Number(count) / totalReviews) * 100 : 0;
      switch (rating) {
        case 1: distribution.star1 = Math.round(percentage * 100) / 100; break;
        case 2: distribution.star2 = Math.round(percentage * 100) / 100; break;
        case 3: distribution.star3 = Math.round(percentage * 100) / 100; break;
        case 4: distribution.star4 = Math.round(percentage * 100) / 100; break;
        case 5: distribution.star5 = Math.round(percentage * 100) / 100; break;
      }
    }

    // レスポンスを構築
    return NextResponse.json({
      simulation: {
        id: simulation.id,
        status: simulation.status,
        avgRating: simulation.avgRating ? Number(simulation.avgRating) : null,
        conversionRate: simulation.conversionRate ? Number(simulation.conversionRate) : null,
        createdAt: simulation.createdAt,
      },
      product: {
        id: simulation.product.id,
        name: simulation.product.name,
        description: simulation.product.description,
        price: Number(simulation.product.price),
        category: simulation.product.category.name,
        seller: simulation.product.seller.name,
      },
      distribution,
      segments: segmentStats.map(s => ({
        name: s.segmentName,
        avgRating: Math.round(Number(s.avgRating) * 100) / 100,
        customerCount: Number(s.customerCount),
        distribution: {
          star1: Math.round(Number(s.star1) * 100) / 100,
          star2: Math.round(Number(s.star2) * 100) / 100,
          star3: Math.round(Number(s.star3) * 100) / 100,
          star4: Math.round(Number(s.star4) * 100) / 100,
          star5: Math.round(Number(s.star5) * 100) / 100,
        },
      })),
      similarityDistribution: similarityDistribution.map(s => ({
        bucket: Number(s.bucket),
        count: Number(s.count),
      })),
      sampleReviews: sampleReviews.map(r => ({
        rating: r.rating,
        reviewText: r.reviewText || '',
        similarity: Number(r.similarity),
        segmentName: r.segmentName,
      })),
      totalReviews,
    });
  } catch (error) {
    console.error('Results fetch error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch results',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
