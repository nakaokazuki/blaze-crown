import fs from 'node:fs';
import path from 'node:path';
import { load as loadYaml } from 'js-yaml';

export type GameMeta = {
  name: string;
  slug: string;
  officialUrl?: string;
  officialSiteUrl?: string;
  downloadUrl?: string;
  description?: string;
  gameInfo?: string;
};

export function loadGameMeta(slug: string): GameMeta {
  const file = path.join(process.cwd(), 'content', 'games', slug, '_meta.yaml');
  const raw = fs.readFileSync(file, 'utf-8');
  const data = loadYaml(raw) as GameMeta;
  return { ...data, slug };
}
