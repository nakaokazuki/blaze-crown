import type { CharacterWikiEntry } from './characterWiki';

export type TocItem = { label: string; href: string; children?: TocItem[] };

export function buildCharacterPageToc(characterName: string, wiki?: CharacterWikiEntry): TocItem[] {
  const statsLabel = `${characterName}の性能`;
  const items: TocItem[] = [
    {
      label: `${characterName}の基本情報`,
      href: '#section-basic-info',
    },
    {
      label: `${characterName}の評価`,
      href: '#section-review',
      children: [
        { label: 'おすすめデッキ', href: '#section-deck' },
        { label: '使い方のコツ', href: '#section-tips' },
      ],
    },
  ];

  if (wiki) {
    const children: TocItem[] = [];
    if (wiki.role) children.push({ label: '役割', href: '#section-role' });
    if (wiki.passive) children.push({ label: '固有パッシブ', href: '#section-passive' });
    if (wiki.skills.length > 0) children.push({ label: 'スキルカード', href: '#section-skills' });
    if (wiki.special) children.push({ label: 'スペシャルスキル', href: '#section-special' });
    items.push({
      label: statsLabel,
      href: '#section-stats',
      ...(children.length > 0 ? { children } : {}),
    });
  }

  return items;
}
