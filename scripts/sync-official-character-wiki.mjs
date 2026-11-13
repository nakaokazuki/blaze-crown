/**
 * 公式攻略Wiki（blazecrown-game.com/wiki）からキャラ詳細を取得し JSON を生成する。
 * スキル画像は公式から取得しない（サイト上はプレースホルダ）。
 * 実行: npm run wiki:sync-characters
 */
import fs from 'node:fs';
import path from 'node:path';

const WIKI_BASE = 'https://blazecrown-game.com/wiki/chara';

/** 公式 slug → 当サイト slug */
const SLUG_MAP = {
  lumina: 'lumina',
  dan: 'dan',
  frey: 'frei',
  tsubaki: 'tsubaki',
  kagetora: 'kagetra',
  murasame: 'murasame',
  noel: 'noel',
  leonis: 'leonis',
  zaphiel: 'zaphiel',
  alphard: 'alfard',
};

function decodeHtml(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(html) {
  return decodeHtml(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function formatSkillEffect(html) {
  const inner = matchOne(html, /<p class="skill-text">([\s\S]*?)<\/p>/) ?? html;
  const lineChunks = inner
    .split(/<span class="line">/)
    .map((s) => s.replace(/<\/span>\s*/g, ' ').trim())
    .filter(Boolean);
  const parts = (lineChunks.length ? lineChunks : [inner]).map((chunk) =>
    stripTags(
      chunk
        .replace(/<span class="tgt">([^<]*)<\/span>/g, '$1')
        .replace(/<b class="val">/g, '')
        .replace(/<\/b>/g, ''),
    ),
  );
  return parts.filter(Boolean).join(' / ');
}

function matchOne(html, re) {
  const m = html.match(re);
  return m ? m[1].trim() : undefined;
}

function parseSkillBlock(block) {
  const kind = matchOne(block, /<span class="skill-kind">([^<]*)<\/span>/);
  const name = matchOne(block, /<h3 class="skill-name">([^<]*)<\/h3>/);
  const cost = matchOne(block, /<span class="cost"[^>]*>コスト <b>([^<]*)<\/b>/);
  const ct = matchOne(block, /<span class="ct"[^>]*>CT <b>([^<]*)<\/b>/);
  const element = matchOne(block, /<span class="el el-[^"]*">([^<]*)<\/span>/);
  const skillType = matchOne(block, /<span class="stype">([^<]*)<\/span>/);
  const level = matchOne(block, /<span class="slv">([^<]*)<\/span>/);
  const effect = block.includes('skill-text') ? formatSkillEffect(block) : '';
  const unlock = matchOne(block, /<p class="skill-cond"><span>解放条件<\/span>([^<]*)<\/p>/);

  const skill = { kind, name, cost, ct, element, skillType, level, effect };
  if (unlock) skill.unlockCondition = unlock.trim();
  return skill;
}

function parseCharacterHtml(html, officialSlug) {
  const lead = matchOne(html, /<p class="lead">([^<]*)<\/p>/);
  const nameEn = matchOne(html, /<p class="profile-en">([^<]*)<\/p>/);
  const job = matchOne(html, /<p class="profile-job">([^<]*)<\/p>/);
  const roleType = matchOne(html, /<span class="chip t-[^"]*">([^<]*)<\/span>/);
  const targetLevel = matchOne(html, /<span class="chip-lv[^"]*">([^<]*)<\/span>/);

  const profile = {};
  const dlBlock = matchOne(html, /<dl class="profile-dl">([\s\S]*?)<\/dl>/);
  if (dlBlock) {
    const rows = [...dlBlock.matchAll(/<dt>([^<]*)<\/dt><dd>([\s\S]*?)<\/dd>/g)];
    for (const [, dt, ddHtml] of rows) {
      const main = matchOne(ddHtml, /<b>([^<]*)<\/b>/);
      const sub = matchOne(ddHtml, /<small>([^<]*)<\/small>/);
      profile[dt] = sub ? { value: main ?? stripTags(ddHtml), note: sub } : (main ?? stripTags(ddHtml));
    }
  }

  const role = matchOne(html, /<p class="role-text">([^<]*)<\/p>/);
  const statsNote = matchOne(html, /<p class="note">([^<]*)<\/p>/);

  const passiveBlock = matchOne(html, /<div class="passive">([\s\S]*?)<\/div>/);
  let passive;
  if (passiveBlock) {
    const passiveName = matchOne(passiveBlock, /<h3 class="passive-name">([^<]*)/);
    const nameOnly = passiveName?.replace(/<span[\s\S]*$/, '').trim();
    const passiveLevel = matchOne(passiveBlock, /<span class="slv">([^<]*)<\/span>/);
    const body = matchOne(passiveBlock, /<p>([\s\S]*?)<\/p>/);
    passive = {
      name: nameOnly,
      level: passiveLevel,
      description: body
        ? stripTags(body.replace(/<br\s*\/?>/gi, ' / ').replace(/<b class="val">/g, '').replace(/<\/b>/g, ''))
        : '',
    };
  }

  const skillGrid = matchOne(html, /<div class="skill-grid">([\s\S]*?)<\/div>\s*\n\s*<h2 id="special">/);
  const skills = [];
  if (skillGrid) {
    const blocks = [...skillGrid.matchAll(/<div class="skill has-art">([\s\S]*?)<\/div>\s*<\/div>/g)];
    for (const [, inner] of blocks) {
      skills.push(parseSkillBlock(`<div class="skill">${inner}</div></div>`));
    }
  }

  const specialBlock = matchOne(html, /<h2 id="special">[\s\S]*?<div class="skill is-sp has-art">([\s\S]*?)<\/div>\s*<\/div>/);
  const special = specialBlock ? parseSkillBlock(`<div class="skill">${specialBlock}</div></div>`) : undefined;

  return {
    slug: SLUG_MAP[officialSlug],
    officialSlug,
    sourceUrl: `${WIKI_BASE}/${officialSlug}.html`,
    lead,
    nameEn,
    job,
    roleType,
    targetLevel,
    profile,
    role,
    statsNote,
    passive,
    skills,
    special,
    syncedAt: new Date().toISOString().slice(0, 10),
  };
}

async function main() {
  const entries = [];
  for (const officialSlug of Object.keys(SLUG_MAP)) {
    const url = `${WIKI_BASE}/${officialSlug}.html`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
    const html = await res.text();
    const entry = parseCharacterHtml(html, officialSlug);
    entries.push(entry);
    console.log(`OK ${officialSlug} → ${SLUG_MAP[officialSlug]}`);
  }

  const out = {
    source: 'https://blazecrown-game.com/wiki/',
    note: 'βテスト版の情報。数値はキャラLv.10・スキルLv.3・スペシャルLv.2・パッシブLv.2想定（各ページ表記に準拠）。',
    characters: entries,
  };

  const outPath = path.join(process.cwd(), 'content/games/blaze-crown/data/character-wiki.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf-8');
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
