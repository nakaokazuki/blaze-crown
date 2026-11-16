#!/usr/bin/env bash
# 変更をステージ → コミット → origin に push まで一括実行
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

usage() {
  echo "用法: scripts/push.sh [コミットメッセージ]" >&2
  echo "      npm run push -- [コミットメッセージ]" >&2
  echo "      メッセージ省略時は差分から自動生成します。" >&2
}

generate_commit_message() {
  local list
  list=$(git diff --cached --name-only)
  local tags=()

  echo "$list" | grep -qE '^content/.*/guides/' && tags+=("攻略記事")
  echo "$list" | grep -qE '^content/site/' && tags+=("サイトページ")
  echo "$list" | grep -qE '^src/' && tags+=("フロント実装")
  echo "$list" | grep -q '^scripts/' && tags+=("運用スクリプト")
  echo "$list" | grep -q '^\.cursor/' && tags+=("Cursorコマンド")
  echo "$list" | grep -q '^docs/' && tags+=("ドキュメント")
  echo "$list" | grep -qE '^content/.*/data/' && tags+=("ゲームデータ")
  echo "$list" | grep -q 'メモ.txt' && tags+=("運用メモ")

  if ((${#tags[@]} > 0)); then
    local joined
    joined=$(IFS=・; echo "${tags[*]}")
    echo "${joined}を更新"
  else
    local count
    count=$(echo "$list" | sed '/^$/d' | wc -l | tr -d ' ')
    echo "変更 ${count} ファイルを反映"
  fi
}

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "エラー: Git リポジトリではありません。" >&2
  exit 1
fi

MESSAGE="${1:-}"

for secret in .env .env.production .env.local; do
  if [[ -f "$secret" ]] && git diff --cached --name-only 2>/dev/null | grep -qxF "$secret"; then
    echo "エラー: 機密ファイル $secret がステージされています。中止しました。" >&2
    exit 1
  fi
done

echo "=== 1/4 状態確認 (git status) ==="
git status -sb
echo

echo "=== 2/4 ステージング (git add -A) ==="
git add -A

if git diff --cached --quiet; then
  echo "コミットする変更がありません。push は行いません。"
  exit 0
fi

for secret in .env .env.production .env.local; do
  if git diff --cached --name-only | grep -qxF "$secret"; then
    echo "エラー: 機密ファイル $secret がステージされています。中止しました。" >&2
    git restore --staged "$secret" 2>/dev/null || true
    exit 1
  fi
done

if [[ -z "$MESSAGE" ]]; then
  MESSAGE=$(generate_commit_message)
  echo "=== 自動コミットメッセージ ==="
  echo "$MESSAGE"
  echo
fi

echo "=== ステージ済み差分 ==="
git diff --cached --stat
echo

echo "=== 3/4 コミット (git commit) ==="
git commit -m "$MESSAGE"

BRANCH="$(git branch --show-current)"
echo
echo "=== 4/4 プッシュ (git push origin $BRANCH) ==="
git push origin "$BRANCH"

echo
echo "完了: $BRANCH を origin に push しました。"