/**
 * 公式サイト・攻略Wiki・公式Xを取得し、ブレイズクラウンの最新情報を要約する。
 * 実行: npm run blazecrown
 */
import fs from 'node:fs';
import path from 'node:path';
import { load as loadYaml } from 'js-yaml';

const WIKI_INDEX = 'https://blazecrown-game.com/wiki/index.html';
const OFFICIAL_SITE = 'https://blazecrown-game.com/';
const X_SCREEN_NAME = process.env.BLAZECROWN_X_USER ?? 'BLAZECROWN_JP';
const X_PROFILE_URL = `https://x.com/${X_SCREEN_NAME}`;
const FX_USER_API = `https://api.fxtwitter.com/${X_SCREEN_NAME}`;
const JINA_X_READER = `https://r.jina.ai/${X_PROFILE_URL}`;

const KNOWN_CHARA_SLUGS = new Set([
  'lumina',
  'dan',
  'frey',
  'tsubaki',
  'kagetora',
  'murasame',
  'noel',
  'leonis',
  'zaphiel',
  'alphard',
]);

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function markdownToPlain(md) {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\]\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/[#*`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCharaLinks(html) {
  const slugs = new Set();
  const re = /chara\/([a-z0-9_]+)\.html/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const s = m[1].toLowerCase();
    if (s !== 'index') slugs.add(s);
  }
  return [...slugs].sort();
}

function extractBetaSnippets(text) {
  const lines = [];
  const patterns = [
    /βテスト[^。]*。?/g,
    /20\d{2}年\d{1,2}月\d{1,2}日[^。]*。?/g,
    /開始時\d+体[^。]*。?/g,
    /\d{1,2}\/\d{1,2}[^。]*追加[^。]*。?/g,
    /育成[^。]*。?/g,
    /チュートリアル[^。]*。?/g,
  ];
  for (const re of patterns) {
    for (const hit of text.match(re) ?? []) {
      const t = hit.trim();
      if (t.length > 8 && t.length < 200) lines.push(t);
    }
  }
  return [...new Set(lines)].slice(0, 12);
}

function parseXPostsFromJina(markdown, limit = 5) {
  const idx = markdown.indexOf("’s posts");
  const body = idx >= 0 ? markdown.slice(idx) : markdown;
  const chunks = body.split(/\n\*\s+\[/).slice(1);
  const posts = [];
  for (const chunk of chunks) {
    const plain = markdownToPlain(chunk);
    if (plain.length < 15) continue;
    posts.push(plain.slice(0, 280));
    if (posts.length >= limit) break;
  }
  return posts;
}

function extractXKeywords(posts) {
  const joined = posts.join(' ');
  const keys = [];
  if (/ランキング|入賞|ギフト|プレゼント|Amazon/.test(joined)) {
    keys.push('ランキング・賞品キャンペーン');
  }
  if (/βテスト|CBT|クローズド/.test(joined)) keys.push('βテスト告知');
  if (/メンテ|不具合|お詫び|障害/.test(joined)) keys.push('メンテ・障害');
  if (/新キャラ|追加|シルエット/.test(joined)) keys.push('キャラ追加');
  if (/事前予約|リリース/.test(joined)) keys.push('事前予約・リリース');
  return keys;
}

function loadLocalNews(root) {
  const p = path.join(root, 'content/games/blaze-crown/latest-news.yaml');
  if (!fs.existsSync(p)) return [];
  const doc = loadYaml(fs.readFileSync(p, 'utf-8'));
  return doc?.items ?? [];
}

function loadWikiJson(root) {
  const p = path.join(root, 'content/games/blaze-crown/data/character-wiki.json');
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function suggestArticles({ newSlugs, betaSnippets, localNews, xPosts, xKeywords }) {
  const picks = [];
  const today = new Date().toISOString().slice(0, 10);

  if (newSlugs.length > 0) {
    picks.push(
      `[P1] 新キャラ速報: ${newSlugs.join(', ')} — キャラページ・デッキ記事の見直し`,
    );
  }

  for (const s of betaSnippets) {
    if (/チュートリアル/.test(s) && /なし|ありません/.test(s)) {
      picks.push('[P1] チュートリアルなし向け「初日の読む順」記事（公式と突合済みの訴求）');
      break;
    }
  }

  if (xKeywords.includes('ランキング・賞品キャンペーン')) {
    picks.push('[P1] CBTランキング賞品・Xキャンペーンをβガイド／単独記事に反映');
  }
  if (xKeywords.includes('βテスト告知')) {
    picks.push('[P2] 公式Xのβ告知と latest-news / βガイドの日付・文言を突合');
  }
  if (xKeywords.includes('メンテ・障害')) {
    picks.push('[P1] メンテ・障害お知らせの要約（参加注意に追記）');
  }

  const topNews = localNews[0];
  if (topNews?.date >= today || topNews?.title?.includes('β')) {
    picks.push(`[P2] latest-news 先頭「${topNews.title}」を記事／トップに反映したか確認`);
  }

  if (xPosts?.[0] && !picks.some((p) => p.includes('X'))) {
    picks.push(`[P2] 最新投稿の要約: ${xPosts[0].slice(0, 60)}… → news またはガイドへ`);
  }

  if (picks.length === 0) {
    picks.push('[P2] 公式に大きな差分なし — 実測デッキ・フレンド戦立ち回りなど自前ネタを検討');
  }

  return [...new Set(picks)];
}

async function fetchText(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      'User-Agent': 'blaze-crown-site-check/1.0',
      ...init.headers,
    },
  });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

