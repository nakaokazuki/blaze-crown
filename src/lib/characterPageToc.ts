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
    },
  ];

  if (wiki) {
    items.push({
      label: statsLabel,
      href: '#section-stats',
    });
  }

  return items;
}
