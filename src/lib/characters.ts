import fs from 'node:fs';
import path from 'node:path';
import { load as loadYaml } from 'js-yaml';

export type Character = {
  slug: string;
  name: string;
  /** 攻撃型・防御型など */
  roleType?: string;
  availableFrom: string;
  published: boolean;
  /** 一覧・詳細ページ用の説明 */
  detail?: string;
  /** 編成向けの暫定評価（例: S / 準備中） */
  rating?: string;
  /** 立ち絵（省略時は blaze-crown の公開キャラで `public/.../standing.png` を参照） */
  imageSrc?: string;
  /** スペシャルスキル用カットイン（省略時は `public/.../cutin.png`） */
  cutinSrc?: string;
};

type CharactersFile = {
  characters?: Character[];
};

function withDefaultMedia(game: string, character: Character): Character {
  if (game !== 'blaze-crown' || !character.published) return character;
  const base = `/games/${game}/characters/${character.slug}`;
  return {
    ...character,
    imageSrc: character.imageSrc ?? `${base}/standing.png`,
    cutinSrc: character.cutinSrc ?? `${base}/cutin.png`,
  };
}

export function loadCharacters(game: string): Character[] {
  const file = path.join(process.cwd(), 'content', 'games', game, 'data', 'characters.yaml');
  const raw = fs.readFileSync(file, 'utf-8');
  const data = loadYaml(raw) as CharactersFile;
  return (data.characters ?? []).map((c) => withDefaultMedia(game, c));
}

/** キャラ個別ページの「最終更新」表示用（Wiki 同期日 → なければ配布開始日） */
export function getCharacterPageUpdatedAt(character: Character, wikiSyncedAt?: string): Date {
  if (wikiSyncedAt) {
    const synced = new Date(wikiSyncedAt);
    if (!Number.isNaN(synced.getTime())) return synced;
  }
  return new Date(character.availableFrom);
}
