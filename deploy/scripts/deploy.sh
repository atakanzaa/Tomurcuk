#!/usr/bin/env bash
# Sunucuda çalışır: bir ortamı verilen image etiketiyle kaldırır ya da günceller ve sağlıklı
# olmasını bekler. GitHub Actions SSH ile çağırır; elle de çalıştırılabilir.
#   deploy.sh preview <etiket> <pr-numarası>
#   deploy.sh staging <etiket>
#   deploy.sh prod <etiket>
# Çıkış kodu 3: önizleme sınırı dolu, bu PR için ortam açılmadı.
set -euo pipefail

ROOT=${TOMURCUK_ROOT:-/srv/tomurcuk}
MAX_PREVIEWS=3
HERE=$(cd "$(dirname "$0")/.." && pwd)

usage() {
  echo "kullanım: deploy.sh preview <etiket> <pr> | deploy.sh staging|prod <etiket>" >&2
  exit 2
}

env=${1:-}
tag=${2:-}
[ -n "$tag" ] || usage

case $env in
  preview)
    pr=${3:-}
    [ -n "$pr" ] || usage
    project=pr-$pr
    dir=$ROOT/previews/$project
    if [ ! -d "$dir" ]; then
      mkdir -p "$ROOT/previews"
      count=$(find "$ROOT/previews" -mindepth 1 -maxdepth 1 -type d | wc -l)
      if [ "$count" -ge "$MAX_PREVIEWS" ]; then
        echo "Önizleme sınırı dolu: aynı anda en fazla $MAX_PREVIEWS önizleme çalışır."
        exit 3
      fi
      # preview.env bütün önizlemelerde ortak: PREVIEW_DOMAIN, BASIC_AUTH_USERS ve isteğe bağlı
      # uygulama ayarları. Her önizlemenin kendi adresi ve veritabanı parolası eklenir.
      domain=$(sed -n 's/^PREVIEW_DOMAIN=//p' "$ROOT/preview.env")
      [ -n "$domain" ] || { echo "$ROOT/preview.env içinde PREVIEW_DOMAIN yok" >&2; exit 1; }
      mkdir -p "$dir"
      {
        cat "$ROOT/preview.env"
        echo "HOST=$project.$domain"
        echo "POSTGRES_PASSWORD=$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')"
      } > "$dir/.env"
    fi
    ;;
  staging | prod)
    project=$env
    dir=$ROOT/$env
    [ -f "$dir/.env" ] || { echo "$dir/.env yok; deploy/README.md'deki kurulumu yapın." >&2; exit 1; }
    ;;
  *)
    usage
    ;;
esac

# Compose dosyaları ortam klasörüne kopyalanır; geri dönüş (rollback.sh) aynı dosyalarla çalışır.
if [ "$HERE" != "$dir/compose" ]; then
  rm -rf "$dir/compose"
  mkdir -p "$dir/compose"
  cp -R "$HERE"/compose.*.yml "$HERE/scripts" "$dir/compose/"
fi

export TAG=$tag PROJECT=$project
compose() {
  docker compose -p "$project" --project-directory "$dir" \
    -f "$dir/compose/compose.base.yml" -f "$dir/compose/compose.$env.yml" "$@"
}

current=$(cat "$dir/TAG" 2>/dev/null || true)
echo "$project: ${current:-ilk kurulum} → $tag"
# Deploy yarıda kalırsa rollback.sh son sağlıklı etikete (TAG) döner.
echo "$tag" > "$dir/TAG.attempt"
# Yalnızca uygulama image'ları; Postgres ve Traefik yoksa bir kez çekilir.
compose pull --quiet api web
if ! compose up -d --wait --wait-timeout 300 --remove-orphans; then
  echo "$project sağlıklı açılmadı ($tag)." >&2
  compose ps >&2
  compose logs --no-color --tail 100 api web >&2
  exit 1
fi
if [ -n "$current" ] && [ "$current" != "$tag" ]; then
  echo "$current" > "$dir/TAG.previous"
fi
echo "$tag" > "$dir/TAG"
rm -f "$dir/TAG.attempt"
docker image prune -f > /dev/null
echo "Hazır: https://$(sed -n 's/^HOST=//p' "$dir/.env") ($tag)"
