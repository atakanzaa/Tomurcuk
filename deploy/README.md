# Yayın

Image bir kez build edilir ve her ortamda aynısı çalışır. Ortamı dal değil deploy belirler; farklar yalnızca Spring profilinde (`application-<ortam>.yml`) ve sunucudaki `.env` dosyasında.

```
PR açıldı / güncellendi ──> CI: lint, build, test ──> image'lar (sha-<commit>) ──> önizleme  pr-42.test.alanadi.com
main'e merge             ──> CI: lint, build, test ──> image'lar (sha-<commit>) ──> staging   staging.alanadi.com
git tag v0.1.0           ──> image'lara v0.1.0 etiketi ──> onay ──> prod ──> smoke test ──(başarısız)──> önceki sürüm
PR kapandı               ──> önizleme veritabanıyla silinir
```

| Ortam | Sunucu | Profil | Veri | Ödeme | SMS | Erişim |
| --- | --- | --- | --- | --- | --- | --- |
| Önizleme | 1 | `preview` + `demo` | her PR'ın kendi veritabanı, örnek dükkânlar | sahte sağlayıcı | log | ekip parolası |
| Staging | 1 | `staging` + `demo` | kalıcı, örnek dükkânlar; prod verisi kopyalanmaz | iyzico sandbox | Netgsm, yalnızca ekip numaraları | ekip parolası |
| Prod | 2 | `prod` | gerçek | iyzico canlı, pazaryeri | Netgsm | açık |

Sunucular ayarlanmadıysa (aşağıdaki repo değişkenleri boşsa) CI yine test eder ve image'ları build eder; deploy işleri atlanır.

## Dosyalar

| Dosya | Ne yapar |
| --- | --- |
| `api/Dockerfile`, `web/Dockerfile` | Image'lar. Web'in build bağlamı repo kökü (`design/` gerekiyor) |
| `compose.base.yml` | Postgres, API, web; her ortamda aynı. API dışarı açılmaz, yalnızca web Traefik'e bağlanır |
| `compose.preview.yml`, `compose.staging.yml`, `compose.prod.yml` | Ortam farkları: profil, bellek sınırı, parola, prod'da gece yedeği |
| `traefik/compose.yml` | Her sunucuda bir kez kurulan Traefik; Let's Encrypt sertifikaları |
| `scripts/deploy.sh` | Sunucuda çalışır: image'ları çeker, ortamı kaldırır, sağlıklı olmasını bekler |
| `scripts/rollback.sh` | Ortamı önceki etikete döndürür |
| `scripts/preview-down.sh` | Önizlemeyi veritabanıyla siler |
| `scripts/smoke.sh` | Dışarıdan: `/api/saglik`, ana sayfa, giriş sayfaları ve (varsa) bir dükkân sayfası 200 dönüyor mu |
| `.github/workflows/ci.yml` | Test, image, önizleme, staging |
| `.github/workflows/preview-cleanup.yml` | PR kapanınca önizlemeyi siler |
| `.github/workflows/release.yml` | Tag ile prod |

## Sunucu kurulumu

Her iki sunucuda bir kez:

1. Docker Engine ve compose eklentisini kurun.
2. Deploy kullanıcısı açın, `docker` grubuna ekleyin ve klasörü verin:
   ```sh
   sudo adduser --disabled-password deploy
   sudo usermod -aG docker deploy
   sudo mkdir -p /srv/tomurcuk && sudo chown deploy: /srv/tomurcuk
   ```
3. GitHub Actions için bir SSH anahtarı üretin (`ssh-keygen -t ed25519 -f tomurcuk-deploy -N ""`), açık anahtarı deploy kullanıcısının `~/.ssh/authorized_keys` dosyasına ekleyin. Özel anahtar GitHub secret'ına girer, sunucuda kalmaz.
4. Traefik'i kurun (80 ve 443 açık olmalı):
   ```sh
   docker network create traefik
   ACME_EMAIL=siz@ornek.com docker compose -p traefik -f deploy/traefik/compose.yml up -d
   ```
5. DNS: sunucu 1 için `staging.alanadi.com` ve `*.test.alanadi.com`, sunucu 2 için `alanadi.com`. Sertifikalar ilk istekte alınır.

Parolalı ortamlar için Traefik parola satırı (`ekip` kullanıcı adı):

```sh
htpasswd -nbB ekip 'parola'      # apache2-utils; ya da: echo "ekip:$(openssl passwd -apr1 'parola')"
```

Satırı `.env` dosyalarına tek tırnakla yazın; `$` işaretleri böylece olduğu gibi kalır.

### Sunucu 1: önizleme ve staging

`/srv/tomurcuk/preview.env` (bütün önizlemelerde ortak; her önizlemenin adresi ve veritabanı parolası deploy sırasında eklenir):

```sh
PREVIEW_DOMAIN=test.alanadi.com
BASIC_AUTH_USERS='ekip:$2y$05$...'
```

`/srv/tomurcuk/staging/.env`:

```sh
HOST=staging.alanadi.com
POSTGRES_PASSWORD=<uzun rastgele değer>
BASIC_AUTH_USERS='ekip:$2y$05$...'
TOMURCUK_PAYMENT_IYZICO_APIKEY=<iyzico sandbox API anahtarı>
TOMURCUK_PAYMENT_IYZICO_SECRETKEY=<iyzico sandbox gizli anahtarı>
TOMURCUK_SMS_NETGSM_USERCODE=<Netgsm kullanıcı kodu>
TOMURCUK_SMS_NETGSM_PASSWORD=<Netgsm API şifresi>
TOMURCUK_SMS_NETGSM_HEADER=<onaylı mesaj başlığı>
# Virgülle ayrılmış ekip numaraları; diğer numaralara SMS gitmez. Tanımsızsa API açılmaz.
TOMURCUK_SMS_ALLOWED_RECIPIENTS=05320000000,05330000000
```

Netgsm hesabı henüz yoksa `TOMURCUK_SMS_PROVIDER=log` yazın; SMS'ler log'a düşer.

Aynı anda en fazla 3 önizleme çalışır. Sınır doluysa CI uyarı verir, PR'ın testleri yine geçer; başka bir PR kapanınca yeni commit'le önizleme açılır.

### Sunucu 2: prod

`/srv/tomurcuk/prod/.env`:

```sh
HOST=alanadi.com
POSTGRES_PASSWORD=<uzun rastgele değer>
TOMURCUK_PAYMENT_IYZICO_APIKEY=<iyzico canlı API anahtarı>
TOMURCUK_PAYMENT_IYZICO_SECRETKEY=<iyzico canlı gizli anahtarı>
TOMURCUK_PAYMENT_IYZICO_BUYEREMAIL=siparis@alanadi.com
TOMURCUK_SMS_NETGSM_USERCODE=<Netgsm kullanıcı kodu>
TOMURCUK_SMS_NETGSM_PASSWORD=<Netgsm API şifresi>
TOMURCUK_SMS_NETGSM_HEADER=<onaylı mesaj başlığı>
```

Prod pazaryeri modelinde çalışır: her dükkânın iyzico alt üye işyeri anahtarı `shop_payment_account` tablosunda olmalı, yoksa o dükkânda kartla ödeme açılmaz (alıcı "Ödeme sayfası şu an açılamıyor" görür, havale çalışır).

Yedekler: `backup` servisi her gece 03:00'te `/srv/tomurcuk/prod/backups/tomurcuk-YYYYMMDD.sql.gz` yazar ve 14 günden eskileri siler. Yedeğin sunucu dışına kopyası sizde: örneğin deploy kullanıcısının crontab'ına `30 3 * * * rclone copy /srv/tomurcuk/prod/backups uzak:tomurcuk-yedek`. Geri yükleme:

