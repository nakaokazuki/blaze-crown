# `/blazecrown` — 最新情報の調査

**公式サイト・攻略Wiki・公式X（@BLAZECROWN_JP）**を取得し、β日程・告知・キャラ追加などを要約する。

## エージェントの手順

1. ユーザーが `--sync` や「Wiki同期」を求めている場合:
   ```bash
   npm run blazecrown -- --sync
   ```
   それ以外:
   ```bash
   npm run blazecrown
   ```
   （`full_network` が必要なら要求する）
2. ターミナル出力を読み、**公式の要点**と**当サイトへの反映・記事ピックアップ**を日本語で短くまとめる。
3. ローカル変更の Git push は行わない（別途 `/push`）。

実体: `scripts/blazecrown-check.mjs`／説明: `docs/コマンド.md`