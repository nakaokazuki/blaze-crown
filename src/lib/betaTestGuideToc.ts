import type { InPageTocItem } from '../components/layout/WikiInPageToc.astro';

/** βテストガイド MDX 見出しの自動 id（ビルド出力と一致）— 目次は h2 のみ */
export const BETA_TEST_GUIDE_TOC: InPageTocItem[] = [
  { label: 'βテストとは', href: '#βテストとは' },
  { label: 'βテストの最強デッキ予想TOP5', href: '#βテストの最強デッキ予想top5' },
  { label: 'βに参加していない人向け', href: '#βに参加していない人向け' },
  { label: '関連リンク', href: '#関連リンク' },
];