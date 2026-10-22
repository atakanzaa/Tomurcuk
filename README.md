# Tomurcuk

Küçük çiçekçiler için sipariş sayfası, sipariş paneli ve müşteri defteri. Proje kuralları `CLAUDE.md`'de, backend planı `docs/backend.md`'de.

| Klasör | İçerik |
| --- | --- |
| `web/` | Next.js frontend (vitrin, satıcı paneli, destek paneli, tanıtım sitesi) |
| `api/` | Spring Boot REST API |
| `design/` | Design system ve onaylı ekran tasarımları |
| `docs/` | MVP dokümanı ve backend planı |

## Çalıştırma

Gerekenler: Node.js 22+ ve pnpm 10; backend için JDK 21 ve Docker.

Önce API, sonra frontend:

```bash
cd api
./mvnw spring-boot:run   # compose.yaml'daki Postgres'i kaldırır, örnek dükkânlarla açılır; http://localhost:8080
./mvnw verify            # testler Testcontainers ile gerçek Postgres'e karşı çalışır
```

```bash
cd web
pnpm install
pnpm dev     # http://localhost:3000
pnpm lint
pnpm build   # API'ye ihtiyaç duymaz
```

Frontend API'yi `TOMURCUK_API_URL` adresinde arar (varsayılan `http://localhost:8080`, bkz. `web/.env.example`).

Windows'ta `./mvnw` yerine `.\mvnw.cmd` yazın.

## Ekranlar

**Tanıtım sitesi**
- `/`: tanıtım ve pilot başvuru formu

**Alıcı (vitrin ve sipariş akışı)**
- `/nergis`: dükkân vitrini; `/nergis/urun/p_lale` ürün detayı, buradan sipariş akışı başlar
- `/nergis/siparis/teslimat`, `/kart-notu`, `/odeme`: sipariş adımları
- `/nergis/siparis/odeme/deneme`: geliştirmedeki deneme ödeme sayfası; "Kartla öde" buraya getirir
- `/nergis/takip`: sipariş numarası ve telefonla sipariş bulma (T-4821, 0533 207 41 65)
- `/nergis/takip/a3Fq9ZmLx2VbN8cR` (alındı), `y7Kp2RvXq9LmT3sB` (yolda), `d4Wn8HcZp1QaE6uJ` (teslim edildi, isimsiz)

**Satıcı paneli** (`/giris`; şifre `tomurcuk-demo`: `ayla@nergiscicek.com` sahip, `kemal@nergiscicek.com` çalışan)
- `/panel`: Bugün; `?gun=yarin`, `?gun=hafta`
- `/panel/siparisler/[id]`: sipariş detayı ve durum geçişleri; `/panel/siparisler/yeni`: elle sipariş
- `/panel/siparisler`, `/panel/musteriler`, `/panel/musteriler/ozel-gunler`, `/panel/urunler`, `/panel/teslimat`, `/panel/yardim`, `/panel/fisler`

**Destek paneli** (`/destek/giris`; şifre `tomurcuk-demo`, doğrulama kodu `JBSWY3DPEHPK3PXP` anahtarlı bir TOTP uygulamasından: `selin@tomurcuk.app` temsilci, `derya@tomurcuk.app` lider)
- `/destek`: talepler; `/destek/talepler/tk_1187` talep detayı
- `/destek/dukkanlar/shop_nergis`: dükkân özeti, "Dükkân adına gir"
- `/destek/siparisler`, `/destek/denetim`, `/destek/hazir-cevaplar`, `/destek/ara?q=elif`

**Geliştirme**
- `/bilesenler`: design system bileşenlerinin önizlemesi

Örnek veri `demo` profiliyle yüklenir; örnek siparişler, talepler ve tarihler (tasarımlardaki 22 Ekim) her açılışta bugüne kaydırılır.

Frontend veriyi `web/lib/api` arayüzünden alır; bütün fonksiyonlar Spring Boot API'den gelir (`web/lib/api/http`). Geliştirmede kartla ödeme sahte sağlayıcıyla yapılır: "Kartla öde" deneme ödeme sayfasını açar.
