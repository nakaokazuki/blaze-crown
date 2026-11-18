export type BetaDeckHonorableEntry = {
  slugs: [string, string, string];
  targetLevel: string;
  detailAnchor: string;
};

/** TOP5外の有力編成（βガイド・候補枠） */
export const BETA_DECK_HONORABLE: BetaDeckHonorableEntry[] = [
  {
    slugs: ['leonis', 'noel', 'dan'],
    targetLevel: '上級者向け',
    detailAnchor: '有力レオニス--ノエル--ダン',
  },
  {
    slugs: ['murasame', 'noel', 'tsubaki'],
    targetLevel: '中級者向け',
    detailAnchor: '有力ムラサメ--ノエル--ツバキ',
  },
  {
    slugs: ['alfard', 'zaphiel', 'dan'],
    targetLevel: '上級者向け',
    detailAnchor: '有力アルファルド--ザフィール--ダン',
  },
];