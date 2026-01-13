import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 シードデータを投入開始...');

  // 既存のデータをクリア（順序重要：外部キー制約のため）
  await prisma.review.deleteMany();
  await prisma.persona.deleteMany();

  // PostgreSQLのシーケンスをリセット（IDを1から始める）
  await prisma.$executeRaw`ALTER SEQUENCE personas_id_seq RESTART WITH 1;`;

  // カテゴリ1: Standard_Japan (日本の平均的な人口分布) - 30人
  const standardJapanPersonas = [
    // 10代
    { name: '田中 太郎', age: 19, gender: '男性', occupation: '大学生', annualIncome: 500000, personality: '好奇心旺盛で新しいものが好き。SNSで情報収集。', hobbies: 'ゲーム、YouTube視聴', challenges: '限られた予算で楽しみたい', buyingBehavior: '口コミ重視。学割好き', category: 'Standard_Japan' },
    { name: '鈴木 さくら', age: 18, gender: '女性', occupation: '高校生', annualIncome: 200000, personality: 'トレンドに敏感。友達との時間を大切にする', hobbies: 'TikTok、ショッピング', challenges: 'バイト代をやりくり', buyingBehavior: 'インフルエンサーの影響を受けやすい', category: 'Standard_Japan' },
    
    // 20代
    { name: '佐藤 花子', age: 28, gender: '女性', occupation: '会社員（事務職）', annualIncome: 3800000, personality: '真面目で計画的。ワークライフバランス重視', hobbies: 'ヨガ、読書、旅行', challenges: 'ストレス解消と自己投資', buyingBehavior: '品質重視。ご褒美消費', category: 'Standard_Japan' },
    { name: '山田 優', age: 25, gender: '男性', occupation: 'IT企業勤務', annualIncome: 4500000, personality: '効率主義。テクノロジー好き', hobbies: 'ガジェット、アニメ', challenges: 'キャリアアップとスキル習得', buyingBehavior: '最新ガジェット好き', category: 'Standard_Japan' },
    { name: '中島 莉子', age: 26, gender: '女性', occupation: '看護師', annualIncome: 4200000, personality: '優しくて面倒見が良い。激務に耐えている', hobbies: 'カフェ、美容、Netflix', challenges: '夜勤の疲れを癒したい', buyingBehavior: '健康・美容製品に投資', category: 'Standard_Japan' },
    { name: '高橋 陸', age: 29, gender: '男性', occupation: 'エンジニア', annualIncome: 6000000, personality: '論理的で几帳面。技術が好き', hobbies: 'プログラミング、ゲーム', challenges: '技術の学習時間確保', buyingBehavior: '技術書、オンライン講座', category: 'Standard_Japan' },
    { name: '小林 美咲', age: 27, gender: '女性', occupation: 'マーケター', annualIncome: 5000000, personality: 'クリエイティブで社交的', hobbies: 'SNS、イベント参加', challenges: '成果を出し続けること', buyingBehavior: 'トレンド商品、自己啓発本', category: 'Standard_Japan' },
    
    // 30代
    { name: '鈴木 健一', age: 35, gender: '男性', occupation: '会社員（営業職）', annualIncome: 5200000, personality: '社交的で人付き合いが得意。家族思い', hobbies: 'ゴルフ、飲み会', challenges: '家族との時間とキャリア', buyingBehavior: '実用性重視。ポイント好き', category: 'Standard_Japan' },
    { name: '伊藤 恵', age: 32, gender: '女性', occupation: '主婦（パート）', annualIncome: 1200000, personality: '節約上手で家計管理が得意', hobbies: '料理、ハンドメイド', challenges: '家計のやりくり', buyingBehavior: '価格重視。セール情報チェック', category: 'Standard_Japan' },
    { name: '渡辺 誠二', age: 38, gender: '男性', occupation: '教師', annualIncome: 5800000, personality: '教育熱心で生徒思い', hobbies: '読書、スポーツ観戦', challenges: '教材研究と生徒指導', buyingBehavior: '教育関連商品、書籍', category: 'Standard_Japan' },
    { name: '木村 ゆかり', age: 34, gender: '女性', occupation: '薬剤師', annualIncome: 5500000, personality: '几帳面で健康意識が高い', hobbies: 'ランニング、料理', challenges: '仕事と育児の両立', buyingBehavior: '健康食品、時短家電', category: 'Standard_Japan' },
    { name: '林 達也', age: 39, gender: '男性', occupation: '自営業（飲食店）', annualIncome: 4000000, personality: '情熱的で努力家。お客様第一', hobbies: '料理研究、食べ歩き', challenges: '店の経営と新規顧客獲得', buyingBehavior: '業務用品、食材にこだわる', category: 'Standard_Japan' },
    
    // 40代
    { name: '高橋 一郎', age: 45, gender: '男性', occupation: '会社員（管理職）', annualIncome: 7500000, personality: '責任感が強く、部下の育成に熱心', hobbies: '読書、ウイスキー', challenges: '仕事と家庭のバランス', buyingBehavior: '品質重視。投資にも関心', category: 'Standard_Japan' },
    { name: '山本 香織', age: 42, gender: '女性', occupation: '公務員', annualIncome: 6000000, personality: '安定志向。真面目で誠実', hobbies: '映画鑑賞、ガーデニング', challenges: '子供の教育費準備', buyingBehavior: '堅実。教育関連に投資', category: 'Standard_Japan' },
    { name: '加藤 修', age: 48, gender: '男性', occupation: '会社員（部長）', annualIncome: 9000000, personality: 'リーダーシップがある。家族思い', hobbies: 'ゴルフ、旅行', challenges: '老後資金と子供の進学', buyingBehavior: '品質と実績重視', category: 'Standard_Japan' },
    { name: '佐々木 美和', age: 44, gender: '女性', occupation: 'パート（販売員）', annualIncome: 2000000, personality: '明るくて親しみやすい', hobbies: 'ショッピング、ドラマ', challenges: '自分の時間を楽しみたい', buyingBehavior: 'プチプラとデパコス使い分け', category: 'Standard_Japan' },
    { name: '松本 健太郎', age: 46, gender: '男性', occupation: '建設業', annualIncome: 5000000, personality: '職人気質。体を動かすのが好き', hobbies: '釣り、DIY', challenges: '体力維持と技術継承', buyingBehavior: '道具にはこだわる', category: 'Standard_Japan' },
    
    // 50代
    { name: '伊藤 真由美', age: 52, gender: '女性', occupation: '看護師', annualIncome: 5000000, personality: '優しくて面倒見が良い', hobbies: 'ガーデニング、温泉', challenges: '仕事のストレスケア', buyingBehavior: '健康・美容に投資', category: 'Standard_Japan' },
    { name: '田村 浩', age: 55, gender: '男性', occupation: '会社員（役職者）', annualIncome: 10000000, personality: '経験豊富でベテラン', hobbies: 'ゴルフ、日本酒', challenges: '定年後の生活設計', buyingBehavior: '高品質志向。趣味に投資', category: 'Standard_Japan' },
    { name: '中村 洋子', age: 53, gender: '女性', occupation: '事務パート', annualIncome: 2500000, personality: '家庭的で節約家', hobbies: '料理、手芸', challenges: '老後資金の準備', buyingBehavior: '節約重視。セール狙い', category: 'Standard_Japan' },
    { name: '斉藤 誠', age: 58, gender: '男性', occupation: '中小企業経営者', annualIncome: 12000000, personality: '実直で地域密着型', hobbies: '釣り、囲碁', challenges: '事業承継と後継者育成', buyingBehavior: '実用性と信頼性重視', category: 'Standard_Japan' },
    
    // 60代以上
    { name: '渡辺 誠', age: 62, gender: '男性', occupation: '定年退職者（再雇用）', annualIncome: 3000000, personality: '穏やかで経験豊富', hobbies: '釣り、囲碁、旅行', challenges: '年金生活への移行', buyingBehavior: '必要なものだけ購入', category: 'Standard_Japan' },
    { name: '中村 恵子', age: 68, gender: '女性', occupation: '年金生活者', annualIncome: 2000000, personality: '健康で活動的', hobbies: '社交ダンス、孫の世話', challenges: '健康寿命を延ばしたい', buyingBehavior: '健康関連商品、孫へのプレゼント', category: 'Standard_Japan' },
    { name: '小林 拓也', age: 19, gender: '男性', occupation: 'フリーター', annualIncome: 1800000, personality: 'マイペース。将来に不安', hobbies: 'バンド、アニメ', challenges: '将来のキャリア', buyingBehavior: '安さ重視。友達の影響受けやすい', category: 'Standard_Japan' },
    { name: '吉田 あゆみ', age: 40, gender: '女性', occupation: 'パート（小売業）', annualIncome: 2400000, personality: '明るくて親しみやすい', hobbies: 'ショッピング、美容', challenges: '自分らしさを取り戻したい', buyingBehavior: 'トレンド意識。プチプラとデパコス', category: 'Standard_Japan' },
    // 追加20人
    { name: '前田 聡', age: 23, gender: '男性', occupation: '専門学校生', annualIncome: 800000, personality: '真面目で将来を考えている', hobbies: 'プログラミング学習、映画', challenges: '就職活動と技術習得', buyingBehavior: '必要なものだけ。教材には投資', category: 'Standard_Japan' },
    { name: '岡田 結衣', age: 24, gender: '女性', occupation: '美容師', annualIncome: 3000000, personality: 'おしゃれでトレンドに敏感', hobbies: 'ファッション、インスタ', challenges: '技術向上と顧客満足', buyingBehavior: '美容商品、ファッションアイテム', category: 'Standard_Japan' },
    { name: '藤田 健', age: 31, gender: '男性', occupation: '銀行員', annualIncome: 5500000, personality: '堅実で計画的', hobbies: '投資、ジョギング', challenges: 'キャリアアップと資産形成', buyingBehavior: '計画的消費。投資商品', category: 'Standard_Japan' },
    { name: '井上 麻衣', age: 29, gender: '女性', occupation: '保育士', annualIncome: 3200000, personality: '子供好きで優しい', hobbies: '手遊び研究、ピアノ', challenges: '低賃金での生活', buyingBehavior: '価格重視。子供向け商品', category: 'Standard_Japan' },
    { name: '木下 龍一', age: 36, gender: '男性', occupation: '警察官', annualIncome: 6500000, personality: '正義感が強く真面目', hobbies: '武道、読書', challenges: '危険な仕事と家族の安心', buyingBehavior: '実用性重視。保険加入', category: 'Standard_Japan' },
    { name: '松井 優子', age: 37, gender: '女性', occupation: '歯科衛生士', annualIncome: 4000000, personality: '几帳面で健康意識高い', hobbies: 'ヨガ、料理', challenges: '仕事と家事の両立', buyingBehavior: '健康食品、オーガニック製品', category: 'Standard_Japan' },
    { name: '森 誠', age: 43, gender: '男性', occupation: '不動産営業', annualIncome: 7000000, personality: '話し上手で営業力がある', hobbies: 'ゴルフ、接待', challenges: 'ノルマ達成と顧客満足', buyingBehavior: '接待費、ゴルフ用品', category: 'Standard_Japan' },
    { name: '石川 千春', age: 41, gender: '女性', occupation: 'ピアノ講師', annualIncome: 3500000, personality: '芸術的で繊細', hobbies: 'クラシック音楽、読書', challenges: '生徒募集と収入安定', buyingBehavior: '楽譜、音楽関連商品', category: 'Standard_Japan' },
    { name: '清水 大輔', age: 47, gender: '男性', occupation: '製造業（工場長）', annualIncome: 8000000, personality: '責任感強く、現場主義', hobbies: '野球観戦、温泉', challenges: '生産性向上と人材育成', buyingBehavior: '実用品。家族のために', category: 'Standard_Japan' },
    { name: '橋本 真奈美', age: 49, gender: '女性', occupation: '学校事務', annualIncome: 3800000, personality: '丁寧で気配りができる', hobbies: '園芸、料理', challenges: '子供の大学費用準備', buyingBehavior: '堅実。教育費優先', category: 'Standard_Japan' },
    { name: '長谷川 修', age: 51, gender: '男性', occupation: 'タクシー運転手', annualIncome: 4200000, personality: '話好きで人情味がある', hobbies: 'パチンコ、競馬', challenges: '長時間労働の疲れ', buyingBehavior: '日用品中心。娯楽費確保', category: 'Standard_Japan' },
    { name: '村上 律子', age: 54, gender: '女性', occupation: '介護士', annualIncome: 3600000, personality: '思いやりがあり献身的', hobbies: '温泉、ドラマ鑑賞', challenges: '体力的にきつい仕事', buyingBehavior: '健康グッズ、リラックス商品', category: 'Standard_Japan' },
    { name: '阿部 孝', age: 56, gender: '男性', occupation: '地方公務員', annualIncome: 6800000, personality: '真面目で地域貢献意識が高い', hobbies: '地域活動、釣り', challenges: '定年後の生活設計', buyingBehavior: '堅実。地元商品優先', category: 'Standard_Japan' },
    { name: '吉川 久美子', age: 59, gender: '女性', occupation: 'パート（スーパー）', annualIncome: 1800000, personality: '明るくて世話好き', hobbies: '井戸端会議、ドラマ', challenges: '老後資金の不安', buyingBehavior: '特売品狙い。極限節約', category: 'Standard_Japan' },
    { name: '今井 太一', age: 63, gender: '男性', occupation: '再雇用（メーカー）', annualIncome: 3500000, personality: 'ベテランで技術力がある', hobbies: '盆栽、将棋', challenges: '完全退職後の生活', buyingBehavior: '趣味用品にはお金をかける', category: 'Standard_Japan' },
    { name: '遠藤 幸子', age: 65, gender: '女性', occupation: '年金生活者', annualIncome: 2200000, personality: '健康で社交的', hobbies: '習い事、孫の世話', challenges: '健康維持と孫との時間', buyingBehavior: '孫へのプレゼント惜しまない', category: 'Standard_Japan' },
    { name: '佐野 義明', age: 70, gender: '男性', occupation: '完全退職者', annualIncome: 2500000, personality: '穏やかで知的', hobbies: '読書、散歩、囲碁', challenges: '認知症予防、健康維持', buyingBehavior: '健康食品、趣味関連', category: 'Standard_Japan' },
    { name: '池田 和子', age: 67, gender: '女性', occupation: '年金生活者', annualIncome: 1800000, personality: '節約家で倹約', hobbies: '手芸、近所付き合い', challenges: '年金だけで生活', buyingBehavior: '極力節約。必要最小限', category: 'Standard_Japan' },
    { name: '三浦 雄二', age: 20, gender: '男性', occupation: '専門学校生', annualIncome: 600000, personality: '技術志向。将来に意欲的', hobbies: 'プログラミング、ゲーム開発', challenges: '就職と技術習得', buyingBehavior: '技術関連に投資', category: 'Standard_Japan' },
    { name: '野口 奈々', age: 21, gender: '女性', occupation: 'アルバイト', annualIncome: 1500000, personality: 'フリーター。夢を追っている', hobbies: 'ダンス、音楽', challenges: '将来の不安。夢と現実', buyingBehavior: 'ファッション、趣味用品', category: 'Standard_Japan' },
    { name: '上田 健', age: 30, gender: '男性', occupation: 'システムエンジニア', annualIncome: 5800000, personality: '論理的で効率主義', hobbies: 'ゲーム、読書', challenges: 'ワークライフバランス', buyingBehavior: 'ガジェット、技術書', category: 'Standard_Japan' },
    { name: '西田 里奈', age: 33, gender: '女性', occupation: 'Webデザイナー', annualIncome: 4500000, personality: 'クリエイティブで感性豊か', hobbies: 'デザイン、カフェ', challenges: 'フリーランスの不安定さ', buyingBehavior: 'デザインツール、おしゃれグッズ', category: 'Standard_Japan' },
    { name: '原田 隆', age: 50, gender: '男性', occupation: '運送業', annualIncome: 4800000, personality: '真面目で勤勉', hobbies: 'ドライブ、温泉', challenges: '体力維持と長距離運転', buyingBehavior: '実用品中心', category: 'Standard_Japan' },
    { name: '大野 恵理', age: 57, gender: '女性', occupation: '事務員', annualIncome: 3300000, personality: '几帳面で気配りができる', hobbies: '編み物、旅行', challenges: '定年までの健康維持', buyingBehavior: '堅実。旅行には投資', category: 'Standard_Japan' },
    { name: '菊池 勇', age: 64, gender: '男性', occupation: '嘱託社員', annualIncome: 3000000, personality: 'ベテラン。後輩指導が得意', hobbies: '釣り、ゴルフ', challenges: '完全退職後の生活', buyingBehavior: '趣味用品。孫へのプレゼント', category: 'Standard_Japan' },
    { name: '宮崎 節子', age: 72, gender: '女性', occupation: '年金生活者', annualIncome: 1500000, personality: '健康でアクティブ', hobbies: 'ウォーキング、カラオケ', challenges: '健康寿命延伸', buyingBehavior: '健康食品、孫関連', category: 'Standard_Japan' },
  ];

  // カテゴリ2: Inbound_Tourist (訪日外国人) - 30人
  const inboundTouristPersonas = [
    { name: 'Emily Johnson', age: 28, gender: '女性', occupation: 'マーケター', annualIncome: 8000000, personality: 'アクティブで冒険好き', hobbies: '旅行、写真、ヨガ', challenges: '短期間で日本の魅力を最大限体験', buyingBehavior: '体験型消費。インスタ映え', category: 'Inbound_Tourist' },
    { name: 'David Chen', age: 35, gender: '男性', occupation: 'IT企業勤務', annualIncome: 12000000, personality: 'テクノロジー好き。家族思い', hobbies: 'ガジェット、アニメ、温泉', challenges: '家族全員が楽しめる旅行', buyingBehavior: '高品質電化製品、伝統工芸品', category: 'Inbound_Tourist' },
    { name: 'Sophie Martin', age: 23, gender: '女性', occupation: '大学院生', annualIncome: 3000000, personality: 'バックパッカー気質', hobbies: '文化探訪、ハイキング', challenges: '予算を抑えて深い体験', buyingBehavior: '価格重視だが本物の体験には払う', category: 'Inbound_Tourist' },
    { name: 'Michael Brown', age: 55, gender: '男性', occupation: '弁護士', annualIncome: 25000000, personality: '富裕層。高級志向', hobbies: 'ゴルフ、高級寿司', challenges: '本物の文化とラグジュアリー両立', buyingBehavior: '価格気にしない。最高品質求む', category: 'Inbound_Tourist' },
    { name: 'Li Wei', age: 30, gender: '男性', occupation: 'ビジネスオーナー', annualIncome: 15000000, personality: 'ビジネスチャンスを探す', hobbies: 'ショッピング、グルメ', challenges: '日本製品を大量購入', buyingBehavior: '爆買い傾向。ブランド品', category: 'Inbound_Tourist' },
    { name: 'Anna Schmidt', age: 42, gender: '女性', occupation: '教師', annualIncome: 6000000, personality: '文化や歴史に興味津々', hobbies: '博物館、書道', challenges: '生徒に日本文化を伝える資料集め', buyingBehavior: '教育的価値、伝統工芸品', category: 'Inbound_Tourist' },
    { name: 'James Wilson', age: 26, gender: '男性', occupation: 'YouTuber', annualIncome: 9000000, personality: 'エンターテイナー気質', hobbies: '動画制作、コスプレ', challenges: 'バズるコンテンツ作り', buyingBehavior: '面白い・ユニーク重視。SNS映え', category: 'Inbound_Tourist' },
    { name: 'Maria Garcia', age: 38, gender: '女性', occupation: 'ファッションデザイナー', annualIncome: 10000000, personality: 'クリエイティブで美的センス高い', hobbies: 'ファッション、アート', challenges: '日本の伝統とモダンの融合', buyingBehavior: 'デザイン性の高い商品', category: 'Inbound_Tourist' },
    { name: 'Ryan Kim', age: 24, gender: '男性', occupation: 'プロゲーマー', annualIncome: 7000000, personality: 'ゲームとアニメ大好き', hobbies: 'ゲーム、アニメ、フィギュア', challenges: '聖地巡礼。レアグッズ入手', buyingBehavior: 'アニメ・ゲーム関連大量購入', category: 'Inbound_Tourist' },
    { name: 'Isabella Rossi', age: 50, gender: '女性', occupation: 'ワイン輸入業者', annualIncome: 18000000, personality: 'グルメで美食家', hobbies: '日本酒、料亭巡り、陶芸', challenges: '日本の食文化を理解しビジネスに', buyingBehavior: '高級食材、酒類、工芸品', category: 'Inbound_Tourist' },
    // 追加20人
    { name: 'Tom Anderson', age: 32, gender: '男性', occupation: 'フォトグラファー', annualIncome: 7500000, personality: '芸術的で感性豊か', hobbies: '写真、寺社仏閣巡り', challenges: '日本の美を切り取りたい', buyingBehavior: 'カメラ機材、写真集', category: 'Inbound_Tourist' },
    { name: 'Sarah Lee', age: 29, gender: '女性', occupation: 'ブロガー', annualIncome: 5000000, personality: 'SNS好き。情報発信が得意', hobbies: 'グルメ、カフェ巡り', challenges: 'フォロワーが喜ぶコンテンツ作り', buyingBehavior: 'インスタ映え。お土産大量購入', category: 'Inbound_Tourist' },
    { name: 'Peter Zhang', age: 45, gender: '男性', occupation: 'ビジネスマン', annualIncome: 20000000, personality: '成功志向。家族を大切に', hobbies: '高級レストラン、ゴルフ', challenges: '家族に最高の体験を', buyingBehavior: '高級品。家族全員分', category: 'Inbound_Tourist' },
    { name: 'Linda Wang', age: 33, gender: '女性', occupation: '医師', annualIncome: 15000000, personality: '知的で慎重', hobbies: '美術館、茶道体験', challenges: '日本の伝統文化を学びたい', buyingBehavior: '品質重視。文化体験に投資', category: 'Inbound_Tourist' },
    { name: 'Carlos Silva', age: 27, gender: '男性', occupation: 'サッカー選手', annualIncome: 30000000, personality: '情熱的でエネルギッシュ', hobbies: 'スポーツ、ナイトライフ', challenges: '日本でのトレーニングと観光', buyingBehavior: 'スポーツ用品、高級品', category: 'Inbound_Tourist' },
    { name: 'Emma White', age: 22, gender: '女性', occupation: '留学生', annualIncome: 2500000, personality: '好奇心旺盛。日本文化を吸収中', hobbies: 'アニメ、日本語学習、カラオケ', challenges: '限られた予算で楽しむ', buyingBehavior: '安価だが日本らしいもの', category: 'Inbound_Tourist' },
    { name: 'Hans Mueller', age: 48, gender: '男性', occupation: 'エンジニア', annualIncome: 11000000, personality: '几帳面で計画的', hobbies: '鉄道、技術博物館', challenges: '効率的に観光したい', buyingBehavior: '技術関連、鉄道グッズ', category: 'Inbound_Tourist' },
    { name: 'Olivia Taylor', age: 31, gender: '女性', occupation: 'ヨガインストラクター', annualIncome: 5500000, personality: '精神性を重視。平和主義', hobbies: '瞑想、神社巡り、和食', challenges: '日本の禅文化を学びたい', buyingBehavior: '精神的価値。オーガニック製品', category: 'Inbound_Tourist' },
    { name: 'Alexandre Dubois', age: 36, gender: '男性', occupation: 'シェフ', annualIncome: 9500000, personality: 'グルメで探究心旺盛', hobbies: '料理研究、市場巡り', challenges: '日本の食材と調理技術を学ぶ', buyingBehavior: '食材、調理器具、料理本', category: 'Inbound_Tourist' },
    { name: 'Jessica Park', age: 26, gender: '女性', occupation: 'K-POPダンサー', annualIncome: 6000000, personality: 'エネルギッシュで表現力豊か', hobbies: 'ダンス、ファッション、カフェ', challenges: '日本でのパフォーマンス機会', buyingBehavior: 'ファッション、ダンス用品', category: 'Inbound_Tourist' },
    { name: 'Ahmed Hassan', age: 40, gender: '男性', occupation: '貿易商', annualIncome: 14000000, personality: 'ビジネスセンスがある', hobbies: '商談、ゴルフ、和食', challenges: '日本企業とのビジネス拡大', buyingBehavior: '高品質商品。大量仕入れ', category: 'Inbound_Tourist' },
    { name: 'Rachel Cohen', age: 34, gender: '女性', occupation: 'ジャーナリスト', annualIncome: 7000000, personality: '知的で観察力がある', hobbies: '取材、執筆、温泉', challenges: '日本の魅力を記事にしたい', buyingBehavior: '体験重視。お土産も', category: 'Inbound_Tourist' },
    { name: 'Marco Bianchi', age: 52, gender: '男性', occupation: 'レストランオーナー', annualIncome: 16000000, personality: '情熱的で美食家', hobbies: '料理、ワイン、芸術', challenges: '日本の食文化を学びたい', buyingBehavior: '高級食材、調理器具', category: 'Inbound_Tourist' },
    { name: 'Chloe Thompson', age: 25, gender: '女性', occupation: 'インフルエンサー', annualIncome: 8500000, personality: 'トレンドセッター。SNS好き', hobbies: 'インスタ、ファッション、カフェ', challenges: 'バズる投稿を作りたい', buyingBehavior: 'SNS映え最優先。大量購入', category: 'Inbound_Tourist' },
    { name: 'Lucas Santos', age: 29, gender: '男性', occupation: 'サッカーコーチ', annualIncome: 6500000, personality: '情熱的でリーダーシップがある', hobbies: 'サッカー、観光、日本文化', challenges: '短期間で多くを体験', buyingBehavior: 'スポーツ用品、お土産', category: 'Inbound_Tourist' },
    { name: 'Nina Petrov', age: 37, gender: '女性', occupation: 'バレエダンサー', annualIncome: 8000000, personality: '芸術的で完璧主義', hobbies: 'バレエ、美術、和文化', challenges: '日本の美意識を学びたい', buyingBehavior: '美容、芸術関連商品', category: 'Inbound_Tourist' },
    { name: 'Kevin O\'Brien', age: 43, gender: '男性', occupation: '建築家', annualIncome: 13000000, personality: 'デザイン思考。細部にこだわる', hobbies: '建築巡り、寺社仏閣', challenges: '日本建築のエッセンスを学ぶ', buyingBehavior: '建築書、デザイングッズ', category: 'Inbound_Tourist' },
    { name: 'Yuki Tanaka', age: 30, gender: '女性', occupation: '日系二世（米国）', annualIncome: 9000000, personality: 'ルーツを探している', hobbies: '家族探し、観光、和食', challenges: '日本の文化を再発見', buyingBehavior: '家族へのお土産、伝統工芸', category: 'Inbound_Tourist' },
    { name: 'Robert Miller', age: 60, gender: '男性', occupation: '退職者（元CEO）', annualIncome: 40000000, personality: '富裕層。時間とお金に余裕', hobbies: '高級旅館、ゴルフ、骨董品', challenges: '最高級の日本体験', buyingBehavior: '価格は度外視。VIP体験', category: 'Inbound_Tourist' },
    { name: 'Sophia Nguyen', age: 21, gender: '女性', occupation: '学生', annualIncome: 1500000, personality: '若くて元気。アニメ好き', hobbies: 'アニメ、ショッピング、カラオケ', challenges: '学生予算で楽しみたい', buyingBehavior: 'プチプラ。アニメグッズ', category: 'Inbound_Tourist' },
  ];

  // カテゴリ3: Biz_Tech (ビジネス・テック系) - 30人
  const bizTechPersonas = [
    { name: '山本 裕太', age: 29, gender: '男性', occupation: 'スタートアップCEO', annualIncome: 15000000, personality: 'エネルギッシュで挑戦的', hobbies: 'ネットワーキング、サウナ', challenges: '資金調達、人材確保', buyingBehavior: '効率化ツール。ROI重視', category: 'Biz_Tech' },
    { name: '加藤 真理子', age: 32, gender: '女性', occupation: 'フルスタックエンジニア', annualIncome: 9000000, personality: '論理的で問題解決が得意', hobbies: 'プログラミング、ハッカソン', challenges: '最新技術キャッチアップ', buyingBehavior: '高性能ガジェット、技術書', category: 'Biz_Tech' },
    { name: '佐々木 健太', age: 35, gender: '男性', occupation: 'VC投資家', annualIncome: 20000000, personality: '分析的で先見性がある', hobbies: 'ピッチ参加、ゴルフ', challenges: '次のユニコーン発見', buyingBehavior: '投資機会探し。高級品', category: 'Biz_Tech' },
    { name: '西村 あかり', age: 27, gender: '女性', occupation: 'UXデザイナー', annualIncome: 7000000, personality: 'クリエイティブで共感力高い', hobbies: 'デザイン、美術館', challenges: 'ユーザーに愛されるプロダクト', buyingBehavior: 'デザインツール、美的消費', category: 'Biz_Tech' },
    { name: '田村 大輔', age: 41, gender: '男性', occupation: 'CTO', annualIncome: 18000000, personality: '技術力とマネジメント両立', hobbies: 'OSS開発、ジム', challenges: '技術的負債解消、組織スケール', buyingBehavior: 'チーム生産性向上ツール', category: 'Biz_Tech' },
    { name: '森田 春菜', age: 30, gender: '女性', occupation: 'プロダクトマネージャー', annualIncome: 8500000, personality: '戦略的思考。データドリブン', hobbies: 'データ分析、ヨガ', challenges: 'PMF達成とステークホルダー調整', buyingBehavior: 'ビジネス書、効率化ツール', category: 'Biz_Tech' },
    { name: '石井 翔', age: 25, gender: '男性', occupation: 'AIエンジニア', annualIncome: 10000000, personality: '天才肌で研究熱心', hobbies: '機械学習、論文', challenges: '研究と実装のバランス', buyingBehavior: '高性能GPU、クラウドサービス', category: 'Biz_Tech' },
    { name: '岡本 みゆき', age: 38, gender: '女性', occupation: 'グロースハッカー', annualIncome: 11000000, personality: '実験的で数字に強い', hobbies: 'A/Bテスト、ランニング', challenges: 'CAC最適化、成長戦略', buyingBehavior: 'マーケティングツール', category: 'Biz_Tech' },
    { name: '青木 拓海', age: 33, gender: '男性', occupation: 'ブロックチェーンエンジニア', annualIncome: 13000000, personality: '革新的で理想主義', hobbies: 'クリプト、Web3、DJ', challenges: 'メインストリーム採用', buyingBehavior: '仮想通貨、NFT、Web3ツール', category: 'Biz_Tech' },
    { name: '橋本 沙織', age: 28, gender: '女性', occupation: 'DevOpsエンジニア', annualIncome: 8000000, personality: '効率重視。自動化好き', hobbies: 'インフラ構築、サイクリング', challenges: 'CI/CD最適化', buyingBehavior: 'クラウドサービス、監視ツール', category: 'Biz_Tech' },
    // さらに20人追加
    { name: '中野 隼人', age: 26, gender: '男性', occupation: 'データサイエンティスト', annualIncome: 8500000, personality: 'データ好きで分析的', hobbies: '統計、機械学習、囲碁', challenges: 'ビジネス価値あるインサイト発見', buyingBehavior: '分析ツール、オンライン講座', category: 'Biz_Tech' },
    { name: '藤原 梨花', age: 31, gender: '女性', occupation: 'SaaSマーケター', annualIncome: 7500000, personality: 'B2Bマーケに強い', hobbies: 'セミナー参加、ワイン', challenges: 'リード獲得とコンバージョン', buyingBehavior: 'マーケティング本、ツール', category: 'Biz_Tech' },
    { name: '大塚 剛', age: 44, gender: '男性', occupation: 'セキュリティエンジニア', annualIncome: 12000000, personality: '慎重で細かい。セキュリティ第一', hobbies: 'ハッキング研究、読書', challenges: 'ゼロデイ脆弱性対策', buyingBehavior: 'セキュリティツール、勉強会', category: 'Biz_Tech' },
    { name: '平野 瞳', age: 29, gender: '女性', occupation: 'スクラムマスター', annualIncome: 7000000, personality: 'ファシリテーション得意', hobbies: 'アジャイル勉強会、ヨガ', challenges: 'チームの生産性向上', buyingBehavior: 'アジャイル本、ツール', category: 'Biz_Tech' },
    { name: '小川 悠太', age: 27, gender: '男性', occupation: 'モバイルアプリ開発者', annualIncome: 7500000, personality: 'クリエイティブで技術好き', hobbies: 'アプリ開発、ゲーム', challenges: 'ヒットアプリを作りたい', buyingBehavior: '開発ツール、デバイス', category: 'Biz_Tech' },
    { name: '安藤 真紀', age: 34, gender: '女性', occupation: 'HRテック創業者', annualIncome: 10000000, personality: '人事とテクノロジーの融合', hobbies: '採用イベント、読書', challenges: '優秀な人材の採用', buyingBehavior: 'HRツール、採用広告', category: 'Biz_Tech' },
    { name: '内田 勇気', age: 36, gender: '男性', occupation: 'クラウドアーキテクト', annualIncome: 11500000, personality: '設計力が高い。先を見据える', hobbies: 'AWS勉強、登山', challenges: 'スケーラブルなシステム設計', buyingBehavior: 'クラウド認定、技術書', category: 'Biz_Tech' },
    { name: '斉藤 彩', age: 30, gender: '女性', occupation: 'カスタマーサクセス', annualIncome: 6500000, personality: '共感力高く、顧客志向', hobbies: '顧客インタビュー、旅行', challenges: '顧客満足度とリテンション向上', buyingBehavior: 'CSツール、自己啓発本', category: 'Biz_Tech' },
    { name: '水野 健', age: 39, gender: '男性', occupation: 'SREエンジニア', annualIncome: 10500000, personality: '信頼性第一。24/7対応の覚悟', hobbies: '障害対応、登山', challenges: 'サービス可用性99.99%維持', buyingBehavior: '監視ツール、インシデント管理', category: 'Biz_Tech' },
    { name: '吉岡 美穂', age: 28, gender: '女性', occupation: 'コンテンツマーケター', annualIncome: 6800000, personality: 'ストーリーテリングが得意', hobbies: 'ライティング、読書', challenges: 'エンゲージメント向上', buyingBehavior: 'ライティングツール、セミナー', category: 'Biz_Tech' },
    { name: '谷口 翔太', age: 42, gender: '男性', occupation: 'CFO', annualIncome: 16000000, personality: '財務に強い。リスク管理重視', hobbies: '投資、ゴルフ、読書', challenges: 'IPO準備と財務健全性', buyingBehavior: '投資商品、ビジネス書', category: 'Biz_Tech' },
    { name: '永井 さやか', age: 26, gender: '女性', occupation: 'QAエンジニア', annualIncome: 6000000, personality: '細かくて几帳面', hobbies: 'テスト自動化、カフェ', challenges: '品質とスピードの両立', buyingBehavior: 'テストツール、技術書', category: 'Biz_Tech' },
    { name: '島田 大樹', age: 37, gender: '男性', occupation: 'AIコンサルタント', annualIncome: 14000000, personality: 'AI技術とビジネスの橋渡し', hobbies: 'AI研究、ビジネス書', challenges: 'AI活用の啓蒙', buyingBehavior: 'AI関連サービス、勉強会', category: 'Biz_Tech' },
    { name: '北川 愛', age: 33, gender: '女性', occupation: 'UI/UXリサーチャー', annualIncome: 7800000, personality: 'ユーザー心理を深く理解', hobbies: 'ユーザーインタビュー、旅行', challenges: '定性・定量調査の統合', buyingBehavior: 'リサーチツール、UX書籍', category: 'Biz_Tech' },
    { name: '飯田 啓介', age: 40, gender: '男性', occupation: 'テックリード', annualIncome: 13500000, personality: '技術選定のプロ', hobbies: '技術検証、メンタリング', challenges: 'アーキテクチャ決定の重責', buyingBehavior: '技術カンファレンス、書籍', category: 'Biz_Tech' },
  ];

  // すべてのペルソナを結合
  const allPersonas = [
    ...standardJapanPersonas,
    ...inboundTouristPersonas,
    ...bizTechPersonas,
  ];

  // データベースに投入
  for (const persona of allPersonas) {
    await prisma.persona.create({
      data: persona,
    });
  }

  console.log(`✅ ${allPersonas.length}人のペルソナを作成しました！`);
  console.log(`   - Standard_Japan: ${standardJapanPersonas.length}人`);
  console.log(`   - Inbound_Tourist: ${inboundTouristPersonas.length}人`);
  console.log(`   - Biz_Tech: ${bizTechPersonas.length}人`);
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });











