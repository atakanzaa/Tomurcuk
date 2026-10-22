#!/usr/bin/env bash
# Sunucuda çalışır: ortamı önceki image etiketine döndürür. Son deploy yarıda kaldıysa son
# sağlıklı etikete (TAG), tamamlandıysa ondan öncekine (TAG.previous). Prod deploy'u ya da smoke
# testi başarısız olursa GitHub Actions da bunu çağırır.
#   rollback.sh staging|prod
set -euo pipefail

ROOT=${TOMURCUK_ROOT:-/srv/tomurcuk}
env=${1:-}
case $env in
  staging | prod) ;;
  *) echo "kullanım: rollback.sh staging|prod" >&2; exit 2 ;;
esac

dir=$ROOT/$env
if [ -f "$dir/TAG.attempt" ]; then
  target=$(cat "$dir/TAG" 2>/dev/null || true)
  from=$(cat "$dir/TAG.attempt")
else
  target=$(cat "$dir/TAG.previous" 2>/dev/null || true)
  from=$(cat "$dir/TAG" 2>/dev/null || true)
fi
[ -n "$target" ] || { echo "$env için dönülecek etiket yok." >&2; exit 1; }
echo "$env: $from → $target (geri dönüş)"
exec "$dir/compose/scripts/deploy.sh" "$env" "$target"
