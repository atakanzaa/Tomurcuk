# Tomurcuk backend planı

`docs/mvp.md`'deki kapsam, yetki matrisi, edge case'ler ve veri modeli geçerlidir. Bu belge onları nasıl kuracağımızı ve frontend'deki mock'ların hangi sırayla kalkacağını anlatır.

## Kararlar

| Konu | Karar |
| --- | --- |
| Repo | Tek repo. `web/` Next.js, `api/` Spring Boot, `design/` ve `docs/` ortak |
| Dil ve çatı | Java 21, Spring Boot 4.1, Spring Modulith 2.1 |
| Build | Maven (wrapper ile, `api/mvnw`) |
| Veritabanı | PostgreSQL 17, Flyway, Spring Data JPA (`open-in-view` kapalı); atomik güncellemeler `@Modifying` sorgu ya da `JdbcClient` ile |
| Ödeme | iyzico, pazaryeri modeli (alt üye işyeri) ve Checkout Form; `PaymentProvider` arayüzünün arkasında |
| SMS | `SmsSender` arayüzü; yerelde log'a yazar, sağlayıcı seçimi bildirim aşamasında |
| API sözleşmesi | springdoc ile OpenAPI; frontend tipleri `openapi-typescript` ile üretilir |
| Testler | Az ve kritik: modül sınırı doğrulaması ve CLAUDE.md'deki beş senaryo. Testcontainers ile gerçek Postgres |
| CI | GitHub Actions: `web` için lint ve build, `api` için `mvnw verify` |

## Mimari

```
tarayıcı ──> Next.js (web) ──REST──> Spring Boot (api) ──> PostgreSQL
                                      └─> iyzico, SMS, dosya deposu
```

- Tarayıcı API'yi hiç çağırmaz. Server Component'ler ve Server Action'lar `web/lib/api` üzerinden çağırır. API iç ağda kalır; dışarı yalnızca `/webhooks/**` açılır (iyzico bildirimleri).
- Oturum Spring Security ve Spring Session JDBC ile tutulur. Next sunucusu gelen isteğin oturum cookie'sini API'ye iletir, girişte API'nin `Set-Cookie` başlığını tarayıcıya geçirir. Tarayıcıda token tutulmaz.
- Dükkân kullanıcıları ve platform kullanıcıları ayrı tablolar, ayrı giriş uçları. Platform girişinde TOTP zorunlu.
- Destek temsilcisi dükkân adına oturum açtığında panel uçlarını kendi oturumuyla çağırır. Backend, süresi dolmamış `impersonation_session` kaydından dükkânı çözer ve her işlemi denetim kaydına yazar.

## Modüller

Her modül `com.tomurcuk.<modül>` paketidir. Kökteki sınıflar modülün dışa açık yüzüdür (servis, DTO, olay). Varlıklar, repository'ler ve controller'lar alt paketlerde kalır; Modulith başka modülün iç paketine erişimi derlemede değil testte yakalar (`ModularityTests`).

| Modül | İçerik |
| --- | --- |
| `shop` | dükkân, slug geçmişi (301), plan, saat dilimi, aynı gün son saati, abonelik durumu |
| `catalog` | kategori, ürün, seçenek, ürün sırası |
| `delivery` | bölge, haftalık saat aralığı şablonu, kapalı gün, günlük kapasite, 10 dakikalık rezervasyon |
| `ordering` | taslak, sipariş, sipariş kalemi kopyası, durum geçişleri, olay geçmişi, takip token'ı |
| `payment` | iyzico adapter'ı, callback ve webhook, 15 dakikalık durum sorgusu, 30 dakikada terk edilen ödemenin iptali |
| `customer` | müşteri kartı, özel günler, hatırlatma listesi, pazarlama izni |
| `notification` | bildirim kaydı (sipariş + tür tekil), `SmsSender`, yeniden deneme |
| `identity` | dükkân ve platform kullanıcıları, rol, izin, oturum, TOTP |
| `support` | talepler, mesajlar, hazır cevaplar, dahili notlar, dükkân adına oturum, maskeli veri |
| `audit` | yalnızca eklenen denetim kaydı |
| `marketing` | pilot başvuruları |

Modüller arası yan etkiler Modulith olaylarıyla taşınır, olay yayınları veritabanında tutulur. Örnek: `OrderPlaced` olayını `notification` (çiçekçiye bildirim) ve `customer` (müşteri kartı) dinler. Bu kalıcı yayın kaydı outbox işini de görür: SMS sağlayıcısı çökse de sipariş bloklanmaz, olay yeniden işlenir.

## Veri kuralları

