export type BetaDeckHonorableEntry = {
  deckName: string;
  slugs: [string, string, string];
  targetLevel: string;
  detailAnchor: string;
};

/** TOP5外の有力編成（βガイド・候補枠） */
export const BETA_DECK_HONORABLE: BetaDeckHonorableEntry[] = [
  {
    deckName: 'エクスカリバー',
    slugs: ['leonis', 'noel', 'dan'],
    targetLevel: '上級者向け',
    detailAnchor: '有力-エクスカリバーレオニス--ノエル--ダン',
  },
  {
    deckName: '鬼神乱舞特化',
    slugs: ['murasame', 'noel', 'tsubaki'],
    targetLevel: '中級者向け',
    detailAnchor: '有力-鬼神乱舞ムラサメ--ノエル--ツバキ',
  },
  {
    deckName: '単体妨害軸',
    slugs: ['alfard', 'zaphiel', 'dan'],
    targetLevel: '上級者向け',
    detailAnchor: '有力-単体妨害アルファルド--ザフィール--ダン',
  },
];