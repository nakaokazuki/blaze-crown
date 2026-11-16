export type BetaDeckTop5Entry = {
  rank: number;
  deckName: string;
  /** 当サイト characters.yaml の slug */
  slugs: [string, string, string];
  /** キャラ一覧の rating と同系（見出し横の小さなラベル） */
  targetLevel: string;
  summaryAnchor: string;
  detailAnchor: string;
};

export const BETA_DECK_TOP5: BetaDeckTop5Entry[] = [
  {
    rank: 1,
    deckName: '王女護衛',
    slugs: ['lumina', 'dan', 'noel'],
    targetLevel: '初心者向け',
    summaryAnchor: 'deck-summary-rank-1',
    detailAnchor: '1位王女護衛エナジー循環ルミナ--ダン--ノエル',
  },
  {
    rank: 2,
    deckName: 'シンエン先制',
    slugs: ['tsubaki', 'murasame', 'kagetra'],
    targetLevel: '中級者向け',
    summaryAnchor: 'deck-summary-rank-2',
    detailAnchor: '2位シンエン先制コンボツバキ--ムラサメ--カゲトラ',
  },
  {
    rank: 3,
    deckName: '背水リベンジ',
    slugs: ['frei', 'dan', 'noel'],
    targetLevel: '中級者向け',
    summaryAnchor: 'deck-summary-rank-3',
    detailAnchor: '3位背水リベンジフレイ--ダン--ノエル',
  },
  {
    rank: 4,
    deckName: '傭兵頭数',
    slugs: ['alfard', 'zaphiel', 'dan'],
    targetLevel: '上級者向け',
    summaryAnchor: 'deck-summary-rank-4',
    detailAnchor: '4位傭兵団頭数オーバーロードアルファルド--ザフィール--ダン',
  },
  {
    rank: 5,
    deckName: '斬鉄カウンター',
    slugs: ['kagetra', 'noel', 'dan'],
    targetLevel: '中級者向け',
    summaryAnchor: 'deck-summary-rank-5',
    detailAnchor: '5位斬鉄カウンターカゲトラ--ノエル--ダン',
  },
];