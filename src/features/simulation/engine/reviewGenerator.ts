// レビューテキスト生成エンジン
// 評価とセグメント情報からレビューコメントを生成（AI API不要）

interface ReviewContext {
  rating: number; // 1-5
  segmentName: string;
  similarity: number;
  profileVector: number[];
}

// レビューテキストのテンプレート
const REVIEW_TEMPLATES = {
  // 星5のレビュー
  star5: [
    '期待以上の品質でした！',
    'とても満足しています。',
    'この価格でこの品質は素晴らしいです。',
    '長く使えそうで安心です。',
    'デザインも機能も完璧です。',
    '購入して正解でした。',
    '友人にもおすすめしたいです。',
  ],
  // 星4のレビュー
  star4: [
    '良い商品だと思います。',
    '期待通りでした。',
    'コスパは良いと思います。',
    '満足しています。',
    '悪くはないですが、もう少し改善の余地があるかもしれません。',
    '基本的には良い商品です。',
    '値段相応の品質だと思います。',
  ],
  // 星3のレビュー
  star3: [
    '普通だと思います。',
    'まあまあです。',
    '期待していたほどではありませんでした。',
    '良い点も悪い点もあります。',
    '特に問題はありませんが、特別良いとも言えません。',
    '平均的な品質だと思います。',
    'もう少し改善してほしい点があります。',
  ],
  // 星2のレビュー
  star2: [
    '期待外れでした。',
    'あまり満足できませんでした。',
    '品質に不安があります。',
    'もう少し安ければ良いのですが。',
    '改善の余地が大きいです。',
    '期待していたものと違いました。',
    'コスパが悪いと思います。',
  ],
  // 星1のレビュー
  star1: [
    '期待していたものと大きく違いました。',
    '品質に問題があると思います。',
    '購入を後悔しています。',
    'おすすめできません。',
    '改善が必要です。',
    '期待外れでした。',
    'この価格では納得できません。',
  ],
};

// セグメント別の追加コメント
const SEGMENT_COMMENTS: Record<string, Record<number, string[]>> = {
  'ブランド重視': {
    5: ['信頼できるブランドなので安心です。', 'ブランドの品質が感じられます。'],
    4: ['ブランドとして期待通りです。', 'ブランド価値はあると思います。'],
    3: ['ブランドとしては普通です。', 'ブランド名に期待していたほどではありません。'],
    2: ['ブランドにしては物足りないです。', 'ブランド価値が感じられません。'],
    1: ['ブランドとして期待外れでした。', 'ブランド名に値しない品質です。'],
  },
  'デザイン重視': {
    5: ['デザインが素晴らしいです！', '見た目がとても気に入りました。'],
    4: ['デザインは良いと思います。', '見た目は悪くないです。'],
    3: ['デザインは普通です。', 'デザインに特別な魅力は感じません。'],
    2: ['デザインが物足りないです。', 'もう少しデザインに工夫が欲しいです。'],
    1: ['デザインが期待外れでした。', 'デザインが気に入りません。'],
  },
  '価格重視': {
    5: ['この価格でこの品質は最高です！', 'コスパが抜群です。'],
    4: ['価格相応の品質だと思います。', 'コスパは良いと思います。'],
    3: ['価格と品質のバランスは普通です。', 'もう少し安ければ良いのですが。'],
    2: ['価格の割に品質が物足りないです。', 'コスパが悪いと思います。'],
    1: ['この価格では納得できません。', '価格に対して品質が低すぎます。'],
  },
  '品質重視': {
    5: ['品質が非常に高いです！', '長く使えそうで安心です。'],
    4: ['品質は良いと思います。', '品質に問題はありません。'],
    3: ['品質は普通です。', '品質に不安があります。'],
    2: ['品質が期待外れでした。', '品質に問題があると思います。'],
    1: ['品質に大きな問題があります。', '品質が低すぎます。'],
  },
};

/**
 * レビューテキストを生成
 * @param context レビューコンテキスト（評価、セグメント、類似度など）
 * @returns 生成されたレビューテキスト
 */
export function generateReviewText(context: ReviewContext): string {
  const { rating, segmentName, similarity, profileVector } = context;

  // 基本テンプレートから選択
  const templates = REVIEW_TEMPLATES[`star${rating}` as keyof typeof REVIEW_TEMPLATES] || REVIEW_TEMPLATES.star3;
  const baseText = templates[Math.floor(Math.random() * templates.length)];

  // セグメント別の追加コメント
  const segmentComments = SEGMENT_COMMENTS[segmentName]?.[rating] || [];
  const segmentComment = segmentComments.length > 0
    ? segmentComments[Math.floor(Math.random() * segmentComments.length)]
    : '';

  // 類似度に基づく追加コメント
  let similarityComment = '';
  if (similarity > 0.7) {
    similarityComment = '商品の特徴が自分の好みに合っています。';
  } else if (similarity < 0.3) {
    similarityComment = '商品の特徴が自分の好みと少し違いました。';
  }

  // プロファイルベクトルに基づく追加コメント
  const priceSensitivity = profileVector[0] || 0.5;
  const qualityFocus = profileVector[1] || 0.5;
  let profileComment = '';

  if (rating >= 4) {
    if (qualityFocus > 0.7) {
      profileComment = '品質が期待通りでした。';
    } else if (priceSensitivity > 0.7) {
      profileComment = '価格に対して満足しています。';
    }
  } else if (rating <= 2) {
    if (qualityFocus > 0.7) {
      profileComment = '品質に不満があります。';
    } else if (priceSensitivity > 0.7) {
      profileComment = '価格に対して不満があります。';
    }
  }

  // レビューテキストを組み立て
  const parts = [baseText];
  if (segmentComment) parts.push(segmentComment);
  if (similarityComment) parts.push(similarityComment);
  if (profileComment) parts.push(profileComment);

  return parts.join(' ');
}

/**
 * 複数のレビューテキストを一括生成
 */
export function generateReviewTexts(
  ratings: Array<{ rating: number; similarity: number; profileVector: number[] }>,
  segmentNames: string[]
): string[] {
  return ratings.map((rating, index) =>
    generateReviewText({
      rating: rating.rating,
      segmentName: segmentNames[index] || '品質重視',
      similarity: rating.similarity,
      profileVector: rating.profileVector,
    })
  );
}


