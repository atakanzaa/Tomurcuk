#!/usr/bin/env bash
# Deploy'dan sonra dışarıdan (GitHub Actions runner'ı) çalışır: TLS, Traefik, web ve API'nin
# birlikte ayakta olduğunu doğrular.
#   smoke.sh <adres> [dükkân-slug'ı]
# Parolalı ortamlarda (önizleme, staging) SMOKE_AUTH=kullanıcı:parola.
set -euo pipefail

url=${1:?kullanım: smoke.sh <adres> [dükkân]}
url=${url%/}
shop=${2:-}
auth=()
[ -z "${SMOKE_AUTH:-}" ] || auth=(-u "$SMOKE_AUTH")

status() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 15 "${auth[@]}" "$url$1" || true
}

# İlk kurulumda sertifika birkaç saniye sürebilir.
for attempt in $(seq 1 12); do
  [ "$(status /api/saglik)" = 200 ] && break
  [ "$attempt" = 12 ] && { echo "Sağlık kontrolü geçmedi: $url/api/saglik" >&2; exit 1; }
  sleep 5
done

paths=(/ /giris /destek/giris)
[ -z "$shop" ] || paths+=("/$shop")
failed=0
for path in "${paths[@]}"; do
  code=$(status "$path")
  echo "$code $path"
  [ "$code" = 200 ] || failed=1
done
exit $failed
