# 技術スタック（確定版 v1）

**合意日:** 2026-11-13  
**対象:** BLAZE CROWN 攻略サイト（1 ゲーム特化・日本語）

## 結論

Astro（SSG）で攻略 MDX を静的公開する。コメントは Supabase と Cloudflare Pages Functions（Turnstile 検証）で実装する。ホスティングは Cloudflare Pages。

---

## 確定事項一覧

| 項目 | 内容 |
|------|------|
| フロント | Astro 5 + MDX + Tailwind CSS 4 |
| UI | React 19（島：`CommentsSection` 等） |
| コンテンツ | Content Collections + Zod |
| DB / 認証 | Supabase（PostgreSQL、Auth は **Google のみ**） |
| API | Cloudflare Pages Functions |
| ボット対策 | Cloudflare Turnstile（サーバー側検証必須） |
| 検索 | Pagefind |
| SEO | `@astrojs/sitemap`、JSON-LD |
| 分析 | GA4、Google Search Console |
| 広告 | Google AdSense（MVP は `AdSlot` プレースホルダ、審査後に本番タグ） |
| サイト範囲 | `blaze-crown` のみ（フォルダは将来ゲーム追加可能） |

---

## フロントエンド

| 項目 | 内容 |
|------|------|
| 記事 | 100% SSG。本文は初回 HTML に全文 |
| コメント UI | 記事末尾の React 島（`client:visible`） |
| 画像 | `astro:assets`、WebP、width / height 指定 |
| 広告 | `AdSlot` のみで配置 |

---

## コメント・認証

| 投稿者 | 入力 | DB `status` | 公開 |
|--------|------|-------------|------|
| 非ログイン | 表示名 + 本文 + Turnstile | `approved` | 即時（IP ごとに1分1回） |
| Google ログイン | 本文 + Turnstile | `approved` | 即時（ユーザーごとに1分1回） |
| 参照 | `GET /api/comments?article_id=...` | — | `approved` のみ |

- 書き込み: ブラウザ → Pages Function → Turnstile 検証 → Supabase（service role）
- 読み込み: RLS で `approved` のみ SELECT
- クライアントからの直接 INSERT と service role の露出は禁止
- 攻略記事を CSR のみ SPA にしない

---

## インフラ

```text
Git → Cloudflare Pages（Astro ビルド）
    → Pages Functions（/functions/api/*）
    → Supabase
    → Turnstile
```

| 環境変数 | 置き場所 |
|----------|----------|
| `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_TURNSTILE_SITE_KEY` | Pages |
| `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY` | Functions のみ |

---

## アドセンス

- `content/site/privacy.mdx` と `about.mdx` を公開
- 独自攻略 15〜30 ページ目安で申請
- Auto ads は審査通過後、CWV 計測後に検討
- 広告枠は `min-height` で CLS を抑制

## SEO

- 攻略 URL はすべて静的生成
- `title` / `description` / `updatedAt` を frontmatter で統一
- サイトマップ、canonical、パンくず、Article 構造化データ

---

## フォルダ構成

詳細は [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)。
