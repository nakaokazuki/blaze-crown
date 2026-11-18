import { characterPath } from './paths';

/** スキルカード・スペシャル見出し用 id（キャラページとリンク先を揃える） */
export function characterSkillAnchorId(skillName: string): string {
  return `skill-${skillName.trim()}`;
}

/** 固有パッシブ見出し用 id */
export function characterPassiveAnchorId(passiveName: string): string {
  return `passive-${passiveName.trim()}`;
}

export function characterSkillHref(
  game: string,
  characterSlug: string,
  skillName: string,
): string {
  return `${characterPath(game, characterSlug)}#${characterSkillAnchorId(skillName)}`;
}

export function characterPassiveHref(
  game: string,
  characterSlug: string,
  passiveName: string,
): string {
  return `${characterPath(game, characterSlug)}#${characterPassiveAnchorId(passiveName)}`;
}