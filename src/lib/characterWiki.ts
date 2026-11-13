import fs from 'node:fs';
import path from 'node:path';

export type WikiSkill = {
  kind?: string;
  name?: string;
  cost?: string;
  ct?: string;
  element?: string;
  skillType?: string;
  level?: string;
  effect?: string;
  unlockCondition?: string;
  /** 将来用。未設定時はプレースホルダ表示（公式画像は同期しない） */
  imageSrc?: string;
};

export type WikiPassive = {
  name?: string;
  level?: string;
  description?: string;
};

export type CharacterWikiEntry = {
  slug: string;
  officialSlug: string;
  sourceUrl: string;
  lead?: string;
  nameEn?: string;
  job?: string;
  roleType?: string;
  targetLevel?: string;
  profile: Record<string, string | { value: string; note?: string }>;
  role?: string;
  statsNote?: string;
  passive?: WikiPassive;
  skills: WikiSkill[];
  special?: WikiSkill;
  syncedAt?: string;
};

type CharacterWikiFile = {
  source: string;
  note: string;
  characters: CharacterWikiEntry[];
};

let cache: Map<string, CharacterWikiEntry> | null = null;

function loadAll(): Map<string, CharacterWikiEntry> {
  if (cache) return cache;
  const file = path.join(process.cwd(), 'content/games/blaze-crown/data/character-wiki.json');
  const raw = fs.readFileSync(file, 'utf-8');
  const data = JSON.parse(raw) as CharacterWikiFile;
  cache = new Map(data.characters.map((c) => [c.slug, c]));
  return cache;
}

export function loadCharacterWiki(slug: string): CharacterWikiEntry | undefined {
  return loadAll().get(slug);
}

export function formatProfileValue(
  value: string | { value: string; note?: string },
): { main: string; sub?: string } {
  if (typeof value === 'string') return { main: value };
  return { main: value.value, sub: value.note };
}
