/**
 * 本番（または dist）の robots.txt・サイトマップを確認する。
 * 実行: npm run seo:verify
 * ローカル dist を見る: npm run seo:verify -- --local
 */
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://blaze-crown.com';
const SITEMAP_INDEX = `${SITE}/sitemap-index.xml`;
const ROBOTS = `${SITE}/robots.txt`;
const useLocal = process.argv.includes('--local');
const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`✓ ${msg}`);
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: 'follow' });
  const body = await res.text();
  return { ok: res.ok, status: res.status, type: res.headers.get('content-type') ?? '', body };
}

async function main() {
  console.log(useLocal ? 'Checking dist/ …' : `Checking ${SITE} …\n`);

  let robotsBody;
  let sitemapBody;

  if (useLocal) {
    try {
      await access(path.join(distDir, 'robots.txt'));
      robotsBody = await readFile(path.join(distDir, 'robots.txt'), 'utf8');
      sitemapBody = await readFile(path.join(distDir, 'sitemap-index.xml'), 'utf8');
    } catch {
      fail('dist に robots.txt / sitemap-index.xml がありません。先に npm run build を実行してください。');
      return;
    }
  } else {
    const robots = await fetchText(ROBOTS);
    if (!robots.ok) {
      fail(`robots.txt が取得できません（HTTP ${robots.status}）`);
      return;
    }
    if (robots.body.trim().startsWith('<!')) {
      fail('robots.txt が HTML になっています。本番に public/robots.txt が未デプロイの可能性があります。');
      return;
    }
    robotsBody = robots.body;

    const sm = await fetchText(SITEMAP_INDEX);
    if (!sm.ok) {
      fail(`sitemap-index.xml が取得できません（HTTP ${sm.status}）`);
      return;
    }
    sitemapBody = sm.body;
  }

  if (!/Sitemap:\s*https:\/\/blaze-crown\.com\/sitemap-index\.xml/i.test(robotsBody)) {
    fail('robots.txt にサイトマップ URL がありません');
  } else {
    ok('robots.txt にサイトマップ URL あり');
  }

  let urlset = sitemapBody;
  if (useLocal) {
    try {
      urlset = await readFile(path.join(distDir, 'sitemap-0.xml'), 'utf8');
    } catch {
      /* fallback */
    }
  } else {
    const child = await fetchText(`${SITE}/sitemap-0.xml`);
    if (child.ok) urlset = child.body;
  }

  if (!urlset.includes('<loc>https://blaze-crown.com/</loc>')) {
    fail('サイトマップにトップ URL がありません');
  } else {
    ok('サイトマップにトップページあり');
  }

  if (urlset.includes('/search')) {
    fail('サイトマップに /search が含まれています');
  } else {
    ok('サイトマップから /search は除外済み');
  }

  console.log('\n--- Google Search Console（アカウントで1回）---');
  console.log('1. https://search.google.com/search-console — プロパティ追加（URL プレフィックス）:', SITE);
  console.log('2. 所有権: HTML タグ → content を .env の PUBLIC_GOOGLE_SITE_VERIFICATION に入れてデプロイ');
  console.log('   （代替: Cloudflare DNS に TXT google-site-verification=… を追加）');
  console.log('3. サイトマップ送信:', SITEMAP_INDEX);
  console.log('4. 数日後: site:blaze-crown.com でインデックス確認');
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});