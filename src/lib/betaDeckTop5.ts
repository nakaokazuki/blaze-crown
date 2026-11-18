/** 3×3 陣形（上から後列・中列・前列、各3マス） */
export type BetaDeckFormationRows = [
  [string | null, string | null, string | null],
  [string | null, string | null, string | null],
  [string | null, string | null, string | null],
];

export type BetaDeckTop5Entry = {
  rank: number;
  /** 当サイト characters.yaml の slug */
  slugs: [string, string, string];
  /** キャラ一覧の rating と同系（見出し横の小さなラベル） */
  targetLevel: string;
  summaryAnchor: string;
  detailAnchor: string;
  /** 任意。3×3 の初期配置（実戦レポート等で使用） */
  formation?: BetaDeckFormationRows;
};

export const BETA_DECK_TOP5: BetaDeckTop5Entry[] = [
  {
    rank: 1,
    slugs: ['lumina', 'dan', 'noel'],
    targetLevel: '初心者向け',
    summaryAnchor: 'deck-summary-rank-1',
    detailAnchor: '1位ルミナ--ダン--ノエル',
  },
  {
    rank: 2,
    slugs: ['tsubaki', 'murasame', 'kagetra'],
    targetLevel: '中級者向け',
    summaryAnchor: 'deck-summary-rank-2',
    detailAnchor: '2位ツバキ--ムラサメ--カゲトラ',
  },
  {
    rank: 3,
    slugs: ['frei', 'dan', 'noel'],
    targetLevel: '中級者向け',
    summaryAnchor: 'deck-summary-rank-3',
    detailAnchor: '3位フレイ--ダン--ノエル',
  },
  {
    rank: 4,
    slugs: ['alfard', 'zaphiel', 'dan'],
    targetLevel: '上級者向け',
    summaryAnchor: 'deck-summary-rank-4',
    detailAnchor: '4位アルファルド--ザフィール--ダン',
  },
  {
    rank: 5,
    slugs: ['kagetra', 'noel', 'dan'],
    targetLevel: '中級者向け',
    summaryAnchor: 'deck-summary-rank-5',
    detailAnchor: '5位カゲトラ--ノエル--ダン',
  },
];