- Dışa açık id'ler ULID (`char(26)`), uygulamada üretilir. Takip linki ayrı, tahmin edilemez bir token.
- Sipariş numarası dükkâna özel artan sayıdır (`T-4821`); dükkân başına sayaç tablosu.
- Para kuruş cinsinden `bigint`. Anlar `timestamptz` (UTC), teslim günü `date`, saat aralığı `time`.
- "Bugün" ve son sipariş saati dükkânın saat diliminde, sunucunun saatiyle hesaplanır (`Clock` bean'i; testte sabitlenir).
- Dükkâna ait her sorgu `shop_id` ile filtrelenir. Başka dükkânın kaydı 404 döner, 403 değil.
- Silme yerine `active = false` (bölge, ürün). Siparişe ad, fiyat ve bölge ücreti kopyalanır.

`docs/mvp.md` veri modeline frontend yapılırken çıkan eklemeler: `category`, `shop_slug_history`, `shop_order_counter`, `order_draft`, `slot_reservation`, `slot_capacity` (gün + aralık başına `used`), `order_event`, `order.number`, `order.tracking_token`, `order.idempotency_key`, `shop_note`, `pilot_application`.

## API kuralları

| Grup | Önek | Oturum |
| --- | --- | --- |
| Vitrin ve sipariş akışı | `/api/public/shops/{slug}/...` | yok |
| Satıcı paneli | `/api/panel/...` | dükkân kullanıcısı ya da dükkân adına oturum |
| Destek paneli | `/api/support/...` | platform kullanıcısı |
| Ödeme bildirimleri | `/webhooks/iyzico` | iyzico imzası |

- Uç noktalar `web/lib/api/contract.ts`'teki fonksiyonlarla bire bir eşleşir; isimler ve alanlar oradaki tiplerle aynı tutulur.
- Doğrulama hatası `422` ve `{"errors": {"alan": "kod"}}` döner. Kodlar frontend'deki `CheckoutError` değerleridir (`slot_full`, `same_day_closed` ...). Türkçe mesajı frontend üretir.
- Diğer hatalar RFC 9457 `ProblemDetail`.
- Kişisel veri destek uçlarında maskeli gelir; açmak ayrı uç, gerekçe zorunlu, denetim kaydına yazılır.

## Aşamalar ve mock'ların kalkışı

Frontend'de `web/lib/api/impl.ts` geçiş boyunca mock ile HTTP uygulamasını birleştirir. Her aşama bittiğinde o modülün fonksiyonları HTTP'ye geçer, mock karşılığı silinir. Her aşamanın sonunda uygulama uçtan uca çalışır.

| Aşama | Backend | Frontend'de kalkan mock |
| --- | --- | --- |
| 1. İskelet | Maven projesi, Modulith, Flyway, Postgres (Docker Compose), Testcontainers, CI | — |
| 2. Vitrin | `shop`, `catalog`, `delivery` okuma uçları, örnek veri | `findShop`, `getProducts`, `getProduct`, `getCategories`, `getDeliveryZones`, `getTimeSlots`, `getDeliveryDays` |
| 3. Sipariş ve ödeme | taslak, rezervasyon, sipariş, iyzico sandbox, callback, takip | sipariş akışı ve takip |
| 4. Giriş ve panel | dükkân girişi, siparişler, durum geçişleri, elle sipariş, müşteriler, hatırlatmalar | panel fonksiyonları; giriş ekranı eklenir |
| 5. Bildirim | bildirim kaydı, `SmsSender`, yeni sipariş e-postası | — |
| 6. Destek | platform girişi ve TOTP, talepler, dükkân adına oturum, telefon açma, denetim kaydı | destek fonksiyonları; giriş ekranı eklenir |
| 7. Yayın | Dockerfile, compose dosyaları, PR önizleme, staging, onaylı prod | `lib/mock` tamamen silinir |

## Testler

Kapsam bilerek dar tutulur; geliştirme hızı önce gelir.

- `ModularityTests`: modül sınırları (`ApplicationModules.verify()`).
- Aşama 3: ödeme callback'inin iki kez gelmesi, aynı aralığa eşzamanlı sipariş, sipariş durum geçişleri, "bugün" hesabında saat dilimi.
- Aşama 4: başka dükkânın verisine erişim denemesi.

Testler tek bir paylaşılan Postgres container'ı kullanır (`@ServiceConnection`).

## Yerelde çalıştırma

Gerekenler: JDK 21, Docker (Windows'ta Docker Desktop), Node.js 22+ ve pnpm 10.

```bash
cd api && ./mvnw spring-boot:run      # Postgres'i compose.yaml'dan kendisi kaldırır; http://localhost:8080
cd web && pnpm dev                    # http://localhost:3000
```
