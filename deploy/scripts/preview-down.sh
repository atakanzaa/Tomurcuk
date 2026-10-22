#!/usr/bin/env bash
# Sunucuda çalışır: PR kapanınca önizlemeyi veritabanıyla birlikte siler.
#   preview-down.sh <pr-numarası>
set -euo pipefail

ROOT=${TOMURCUK_ROOT:-/srv/tomurcuk}
pr=${1:?kullanım: preview-down.sh <pr-numarası>}
project=pr-$pr
dir=$ROOT/previews/$project
[ -d "$dir" ] || { echo "$project için önizleme yok."; exit 0; }

TAG=$(cat "$dir/TAG" 2>/dev/null || echo none) PROJECT=$project \
  docker compose -p "$project" --project-directory "$dir" \
  -f "$dir/compose/compose.base.yml" -f "$dir/compose/compose.preview.yml" down -v --remove-orphans
rm -rf "$dir"
echo "$project silindi."
