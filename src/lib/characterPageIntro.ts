/** キャラページ冒頭 intro（未設定はテンプレにフォールバック） */
const BY_SLUG: Record<string, string> = {
  tsubaki:
    'SPD最速級で先手を取りやすく、攻撃回数を重ねてスペシャル天照を解放し、激流の術で単体を起点に周囲へスタンを広げるスタン役です。HP602と脆いので立ち位置が重要で、当サイトでは初日ランキング3位編成（ツバキ・レオニス・ダン）の陣形例と合わせて解説しています。',
};

export function getCharacterPageIntro(slug: string): string | undefined {
  return BY_SLUG[slug];
}