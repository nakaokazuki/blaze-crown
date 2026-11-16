import fs from 'node:fs';
import path from 'node:path';
import { load as loadYaml } from 'js-yaml';

export type RecruitTemplate = {
  id: string;
  label: string;
  body: string;
};

type RecruitTemplatesFile = {
  templates?: RecruitTemplate[];
};

let cache: RecruitTemplate[] | null = null;

export function loadRecruitTemplates(): RecruitTemplate[] {
  if (cache) return cache;
  const file = path.join(
    process.cwd(),
    'content/games/blaze-crown/data/recruit-templates.yaml',
  );
  const raw = fs.readFileSync(file, 'utf-8');
  const data = loadYaml(raw) as RecruitTemplatesFile;
  cache = data.templates ?? [];
  return cache;
}
