// ベクトル埋め込みユーティリティ
// transformers.jsでテキストを384次元ベクトルに変換

import { pipeline } from '@xenova/transformers';

// シングルトンパターンでパイプラインを管理
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let embeddingPipeline: any = null;

/**
 * 埋め込みパイプラインを取得（遅延初期化）
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getEmbeddingPipeline(): Promise<any> {
  if (!embeddingPipeline) {
    console.log('🔄 Loading embedding model (first time may take a while)...');
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('✅ Embedding model loaded');
  }
  return embeddingPipeline;
}

/**
 * テキストを384次元ベクトルに変換する
 * @param text 変換するテキスト
 * @returns 384次元のベクトル（正規化済み）
 */
export async function textToEmbedding(text: string): Promise<number[]> {
  const pipe = await getEmbeddingPipeline();

  // テキストをベクトル化
  const output = await pipe(text, {
    pooling: 'mean',
    normalize: true,
  });

  // Float32Arrayを通常の配列に変換
  return Array.from(output.data as Float32Array);
}

/**
 * 埋め込みキャッシュ（同じテキストは再計算しない）
 */
const embeddingCache = new Map<string, number[]>();

/**
 * キャッシュ付きテキスト埋め込み
 * @param text 変換するテキスト
 * @returns 384次元のベクトル
 */
export async function textToEmbeddingCached(text: string): Promise<number[]> {
  // キャッシュにあればそれを返す
  const cached = embeddingCache.get(text);
  if (cached) {
    return cached;
  }

  // ベクトル化してキャッシュに保存
  const embedding = await textToEmbedding(text);
  embeddingCache.set(text, embedding);
  return embedding;
}

/**
 * 複数のテキストを一括でベクトル化
 * @param texts 変換するテキストの配列
 * @returns ベクトルの配列
 */
export async function textsToEmbeddings(texts: string[]): Promise<number[][]> {
  const pipe = await getEmbeddingPipeline();
  const embeddings: number[][] = [];

  for (const text of texts) {
    // キャッシュチェック
    const cached = embeddingCache.get(text);
    if (cached) {
      embeddings.push(cached);
      continue;
    }

    // ベクトル化
    const output = await pipe(text, {
      pooling: 'mean',
      normalize: true,
    });
    const embedding = Array.from(output.data as Float32Array);
    embeddingCache.set(text, embedding);
    embeddings.push(embedding);
  }

  return embeddings;
}

/**
 * キャッシュをクリア
 */
export function clearEmbeddingCache(): void {
  embeddingCache.clear();
}

/**
 * ベクトルをPostgreSQL用の文字列形式に変換
 * @param vector 数値の配列
 * @returns "[0.1,0.2,...]"形式の文字列
 */
export function vectorToString(vector: number[]): string {
  return `[${vector.join(',')}]`;
}
