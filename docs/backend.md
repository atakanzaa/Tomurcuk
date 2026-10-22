# Tomurcuk backend planı

`docs/mvp.md`'deki kapsam, yetki matrisi, edge case'ler ve veri modeli geçerlidir. Bu belge onları nasıl kuracağımızı ve frontend'deki mock'ların hangi sırayla kalkacağını anlatır.

## Kararlar

| Konu | Karar |
| --- | --- |
| Repo | Tek repo. `web/` Next.js, `api/` Spring Boot, `design/` ve `docs/` ortak |
| Dil ve çatı | Java 21, Spring Boot 4.1, Spring Modulith 2.1 |
| Build | Maven (wrapper ile, `api/mvnw`) |
| Veritabanı | PostgreSQL 17, Flyway. Basit okuma tabloları (dükkân, katalog, teslimat ayarları) Spring Data JPA (`open-in-view` kapalı); sipariş, kapasite ve ödeme `JdbcClient` ile açık SQL (atomik güncellemeler, JSONB) |
| Ödeme | iyzico, pazaryeri modeli (alt üye işyeri) ve Checkout Form; `PaymentProvider` arayüzünün arkasında |
| SMS | Netgsm (REST v2); `SmsSender` arayüzünün arkasında, yerelde log'a yazar |
| API sözleşmesi | springdoc ile OpenAPI; frontend tipleri `openapi-typescript` ile üretilir |
| Testler | Az ve kritik: modül sınırı doğrulaması ve CLAUDE.md'deki beş senaryo. Testcontainers ile gerçek Postgres |
| CI | GitHub Actions: `web` için lint ve build, `api` için `mvnw verify` |

## Mimari

```
tarayıcı ──> Next.js (web) ──REST──> Spring Boot (api) ──> PostgreSQL
                                      └─> iyzico, SMS, dosya deposu
```

- Tarayıcı API'yi hiç çağırmaz. Server Component'ler ve Server Action'lar `web/lib/api` üzerinden çağırır. API iç ağda kalır; dışarı yalnızca `/webhooks/**` açılır (iyzico bildirimleri).
- Oturum Spring Security ve Spring Session JDBC ile tutulur (30 gün). Girişte API oturumu açar ve kimliğini `TOMURCUK_SESSION` cookie'siyle döner; Next bu değeri tarayıcıda kendi httpOnly cookie'sinde (`tomurcuk_oturum`) saklar ve her panel isteğinde API'ye iletir. Tarayıcı API'yi ve token'ı görmez.
- Oturum cookie'si yoksa proxy `/panel` isteklerini render başlamadan `/giris`'e yönlendirir; süresi dolmuş oturumda API 401 döner, Next yine girişe yönlendirir. Yetkisiz işlem 403 döner. CSRF koruması Next tarafındadır (Server Action köken kontrolü); API iç ağdadır.
- Rol ve izin matrisi kodda (`ShopRole`, `PlatformRole`): dükkân sahibi iptal ve iade yapabilir, çalışan yapamaz; destek lideri ve platform sahibi her şeyi, temsilci dükkân adına giriş ve katalog düzenlemeyi yapabilir. Kontroller rol değil izin üzerinden (`Permission`). mvp'deki "yeni rol deploy gerektirmez" hedefi için tablolar, ilk yeni rol ihtiyacında eklenir.
- Destek ekibi ayrı tabloda (`platform_user`) ve ayrı girişte (`/destek/giris`): e-posta, şifre ve TOTP kodu birlikte. Panel ve destek oturumları tarayıcıda ayrı cookie'lerde (`tomurcuk_oturum`, `tomurcuk_destek`).
- Dükkân adına oturum: temsilci gerekçe yazar, 30 dakikalık oturum açılır, dükkân sahiplerine e-posta gider. Next panel isteklerini temsilcinin oturumu ve `X-Tomurcuk-Impersonation` başlığıyla gönderir; API (`ImpersonationFilter`) oturumu doğrular, istek boyunca kullanıcıyı o dükkânın çalışanı yetkisiyle gösterir (iptal kapalı) ve değiştiren her isteği denetim kaydına yazar. Süresi dolan oturumla panel 403 döner, temsilci destek paneline döner.
- Kişisel veri destek görünümlerinde her zaman maskeli (ad kısaltılmış, telefon yıldızlı); liderler dahil açmak gerekçe ister ve kayda geçer. Denetim kaydını lider ve platform sahibi bütünüyle, temsilci yalnızca kendi işlemleriyle görür.
- Denetim kaydı (`audit_log`) yalnızca eklenir: veritabanı tetikleyicisi güncellemeyi ve silmeyi reddeder.
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

