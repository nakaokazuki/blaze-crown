/** キャラページ「使い方のコツ」（安全な限定的 HTML: strong のみ） */
const BY_SLUG: Record<string, string> = {
  tsubaki:
    '<strong>SPD</strong>が最速なので先手を取りやすい。序盤は攻撃回数を稼いでスペシャル<strong>天照</strong>を解放し、<strong>激流の術</strong>で単体を起点に周囲へスタンを広げる。HP602と低いので狙われると序盤に倒されることに注意。',
  leonis:
    '<strong>パリィングソード</strong>と<strong>セイクリッドピアース</strong>は2ターンとクールタイムが長いので使うタイミングが重要。唯一の仲間を回復できる <strong>ロイヤルヒール</strong> で前衛を立てると活躍しやすい。',
};

export function getCharacterPlayTips(slug: string): string | undefined {
  return BY_SLUG[slug];
}