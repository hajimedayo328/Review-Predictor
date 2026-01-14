import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// シミュレーション個別操作API
// DELETE /api/simulations/[simulationId]

interface RouteParams {
  params: {
    simulationId: string;
  };
}

// シミュレーション削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { simulationId } = params;

    if (!simulationId) {
      return NextResponse.json(
        { error: 'simulationId is required' },
        { status: 400 }
      );
    }

    // シミュレーションの存在確認
    const simulation = await prisma.simulation.findUnique({
      where: { id: simulationId },
      include: { product: true },
    });

    if (!simulation) {
      return NextResponse.json(
        { error: 'Simulation not found' },
        { status: 404 }
      );
    }

    // トランザクションで削除（CASCADE DELETEにより予測レビューも自動削除）
    await prisma.$transaction(async (tx) => {
      // シミュレーションを削除（predicted_reviewsはCASCADEで自動削除）
      await tx.simulation.delete({
        where: { id: simulationId },
      });

      // 関連する商品も削除（オプション）
      await tx.product.delete({
        where: { id: simulation.productId },
      });
    });

    console.log(`🗑️ Deleted simulation: ${simulationId}`);

    return NextResponse.json({
      success: true,
      message: 'Simulation deleted successfully',
      deletedId: simulationId,
    });
  } catch (error) {
    console.error('❌ Delete error:', error);

    return NextResponse.json(
      {
        error: 'Failed to delete simulation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// シミュレーション取得（オプション）
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { simulationId } = params;

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

    return NextResponse.json(simulation);
  } catch (error) {
    console.error('❌ Get simulation error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get simulation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
