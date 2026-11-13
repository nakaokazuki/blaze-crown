# BLAZE CROWN — 攻略サイト

確定版 v1 スタックで構築した Astro 攻略サイト。

## 開発

```bash
npm install
npm run dev
```

http://localhost:4321 で静的ページを確認できます。コメント API は **Cloudflare Pages Functions**（`/api/comments`）のため、`npm run dev` だけではコメントの読み書きは動きません。

本番同等の API 確認:

```bash
npm run build
npx wrangler pages dev dist
```

## 環境変数

`.env.example` を `.env` にコピーし、Supabase / Turnstile の値を設定します。Cloudflare Pages のダッシュボードにも同様の変数を登録してください。

## 記事の追加

`content/games/blaze-crown/guides/` に `.mdx` を追加します（フロントマターは [docs/FOLDER_STRUCTURE.md](./docs/FOLDER_STRUCTURE.md) 参照）。

## DB

```bash
supabase db push
```

`supabase/migrations/` の SQL を適用してください。

## ドキュメント

- [docs/TECH_STACK.md](./docs/TECH_STACK.md)
- [docs/FOLDER_STRUCTURE.md](./docs/FOLDER_STRUCTURE.md)

## デプロイ

Git を Cloudflare Pages に接続し、ビルドコマンド `npm run build`、出力ディレクトリ `dist` を指定してください。Functions は `functions/` が自動デプロイされます。