```sh
cd /srv/tomurcuk/prod
gunzip -c backups/tomurcuk-20261022.sql.gz | docker compose -p prod exec -T postgres psql -U tomurcuk -d tomurcuk
```

## GitHub ayarları

Settings → Secrets and variables → Actions:

| Tür | Ad | Değer |
| --- | --- | --- |
| Variable | `DEPLOY_USER` | `deploy` |
| Variable | `SERVER1_HOST` | sunucu 1'in adresi |
| Variable | `SERVER2_HOST` | sunucu 2'nin adresi |
| Variable | `PREVIEW_DOMAIN` | `test.alanadi.com`; boşsa önizleme yok |
| Variable | `STAGING_DOMAIN` | `staging.alanadi.com`; boşsa staging deploy'u yok |
| Variable | `PROD_DOMAIN` | `alanadi.com`; boşsa prod iş akışı çalışmaz |
| Secret | `SERVER1_SSH_KEY`, `SERVER2_SSH_KEY` | deploy için üretilen özel anahtar |
| Secret | `SERVER1_KNOWN_HOSTS`, `SERVER2_KNOWN_HOSTS` | `ssh-keyscan <sunucu>` çıktısı |
| Secret | `TEAM_BASIC_AUTH` | `ekip:parola` (smoke test önizleme ve staging'e bununla girer) |

Settings → Environments → `production`: "Required reviewers" ile onaycıyı seçin ve "Deployment branches and tags" altında yalnızca `v*` etiketlerine izin verin. `preview` ve `staging` ortamları ilk deploy'da kendiliğinden açılır.

Image'lar `ghcr.io/atakanzaa/tomurcuk-api` ve `ghcr.io/atakanzaa/tomurcuk-web` paketlerine gider. Sunucular her deploy'da iş akışının kısa ömürlü token'ıyla giriş yapıp çeker; ayrı bir registry parolası gerekmez.

## Günlük işler

Prod'a çıkmak: main'de staging'e çıkmış ve denenmiş commit'e sürüm etiketi koyun.

```sh
git tag v0.1.0 && git push origin v0.1.0
```

Onaycı Actions'taki "Prod" çalışmasını onaylayınca deploy başlar. Deploy ya da smoke test başarısız olursa iş akışı önceki sürüme kendisi döner.

Elle geri dönmek: Actions → Prod → Run workflow → eski sürüm etiketi (`v0.0.9`). Ya da sunucuda tek komut:

```sh
/srv/tomurcuk/prod/compose/scripts/rollback.sh prod
```

Log'lar:

```sh
docker compose -p prod logs -f --tail 200 api     # staging için -p staging, önizleme için -p pr-42
```

Veritabanı değişiklikleri Flyway ile API açılırken uygulanır ve önce staging'de çalışır. Kolon silme gibi geri alınamayan değişiklik iki sürüme bölünür: önce kod kolonu kullanmayı bırakır, sonraki sürümde migration kolonu siler. Böylece geri dönülen sürüm de veritabanıyla çalışır.

## İlk uçtan uca deneme (yapılacak)

- **iyzico sandbox, staging'de:**
  - kartla sipariş verin (iyzico'nun test kartları);
  - ödeme sayfasını yarıda bırakın;
  - aynı taslakla yeniden ödeyin;
  - 15 dakikalık durum sorgusunun callback'i gelmemiş ödemeyi kapattığını görün.
- **Netgsm, staging'de ekip numarasıyla:**
  - onay SMS'i ve "Yolda" SMS'i gelsin;
  - destek panelindeki bildirim kaydında `jobid` görünsün;
  - istek biçimi Netgsm'in güncel belgesiyle karşılaştırılsın.
- **Prod'a geçmeden:**
  - pilot dükkânların alt üye işyeri anahtarları girilsin;
  - iyzico canlı anahtarları ve Netgsm başlığı prod `.env`'ine yazılsın.
