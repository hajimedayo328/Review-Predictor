// ベクトル検索ユーティリティ
// pgvectorを使用した類似度検索

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface SimilarCustomer {
  customerId: string;
  customerName: string;
  segmentId: string;
  segmentName: string;
  similarity: number;
  profileVector: number[];
}

/**
 * 商品embeddingと顧客preferenceVectorのコサイン類似度を計算し、
 * 全顧客を類似度順で取得する
 * @param embedding 商品の384次元ベクトル
 * @param limit 取得する顧客数（デフォルト: 10000）
 * @returns 類似度順の顧客リスト
 */
export async function searchSimilarCustomers(
  embedding: number[],
  limit: number = 10000
): Promise<SimilarCustomer[]> {
  const vectorString = `[${embedding.join(',')}]`;

  // pgvectorのコサイン距離演算子（<=>）を使用
  // 1 - distance = similarity
  const results = await prisma.$queryRaw<SimilarCustomer[]>`
    SELECT
      c.id as "customerId",
      c.name as "customerName",
      c."segmentId",
      s.name as "segmentName",
      (1 - (c."preferenceVector" <=> ${vectorString}::vector(384))) as similarity,
      c."profileVector"::text as "profileVectorStr"
    FROM customers c
    JOIN segments s ON c."segmentId" = s.id
    ORDER BY c."preferenceVector" <=> ${vectorString}::vector(384)
    LIMIT ${limit}
  `;

  // profileVectorを数値配列に変換
  return results.map(r => ({
    ...r,
    profileVector: parseVectorString((r as any).profileVectorStr),
  }));
}

/**
 * 特定のセグメントの顧客のみを検索
 * @param embedding 商品の384次元ベクトル
 * @param segmentId セグメントID
 * @param limit 取得する顧客数
 * @returns 類似度順の顧客リスト
 */
export async function searchSimilarCustomersBySegment(
  embedding: number[],
  segmentId: string,
  limit: number = 2500
): Promise<SimilarCustomer[]> {
  const vectorString = `[${embedding.join(',')}]`;

  const results = await prisma.$queryRaw<SimilarCustomer[]>`
    SELECT
      c.id as "customerId",
      c.name as "customerName",
      c."segmentId",
      s.name as "segmentName",
      (1 - (c."preferenceVector" <=> ${vectorString}::vector(384))) as similarity,
      c."profileVector"::text as "profileVectorStr"
    FROM customers c
    JOIN segments s ON c."segmentId" = s.id
    WHERE c."segmentId" = ${segmentId}
    ORDER BY c."preferenceVector" <=> ${vectorString}::vector(384)
    LIMIT ${limit}
  `;

  return results.map(r => ({
    ...r,
    profileVector: parseVectorString((r as any).profileVectorStr),
  }));
}

/**
 * ベクトル文字列を数値配列に変換
 * "[0.1,0.2,0.3]" -> [0.1, 0.2, 0.3]
 */
function parseVectorString(vectorStr: string): number[] {
  if (!vectorStr) return [];
  // "[" と "]" を除去してカンマで分割
  const cleaned = vectorStr.replace(/^\[|\]$/g, '');
  return cleaned.split(',').map(s => parseFloat(s.trim()));
}

/**
 * 顧客の統計情報を取得
 */
export async function getCustomerStats(): Promise<{
  total: number;
  bySegment: { segmentName: string; count: number }[];
}> {
  const total = await prisma.customer.count();

  const bySegment = await prisma.$queryRaw<{ segmentName: string; count: bigint }[]>`
    SELECT s.name as "segmentName", COUNT(c.id) as count
    FROM customers c
    JOIN segments s ON c."segmentId" = s.id
    GROUP BY s.name
    ORDER BY s.name
  `;

  return {
    total,
    bySegment: bySegment.map(s => ({
      segmentName: s.segmentName,
      count: Number(s.count),
    })),
  };
}
