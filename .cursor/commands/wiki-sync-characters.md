# `wiki:sync-characters` — 公式Wiki同期

公式攻略Wikiからキャラ情報を取得し、`character-wiki.json` を更新する。

## エージェントの手順

1. リポジトリルートで実行（`full_network` が必要なら要求する）:
   ```bash
   npm run wiki:sync-characters
   ```
2. 成功したら変更ファイルを報告する。コミットはユーザーが `/push` を明示するまで勝手にしない。

実体: `scripts/sync-official-character-wiki.mjs`／説明: `docs/コマンド.md`