async function fetchOfficialX() {
  const out = { profile: null, posts: [], error: null };

  try {
    const res = await fetch(FX_USER_API, {
      headers: { 'User-Agent': 'blaze-crown-site-check/1.0' },
    });
    const data = await res.json();
    if (data?.code === 200 && data.user) {
      out.profile = {
        name: data.user.name,
        description: data.user.description?.replace(/\n/g, ' ').trim(),
        tweets: data.user.tweets,
        followers: data.user.followers,
        url: data.user.url,
      };
    }
  } catch (e) {
    out.error = `プロフィールAPI: ${e.message}`;
  }

  try {
    const md = await fetchText(JINA_X_READER, {
      headers: { Accept: 'text/plain' },
    });
    out.posts = parseXPostsFromJina(md, 5);
    if (out.posts.length === 0) out.error ??= '投稿の解析結果が空';
  } catch (e) {
    out.error = [out.error, `投稿取得: ${e.message}`].filter(Boolean).join(' / ');
  }

  return out;
}

async function main() {
  const root = process.cwd();
  const fetchedAt = new Date().toISOString();

  console.log(`=== /blazecrown 最新情報チェック ${fetchedAt} ===\n`);

  let wikiHtml;
  try {
    wikiHtml = await fetchText(WIKI_INDEX);
  } catch (e) {
    console.error('公式攻略Wikiを取得できませんでした:', e.message);
    process.exit(1);
  }

  const wikiText = stripTags(wikiHtml);
  const charaSlugs = extractCharaLinks(wikiHtml);
  const newSlugs = charaSlugs.filter((s) => !KNOWN_CHARA_SLUGS.has(s));
  const betaSnippets = extractBetaSnippets(wikiText);

  console.log('--- 公式攻略Wiki（要約） ---');
  console.log(`URL: ${WIKI_INDEX}`);
  for (const line of betaSnippets) console.log(`・${line}`);
  console.log(`・Wiki上のキャラページリンク: ${charaSlugs.length} 件 (${charaSlugs.join(', ') || 'なし'})`);
  if (newSlugs.length) {
    console.log(`・**当サイト未取込みの公式 slug**: ${newSlugs.join(', ')}`);
  }
  console.log();

  let siteOk = false;
  try {
    const siteHtml = await fetchText(OFFICIAL_SITE);
    const title = siteHtml.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim();
    if (title) {
      console.log('--- 公式サイト ---');
      console.log(`URL: ${OFFICIAL_SITE}`);
      console.log(`・タイトル: ${title}`);
      siteOk = true;
      console.log();
    }
  } catch {
    console.log('（公式サイトトップはスキップ: 取得失敗）\n');
  }

  console.log(`--- 公式X @${X_SCREEN_NAME} ---`);
  console.log(`URL: ${X_PROFILE_URL}`);
  const x = await fetchOfficialX();
  if (x.profile) {
    console.log(`・${x.profile.name}`);
    if (x.profile.description) console.log(`・プロフィール: ${x.profile.description}`);
    console.log(`・投稿数: ${x.profile.tweets} / フォロワー: ${x.profile.followers}`);
  }
  if (x.posts.length) {
    console.log('・直近の投稿（要約）:');
    x.posts.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
    const keys = extractXKeywords(x.posts);
    if (keys.length) console.log(`・トピック: ${keys.join('、')}`);
  } else if (x.error) {
    console.log(`・取得エラー: ${x.error}`);
    console.log(`・ブラウザで ${X_PROFILE_URL} を確認してください`);
  }
  console.log();

  const localNews = loadLocalNews(root);
  const wikiJson = loadWikiJson(root);

  console.log('--- 当サイトとの突合 ---');
  if (localNews[0]) {
    console.log(
      `・latest-news 最新: ${localNews[0].date} — ${localNews[0].title}`,
    );
  }
  if (wikiJson?.characters?.length) {
    const dates = wikiJson.characters.map((c) => c.syncedAt).filter(Boolean);
    const maxSync = dates.length ? dates.sort().at(-1) : '不明';
    console.log(
      `・character-wiki.json: ${wikiJson.characters.length} 体（最終同期日: ${maxSync}）`,
    );
  } else {
    console.log('・character-wiki.json: 未生成 — `npm run wiki:sync-characters` 推奨');
  }
  console.log();

  const xKeywords = extractXKeywords(x.posts);

  console.log('--- 記事化ピックアップ（今回の調査ベース） ---');
  for (const line of suggestArticles({
    newSlugs,
    betaSnippets,
    localNews,
    xPosts: x.posts,
    xKeywords,
  })) {
    console.log(line);
  }

  const picksPath = path.join(root, 'scripts/blazecrown-picks.txt');
  if (fs.existsSync(picksPath)) {
    console.log('\n--- 定番候補（blazecrown-picks.txt） ---');
    console.log(
      fs
        .readFileSync(picksPath, 'utf-8')
        .split('\n')
        .filter((l) => l.startsWith('[P'))
        .join('\n'),
    );
  }

  if (!siteOk && newSlugs.length === 0 && !x.posts.length) {
    console.log('\n（公式Xの取得に失敗した場合はネットワークを確認してください）');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});