`docs/mvp.md` veri modeline frontend yapılırken çıkan eklemeler: `category`, `shop_slug_history`, `shop_order_counter`, `order_draft`, `slot_hold` (10 dakikalık rezervasyon), `slot_capacity` (gün + aralık başına `taken`), `order_event`, `order.number`, `order.tracking_token`, `order.idempotency_key`, `shop_note`, `pilot_application`. Sipariş tablosunun adı `orders` (`order` SQL'de ayrılmış kelime).

## API kuralları

| Grup | Önek | Oturum |
| --- | --- | --- |
| Vitrin ve sipariş akışı | `/api/public/shop-lookup/{slug}`, `/api/public/shops/{shopId}/...` | yok |
| Satıcı paneli | `/api/panel/...` | dükkân kullanıcısı ya da dükkân adına oturum |
| Destek paneli | `/api/support/...` | platform kullanıcısı |
| Ödeme bildirimleri | `/webhooks/iyzico` | iyzico imzası |

- Uç noktalar `web/lib/api/contract.ts`'teki fonksiyonlarla bire bir eşleşir; isimler ve alanlar oradaki tiplerle aynı tutulur.
- Doğrulama hatası `422` ve `{"errors": {"alan": {"code": "kod", "meta": {...}}}}` döner; `meta` mesaj için ek bilgidir (dolu aralığın alternatifi gibi). Kodlar frontend'deki `CheckoutError` değerleridir (`slot_full`, `same_day_closed` ...). Türkçe mesajı frontend üretir.
- Diğer hatalar RFC 9457 `ProblemDetail`.
- Kişisel veri destek uçlarında maskeli gelir; açmak ayrı uç, gerekçe zorunlu, denetim kaydına yazılır.

## Aşamalar ve mock'ların kalkışı

Frontend'deki mock'lar aşama aşama kalktı: her aşamada o modülün fonksiyonları HTTP'ye geçti ve mock karşılığı silindi; 6. aşamayla `web/lib/mock` tamamen kaldırıldı. Her aşamanın sonunda uygulama uçtan uca çalıştı.

| Aşama | Backend | Frontend'de kalkan mock |
| --- | --- | --- |
| 1. İskelet | Maven projesi, Modulith, Flyway, Postgres (Docker Compose), Testcontainers, CI | — |
| 2. Vitrin (bitti) | `shop`, `catalog`, `delivery` okuma uçları, örnek veri | `findShop`, `getCategories`, `getProducts`, `getProduct`, `getDeliveryZones`, `getTimeSlots`; `listFeaturedShopSlugs` kaldırıldı |
| 3. Sipariş ve ödeme (bitti, iyzico adapter'ı hariç) | kapalı gün, günlük kapasite, taslak, rezervasyon, sipariş, ödeme kaydı, sahte sağlayıcı, ödeme dönüşü, zamanlanmış işler, takip | `getDeliveryDays`, `createDraft`, `getDraft`, `saveDelivery`, `saveCard`, `placeOrder`, `getOrderTracking`, `findTrackingToken`; yeni `completePayment` |
| 4. Giriş ve panel (bitti) | dükkân girişi ve oturum, siparişler, durum geçişleri, ödendi işareti, elle sipariş, müşteriler, özel günler ve hatırlatmalar | `getPanelSession`, `getOrders`, `getOrder`, `updateOrderStatus`, `markOrderPaid`, `getCustomers`, `getCustomer`, `findCustomerByPhone`, `getReminders`, `createManualOrder`; `/giris` eklendi. Panelden açılan talepler (`getShopTickets`, `createTicket`) destek aşamasında |
| 5. Bildirim (bitti, gerçek sağlayıcılar hariç) | `notification_log`, `SmsSender` ve `EmailSender` (yerelde log'a yazar), onay ve durum SMS'leri, yeni sipariş e-postası, yeniden deneme | — (arayüzde bildirim yok; destek panelindeki bildirim listesi 6. aşamada API'ye geçer) |
| 6. Destek (bitti) | platform girişi ve TOTP, talepler, ekip notları, hazır cevaplar, dükkân adına oturum, gerekçeyle telefon açma, arama, dükkân özeti, denetim kaydı; panelden talepler; pilot başvuruları | kalan bütün fonksiyonlar; `web/lib/mock` silindi, `/destek/giris` eklendi |
| 7. Yayın | Dockerfile, compose dosyaları, PR önizleme, staging, onaylı prod; iyzico ve Netgsm ile uçtan uca deneme | — |

## Sipariş ve ödeme akışı

1. Taslak: ürün ve seçenekler doğrulanır, fiyat o anki değerdir. Taslak 2 saat yaşar; tarayıcı yalnızca id'sini httpOnly cookie'de tutar.
2. Teslimat: gün, aralık, bölge ve alanlar doğrulanır; aralık 10 dakika ayrılır (`slot_hold`, `slot_capacity.taken` bir artar). Süresi dolan rezervasyonları dakikada bir çalışan iş siler.
3. Kart notu: mesaj 250, imza 60 karakter; gönderen telefonu zorunlu. İsimsiz gönderimde imza boş tutulur.
4. Sipariş: idempotency anahtarı aynıysa ilk sipariş döner. Ürün, fiyat ve aralık yeniden doğrulanır; fiyat değiştiyse taslak güncellenir ve `price_changed` döner. Rezervasyon siparişe geçer; süresi dolmuşsa aralık hâlâ boşsa yeniden alınır, değilse `reservation_expired`.
5. Kartla ödeme: sipariş `pending` açılır, sağlayıcıda oturum başlar, alıcı ödeme sayfasına yönlenir. Sağlayıcı alıcıyı `/{slug}/siparis/odeme/sonuc` adresine token'la geri gönderir (iyzico form POST'u). Next route handler sonucu API'ye sorar, API sağlayıcıya sorar; adresteki bilgiye güvenilmez.
6. Ödeme yarıda kalırsa alıcı ödeme adımına döner; aynı taslakla yeniden ödemek aynı sipariş için yeni oturum açar, önceki oturum bırakılır (`abandoned`).
7. Zamanlanmış işler: callback'i gelmemiş ödemeler 15 dakikada bir sağlayıcıya sorulur; 30 dakikada ödenmeyen kartlı sipariş, son bir sorgudan sonra iptal edilir ve aralığı boşaltılır.

Ödeme kaydı tek UPDATE ile açık halden çıkar; aynı sonuç ikinci kez gelirse etkisizdir, `PaymentSucceeded` bir kez yayınlanır ve sipariş aynı işlemde ödendi olur. Bırakılmış ya da iptal edilmiş siparişin oturumu sonradan başarıyla dönerse para çekilmiştir: ödeme kaydedilir, iade gerektiği hata olarak loglanır (iade akışı panel aşamasında).

Sağlayıcılar:
- `fake` (varsayılan): ödeme sayfası frontend'deki `/{slug}/siparis/odeme/deneme`; "Ödemeyi onayla" ve "Ödemeyi yarıda bırak" ile iki sonuç da denenebilir.
- `iyzico` (yazıldı, sandbox'ta henüz denenmedi): Checkout Form. `POST /payment/iyzipos/checkoutform/initialize/auth/ecom` ödeme sayfasını açar, `POST /payment/iyzipos/checkoutform/auth/ecom/detail` token'ın sonucunu döner (`paymentStatus` SUCCESS, FAILURE ya da henüz yok). Kimlik doğrulaması IYZWSv2 (HMAC-SHA256). Sepet tek satır (ürün + teslimat), tek çekim. Alıcı üye olmadan sipariş verdiği için e-posta yerine `tomurcuk.payment.iyzico.buyer-email`, kimlik numarası yerine iyzico'nun misafir değeri yazılır; alıcının IP'sini Next iletir. Pazaryeri modelinde (`marketplace: true`) satıra dükkânın alt üye işyeri anahtarı (`shop_payment_account`) yazılır; anahtarı yalnızca dükkân sahibi değiştirir. Ödeme sayfası açılamazsa sipariş açık kalır ve alıcıya `payment_unavailable` gösterilir.
- Anahtarlar repoya değil ortamın secret'larına girer: `TOMURCUK_PAYMENT_IYZICO_APIKEY`, `TOMURCUK_PAYMENT_IYZICO_SECRETKEY`. Sandbox denemesi için ortamın ağ ayarlarında `sandbox-api.iyzipay.com` izinli olmalı.


## Bildirimler

| Olay | Kime | Kanal |
| --- | --- | --- |
| `OrderConfirmed`: havalede sipariş anında, kartla ödemede ödeme ilk kez onaylanınca | gönderen (onay ve takip linki), dükkân sahipleri (yeni sipariş) | SMS, e-posta |
| `OrderStatusChanged` → Yolda | alıcı | SMS |
| → Teslim edildi | gönderen | SMS |
| → Teslim edilemedi | gönderen ve alıcı | SMS |

- Panelden elle girilen sipariş ve "Hazırlanıyor" geçişi bildirim göndermez.
- Dinleyiciler `@ApplicationModuleListener`: işlem tamamlandıktan sonra ayrı iş parçacığında çalışır, olay kaydı veritabanında durur. Sipariş akışı SMS sağlayıcısını beklemez; uygulama yeniden başlarsa yarım kalan olay yeniden işlenir.
- Bildirim önce `notification_log`'a yazılır, sonra gönderilir. `dedupe_key` (sipariş + tür + olay sırası + alıcı) tekildir; aynı olay iki kez işlense de bildirim bir kez gider. Teslim edilemeyen sipariş yeniden yola çıkınca olay sırası farklı olduğu için yeni SMS gider.
- Gönderilemeyen bildirim 1, 5, 30 dakika ve 2 saat arayla yeniden denenir; beşinci denemeden sonra bırakılır ve sağlayıcının yanıtıyla kayıtta kalır.
- Metinlerde alıcıya ve gönderene dükkân konuşur, dükkân adı başta yazılır; isimsiz gönderimde gönderen hiç geçmez. Bütün mesajlar işlem mesajıdır; pazarlama mesajı (09:00–21:00 kuralı, İYS izni) MVP'de otomatik gönderilmez.
- SMS sağlayıcısı Netgsm (`tomurcuk.sms.provider=netgsm`): `POST https://api.netgsm.com.tr/sms/rest/v2/send`, Basic auth, `encoding: TR`, `iysfilter: "0"` (bilgilendirme mesajı). Yanıttaki `code` "00" başarılıdır, `jobid` kayda yazılır. Kalıcı hatalar (20 metin, 30 kimlik, 40/41 başlık, 50/51 İYS, 70 parametre) yeniden denenmez; 85 ve 100 denenir. Kullanıcı kodu, şifre ve onaylı mesaj başlığı ortamın secret'larındadır: `TOMURCUK_SMS_NETGSM_USERCODE`, `TOMURCUK_SMS_NETGSM_PASSWORD`, `TOMURCUK_SMS_NETGSM_HEADER`. İstek biçimi Netgsm hesabıyla ilk gönderimde doğrulanmalı.
- Yerelde ve önizlemede `log`: SMS gönderilmez, log'a yazılır. E-posta sağlayıcısı (SMTP ya da servis) seçilince `EmailSender` adapter'ı eklenir.

## Örnek veri ve derleme

- Örnek dükkânlar, katalog, teslimat ve müşteriler `api/src/main/resources/db/demo/R__demo_data.sql` içinde, yalnızca `demo` profiliyle yüklenir (yerel, önizleme, staging). Tekrar çalıştırılabilir; kayıt varsa günceller.
- Örnek siparişler `api/src/main/resources/demo/orders.json` dosyasından her açılışta silinip yeniden yüklenir (`DemoOrders`); tarihler tasarımın taban gününden (22 Ekim) bugüne kaydırılır. Tasarımdaki teslimat ekranının doluluğu (sabah dolu, öğle 3 yer) günün ilk açılışında yazılır.
- Destek örnekleri (talepler, ekip notları, bildirimler, denetim kayıtları) `api/src/main/resources/demo/support.json`'dan her açılışta yüklenir (`DemoSupport`); zamanlar "şimdiden kaç dakika önce". Denetim kaydı silinemediği için örnekleri yalnızca ilk açılışta eklenir.
- Örnek veri, silinen frontend mock'unun (eski `web/lib/mock`) id'lerini kullanır; README'deki takip linkleri ve sipariş numaraları geçerlidir.
- Frontend derlemesi API'ye bağlanmaz. Image bir kez build edilip her ortamda çalıştığı için dükkân verisi derlemede sayfaya gömülmez: vitrin rotaları derlemede yalnızca kabuk (`SHELL_SLUG`) ile doğrulanır, dükkân sayfaları ilk ziyarette üretilip önbelleğe alınır.

## Testler

Kapsam bilerek dar tutulur; geliştirme hızı önce gelir.

- `ModularityTests`: modül sınırları (`ApplicationModules.verify()`).
- Aşama 3 (`CheckoutTests`, `DeliveryScheduleTests`): ödeme callback'inin iki kez gelmesi, aynı idempotency anahtarı, aynı aralığa 20 eşzamanlı rezervasyon (kapasite 6), süresi dolan rezervasyon, "bugün" ve son sipariş saatinde saat dilimi, başka dükkânın takip kodu.
- Aşama 4 (`PanelTests`): oturumsuz istek 401, yanlış şifrede hangi alanın yanlış olduğu söylenmez, durum geçişleri (atlanan ve geri giden reddedilir), çalışan iptal edemez (403), başka dükkânın siparişi ve müşterisi bulunamaz.

- Adapter'lar (`NetgsmSmsSenderTests`, `IyzicoPaymentProviderTests`): istek biçimi, imza ve yanıt kodları, sağlayıcıya bağlanmadan.
- Aşama 6 (`SupportTests`): şifre ve TOTP birlikte; dükkân oturumuyla panele destek girişi yok; telefon maskeli, gerekçesiz açılmaz, açılış kayda geçer; dükkân adına oturum çalışan yetkisinde (iptal 403), işlem kayda geçer, 30 dakikada biter; denetim kaydı güncellenemez ve silinemez.
- Aşama 5 (`NotificationTests`): aynı olay iki kez işlense de tek SMS, isimsiz gönderimde gönderen metinde yok.

Testlerde saat `MutableClock` ile sabitlenir, zamanlanmış işler kapalıdır (`tomurcuk.jobs.enabled=false`).

Testler tek bir paylaşılan Postgres container'ı kullanır (`@ServiceConnection`).

## Yerelde çalıştırma

Gerekenler: JDK 21, Docker (Windows'ta Docker Desktop), Node.js 22+ ve pnpm 10.

```bash
cd api && ./mvnw spring-boot:run      # Postgres'i compose.yaml'dan kaldırır, örnek veriyle açılır; http://localhost:8080
cd web && pnpm dev                    # http://localhost:3000; API adresi TOMURCUK_API_URL (varsayılan localhost:8080)
```

Frontend'in bütün sayfaları API'den beslenir; API çalışmadan açılmaz. Demo panel kullanıcıları (şifre `tomurcuk-demo`): `ayla@nergiscicek.com` (sahip), `kemal@nergiscicek.com` (çalışan), `leyla@lalebahcesi.com` (başka dükkânın sahibi). Demo destek ekibi (şifre `tomurcuk-demo`, doğrulama anahtarı `JBSWY3DPEHPK3PXP`; Google Authenticator gibi bir uygulamaya "anahtar gir" ile eklenir): `selin@tomurcuk.app` ve `mert@tomurcuk.app` (temsilci), `derya@tomurcuk.app` (lider). Frontend başka bir portta çalışıyorsa API'nin ödeme dönüş adresi `TOMURCUK_WEBURL` ortam değişkeniyle verilir (varsayılan `http://localhost:3000`).
