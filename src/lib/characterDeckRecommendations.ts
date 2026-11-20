import type { BetaDeckFormationRows } from './betaDeckTop5';

export type CharacterDeckRecommendation = {
  formation: BetaDeckFormationRows;
  /** グリッド直下から飛ばす攻略記事（省略時はリンクなし） */
  guideSlug?: string;
  /** リンク直前のリード（省略時は CHARACTER_DECK_GUIDE_LEAD） */
  guideLead?: string;
  /** リンク文言（省略時は guideSlug に応じた既定ラベル） */
  guideLinkLabel?: string;
};

/** おすすめデッキ直下の固定文言（guideSlug があるとき） */
export const CHARACTER_DECK_GUIDE_LEAD = 'β初日ランキング3位の実戦編成 →';

/** 3位実戦記リンクのアンカー文言（記事 title と揃える） */
export const BETA_RANK3_DECK_REPORT_LINK_LABEL =
  'ツバキ・レオニス・ダン｜ランキングマッチ上位デッキの評価・立ち回り';

export const RANKING_DECK_ZAPHIEL_MURASAME_LEONIS_LINK_LABEL =
  'ザフィール・ムラサメ・レオニス｜ランキングマッチ上位デッキの評価・立ち回り';

export const RANKING_DECK_NOEL_ZAPHIEL_ALFARD_LINK_LABEL =
  'ノエル・ザフィール・アルファルド｜ランキングマッチ上位デッキの評価・立ち回り';

const RANK3_DAY1_FORMATION: BetaDeckFormationRows = [
  ['tsubaki', null, null],
  [null, null, null],
  [null, 'leonis', 'dan'],
];

const RANK3_DAY1_DECK: CharacterDeckRecommendation = {
  formation: RANK3_DAY1_FORMATION,
  guideSlug: 'beta-rank3-deck-report',
  guideLinkLabel: BETA_RANK3_DECK_REPORT_LINK_LABEL,
};

const ZAPHIEL_MURASAME_LEONIS_FORMATION: BetaDeckFormationRows = [
  [null, null, null],
  ['leonis', 'zaphiel', null],
  ['murasame', null, null],
];

const ZAPHIEL_MURASAME_LEONIS_DECK: CharacterDeckRecommendation = {
  formation: ZAPHIEL_MURASAME_LEONIS_FORMATION,
  guideSlug: 'ranking-deck-zaphiel-murasame-leonis',
  guideLead: 'ランキング向け編成考察 →',
  guideLinkLabel: RANKING_DECK_ZAPHIEL_MURASAME_LEONIS_LINK_LABEL,
};

const NOEL_ZAPHIEL_ALFARD_FORMATION: BetaDeckFormationRows = [
  [null, null, 'alfard'],
  ['zaphiel', null, null],
  [null, 'noel', null],
];

const NOEL_ZAPHIEL_ALFARD_DECK: CharacterDeckRecommendation = {
  formation: NOEL_ZAPHIEL_ALFARD_FORMATION,
  guideSlug: 'ranking-deck-noel-zaphiel-alfard',
  guideLead: 'ランキング向け編成考察 →',
  guideLinkLabel: RANKING_DECK_NOEL_ZAPHIEL_ALFARD_LINK_LABEL,
};

/** キャラごとのおすすめデッキ（3×3 配置のみ） */
const BY_SLUG: Record<string, CharacterDeckRecommendation[]> = {
  tsubaki: [RANK3_DAY1_DECK],
  zaphiel: [ZAPHIEL_MURASAME_LEONIS_DECK],
  murasame: [ZAPHIEL_MURASAME_LEONIS_DECK],
  leonis: [RANK3_DAY1_DECK],
  dan: [RANK3_DAY1_DECK],
  noel: [NOEL_ZAPHIEL_ALFARD_DECK],
  alfard: [NOEL_ZAPHIEL_ALFARD_DECK],
};

const GUIDE_LINK_LABEL_BY_SLUG: Record<string, string> = {
  'beta-rank3-deck-report': BETA_RANK3_DECK_REPORT_LINK_LABEL,
  'ranking-deck-zaphiel-murasame-leonis': RANKING_DECK_ZAPHIEL_MURASAME_LEONIS_LINK_LABEL,
  'ranking-deck-noel-zaphiel-alfard': RANKING_DECK_NOEL_ZAPHIEL_ALFARD_LINK_LABEL,
};

export function getDeckGuideLinkLabel(deck: CharacterDeckRecommendation): string {
  if (deck.guideLinkLabel) return deck.guideLinkLabel;
  if (deck.guideSlug && GUIDE_LINK_LABEL_BY_SLUG[deck.guideSlug]) {
    return GUIDE_LINK_LABEL_BY_SLUG[deck.guideSlug];
  }
  return deck.guideSlug ?? '';
}

/** キャラページでは1編成のみ表示 */
export function getCharacterDeckRecommendations(slug: string): CharacterDeckRecommendation[] {
  const first = BY_SLUG[slug]?.[0];
  return first ? [first] : [];
}