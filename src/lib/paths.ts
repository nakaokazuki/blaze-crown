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

export function guidesIndexPath(game: string): string {
  return `/games/${game}/guides/`;
}

export function guidePath(game: string, slug: string): string {
  return `/games/${game}/guides/${slug}/`;
}

/** Supabase / API 用の記事 ID */
export function articleId(game: string, slug: string): string {
  return `${game}/guides/${slug}`;
}
