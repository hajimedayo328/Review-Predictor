import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/simulations/recent
// 直近のシミュレーション一覧を取得
export async function GET(_request: NextRequest) {
  try {
    const simulations = await prisma.simulation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    const items = simulations.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      avgRating: s.avgRating ? Number(s.avgRating) : null,
      conversionRate: s.conversionRate ? Number(s.conversionRate) : null,
      status: s.status,
      product: {
        name: s.product.name,
        category: s.product.category.name,
      },
    }));

    return NextResponse.json({ simulations: items });
  } catch (error) {
    console.error('Recent simulations fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent simulations' },
      { status: 500 }
    );
  }
}



