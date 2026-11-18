import { getCollection } from 'astro:content';
import { loadCharacters, type Character } from './characters';
import { characterPath, guidePath } from './paths';

export type GuideListItem = {
  slug: string;
  title: string;
  href: string;
  publishedAt: Date;
  updatedAt: Date;
  description?: string;
};

function toListItem(g: Awaited<ReturnType<typeof getCollection<'guides'>>>[number]): GuideListItem {
  return {
    slug: g.id,
    title: g.data.title,
    href: guidePath(g.data.game, g.id),
    publishedAt: g.data.publishedAt,
    updatedAt: g.data.updatedAt,
    description: g.data.description,
  };
}

function characterToListItem(game: string, c: Character): GuideListItem {
  const title = `${c.name}の評価と性能`;
  const publishedAt = new Date(c.availableFrom);
  return {
    slug: `character-${c.slug}`,
    title,
    href: characterPath(game, c.slug),
    publishedAt,
    updatedAt: publishedAt,
    description: c.detail,
  };
}

function publishedCharacterItems(game: string): GuideListItem[] {
  return loadCharacters(game)
    .filter((c) => c.published)
    .map((c) => characterToListItem(game, c));
}

/** 攻略記事一覧用：攻略 MDX ＋ 公開キャラ個別ページ（公開日の新しい順。更新日は並びに使わない） */
export async function getGuidesSortedByUpdate(game?: string): Promise<GuideListItem[]> {
  const guides = await getCollection('guides');
  const guideItems = guides.filter((g) => !game || g.data.game === game).map(toListItem);
  const charItems = game ? publishedCharacterItems(game) : [];
  return [...guideItems, ...charItems].sort(
    (a, b) => b.publishedAt.valueOf() - a.publishedAt.valueOf(),
  );
}

/** 人気記事サイドバー用：攻略 MDX ＋ 公開キャラの上位 N 件（featured 優先 → 更新日） */
export async function getPopularGuides(game?: string, limit = 10): Promise<GuideListItem[]> {
  const guides = await getCollection('guides');
  type Ranked = GuideListItem & { featured: boolean };
  const guideItems: Ranked[] = guides
    .filter((g) => !game || g.data.game === game)
    .map((g) => ({ ...toListItem(g), featured: g.data.featured }));
  const charItems: Ranked[] = (game ? publishedCharacterItems(game) : []).map((item) => ({
    ...item,
    featured: false,
  }));
  return [...guideItems, ...charItems]
    .sort((a, b) => {
      const featuredDiff = Number(b.featured) - Number(a.featured);
      if (featuredDiff !== 0) return featuredDiff;
      return b.updatedAt.valueOf() - a.updatedAt.valueOf();
    })
    .slice(0, limit)
    .map(({ featured: _featured, ...item }) => item);
}
