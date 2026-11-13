import fs from 'node:fs';
import path from 'node:path';
import { load as loadYaml } from 'js-yaml';

export type LatestNewsItem = {
  date: string;
  title: string;
  body?: string;
  href?: string;
};

export function loadLatestNews(game: string): LatestNewsItem[] {
  const file = path.join(process.cwd(), 'content', 'games', game, 'latest-news.yaml');
  const raw = fs.readFileSync(file, 'utf-8');
  const data = loadYaml(raw) as { items?: LatestNewsItem[] };
  const items = data.items ?? [];
  return [...items].sort((a, b) => b.date.localeCompare(a.date));
}

export function getLatestNews(game: string, limit?: number): LatestNewsItem[] {
  const sorted = loadLatestNews(game);
  return limit === undefined ? sorted : sorted.slice(0, limit);
}
