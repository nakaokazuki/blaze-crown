/** キャラページ「使い方のコツ」（安全な限定的 HTML: strong のみ） */
const BY_SLUG: Record<string, string> = {
  tsubaki:
    '<strong>SPD</strong>が最速なので先手を取りやすい。序盤は攻撃回数を稼いでスペシャル<strong>天照</strong>を解放し、<strong>激流の術</strong>で単体を起点に周囲へスタンを広げる。HP602と低いので狙われると序盤に倒されることに注意。',
  leonis:
    '<strong>パリィングソード</strong>と<strong>セイクリッドピアース</strong>は2ターンとクールタイムが長いので使うタイミングが重要。唯一の仲間を回復できる <strong>ロイヤルヒール</strong> で前衛を立てると活躍しやすい。',
  zaphiel:
    '不利な相手や厄介なキャラは、陣形を無視して当てられる<strong>スコーピオンテイル</strong>で狙い撃ちしやすい。必要エナジーが6と重いので、<strong>サンドバイパー</strong>で相手のエナジーを削りつつ自身のエナジーを無駄に使わず、撃ちどきまで溜める<strong>エナジー管理</strong>が重要なキャラ。',
  murasame:
    'パッシブ<strong>神速</strong>で<strong>SPD</strong>が高く、コスト2以下の技が強化される。<strong>鬼哭</strong>・<strong>神断</strong>は陣形を無視して背後や左右にも届くので、前列だけ厚い編成に火力を通しやすい。<strong>乱刃</strong>・<strong>舞花</strong>で削りを入れたうえで、被弾を計算してスペシャル<strong>鬼神乱舞</strong>を早めに解放し、<strong>迅速</strong>の一連攻撃で時間切れ前に決着を取る動きが定石。',
};

export function getCharacterPlayTips(slug: string): string | undefined {
  return BY_SLUG[slug];
}