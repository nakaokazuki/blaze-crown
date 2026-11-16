import type { InPageTocItem } from '../components/layout/WikiInPageToc.astro';

/** βテストガイド MDX 見出しの自動 id（ビルド出力と一致） */
export const BETA_TEST_GUIDE_TOC: InPageTocItem[] = [
  { label: 'βテストとは', href: '#βテストとは' },
  { label: 'βテストのポイント', href: '#βテストのポイント' },
  { label: 'バトル・デッキの前提', href: '#バトルデッキの前提' },
  {
    label: '最強デッキTOP5',
    href: '#最強デッキtop5',
    children: [
      { label: '1位：王女護衛・エナジー循環', href: '#1位王女護衛エナジー循環ルミナ--ダン--ノエル' },
      { label: '2位：シンエン先制コンボ', href: '#2位シンエン先制コンボツバキ--ムラサメ--カゲトラ' },
      { label: '3位：背水リベンジ', href: '#3位背水リベンジフレイ--ダン--ノエル' },
      { label: '4位：傭兵団・頭数オーバーロード', href: '#4位傭兵団頭数オーバーロードアルファルド--ザフィール--ダン' },
      { label: '5位：斬鉄カウンター', href: '#5位斬鉄カウンターカゲトラ--ノエル--ダン' },
      { label: 'TOP5に入らなかったが有力なシングル軸', href: '#top5に入らなかったが有力なシングル軸' },
    ],
  },
  { label: 'キャラクターの追加スケジュール', href: '#キャラクターの追加スケジュール' },
  { label: 'βに参加していない人向け', href: '#βに参加していない人向け' },
  { label: '対応端末の目安', href: '#対応端末の目安' },
  { label: 'ランキング賞品', href: '#ランキング賞品' },
  { label: '参加時の注意', href: '#参加時の注意' },
  { label: 'まだ未確定・要公式確認', href: '#まだ未確定要公式確認' },
  { label: '関連リンク', href: '#関連リンク' },
];