#!/usr/bin/env bash
# ブレイズクラウンの最新情報を公式から調べる（任意で Wiki JSON 同期）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SYNC_WIKI=false
for arg in "$@"; do
  case "$arg" in
    --sync) SYNC_WIKI=true ;;
    -h | --help)
      echo "用法: npm run blazecrown [-- --sync]" >&2
      echo "  --sync  調査後に character-wiki.json を公式から再生成" >&2
      exit 0
      ;;
  esac
done

node scripts/blazecrown-check.mjs

if [[ "$SYNC_WIKI" == true ]]; then
  echo
  echo "=== 公式Wiki同期（wiki:sync-characters） ==="
  npm run wiki:sync-characters
fi