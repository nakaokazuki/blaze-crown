# Search Console 準備

1. `npm run build` のあと `npm run seo:verify -- --local` で dist を確認
2. 本番反映後 `npm run seo:verify`
3. ユーザーに Search Console でプロパティ追加・サイトマップ送信を案内（`scripts/seo-verify.mjs` 末尾の手順）

所有権確認用: `.env` の `PUBLIC_GOOGLE_SITE_VERIFICATION`（GSC の HTML タグの content 値）を設定して push。