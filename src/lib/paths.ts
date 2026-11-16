import { DEFAULT_GAME } from './constants';

export function gameHubPath(game: string): string {
  if (game === DEFAULT_GAME) return '/';
  return `/games/${game}/`;
}

export function charactersHubPath(game: string): string {
  return `${gameHubPath(game)}#section-characters`;
}

export function characterPath(game: string, slug: string): string {
  return `/games/${game}/characters/${slug}/`;
}

export function newsHubPath(game: string): string {
  return `${gameHubPath(game)}#section-news`;
}

/** パンくず「攻略記事」用（TOP へ。一覧はサイドの攻略記事一覧） */
export function guidesIndexPath(game: string): string {
  return gameHubPath(game);
}

export function guidePath(game: string, slug: string): string {
  return `/games/${game}/guides/${slug}/`;
}

/** Supabase / API 用の記事 ID */
export function articleId(game: string, slug: string): string {
  return `${game}/guides/${slug}`;
}
