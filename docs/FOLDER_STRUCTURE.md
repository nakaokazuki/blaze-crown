# フォルダ構成（確定版 v1）

[TECH_STACK.md](./TECH_STACK.md) に準拠。API は `functions/` のみ。v1 のゲーム slug は `blaze-crown`。

## ツリー概要

```text
blaze-crown/
├── README.md
├── package.json
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── .env.example
│
├── docs/
│   ├── TECH_STACK.md
│   └── FOLDER_STRUCTURE.md
│
├── public/
│   ├── favicon.ico
│   ├── og-default.png
│   └── games/
│       └── blaze-crown/
│           ├── icon.png
│           ├── banner.jpg
│           └── characters/
│
├── content/
│   ├── site/
│   │   ├── about.mdx
│   │   └── privacy.mdx
│   └── games/
│       └── blaze-crown/
│           ├── _meta.yaml
│           ├── guides/
│           ├── characters/
│           ├── tier-lists/
│           ├── data/
│           └── changelog.yaml
│
├── functions/
│   └── api/
│       └── comments.ts
│
├── src/
│   ├── pages/
│   ├── layouts/
│   ├── components/
│   ├── content/
│   ├── lib/
│   └── env.d.ts
│
├── supabase/
│   ├── migrations/
│   └── seed.sql
│
└── scripts/
    └── import-spreadsheet.mjs
```

---

## 記事を書く場所

| パス | 用途 |
|------|------|
| `content/games/blaze-crown/guides/*.mdx` | 攻略記事（主） |
| `content/games/blaze-crown/characters/*.mdx` | キャラページ |
| `content/games/blaze-crown/tier-lists/*.mdx` | ティア表 |
| `content/site/*.mdx` | about / privacy |
| `content/games/blaze-crown/data/*` | 数値・表（MDX から参照） |

### 攻略 MDX フロントマター

```yaml
---
title: "序盤の育成優先度"
game: blaze-crown
category: guide
tags: [beginner, gacha]
publishedAt: 2026-11-01
updatedAt: 2026-11-13
description: "検索結果用の要約"
featured: false
related: [gacha-priority]
---
```

### URL 規約

| URL | 元データ |
|-----|----------|
| `/` | サイト TOP |
| `/privacy/` | `content/site/privacy.mdx` |
| `/about/` | `content/site/about.mdx` |
| `/games/blaze-crown/` | ゲームハブ |
| `/games/blaze-crown/guides/{slug}/` | `guides/{slug}.mdx` |
| `/search/` | Pagefind |

コメントの `article_id` 例: `blaze-crown/guides/gacha-priority`

---

## `src/pages/`

```text
src/pages/
├── index.astro
├── about.astro
├── privacy.astro
├── search.astro
└── games/
    └── [game]/
        ├── index.astro
        └── guides/
            ├── index.astro
            └── [...slug].astro
```

---

## `src/layouts/`

```text
src/layouts/
├── BaseLayout.astro
├── ArticleLayout.astro
└── GameHubLayout.astro
```

---

## `src/components/`

```text
src/components/
├── article/
├── game/
├── seo/
├── ads/
│   └── AdSlot.astro
└── comments/
    ├── CommentsSection.tsx
    ├── CommentList.tsx
    ├── CommentForm.tsx
    └── useComments.ts
```

---

## `src/lib/`

```text
src/lib/
├── games.ts
├── paths.ts
├── constants.ts
├── supabase/
│   └── client.ts
└── turnstile.ts          # functions/ から利用
```

Supabase service role 用コードは `functions/` 内に置き、クライアント bundle に含めない。

---

## `supabase/`

```text
supabase/
├── migrations/
│   └── *_comments.sql
└── config.toml
```

### `comments` テーブル

| カラム | 型 | 備考 |
|--------|-----|------|
| `id` | uuid | PK |
| `article_id` | text | |
| `user_id` | uuid null | ログイン時 |
| `guest_name` | text null | 非ログイン時 |
| `body` | text | |
| `status` | enum | `pending` / `approved` / `rejected` |
| `created_at` | timestamptz | |

---

## 運用ルール

1. 数値・表 → `data/`、解説 → `guides/*.mdx`
2. 画像 → `public/games/blaze-crown/`
3. 広告 → `AdSlot` のみ
4. コメント書き込み → `functions/api/` のみ

---

## 環境変数（`.env.example`）

```bash
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
PUBLIC_TURNSTILE_SITE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TURNSTILE_SECRET_KEY=
```

---

## 実装順序

1. `content/site` + 攻略 MDX + 静的ルート
2. レイアウト + SEO + `AdSlot`
3. Supabase migration + コメント GET
4. POST + Turnstile + Google Auth
5. Pagefind + サイトマップ
