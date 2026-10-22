# Tomurcuk

Küçük çiçekçiler için sipariş sayfası, sipariş paneli ve müşteri defteri. Kişisel yan proje; işverene (n11) ait hiçbir kod, veri veya iç bilgi bu repoya girmez.

## Belgeler (gerektiğinde oku)

- `docs/mvp.md`: kapsam, özellikler, roller ve yetki matrisi, edge case'ler, veri modeli, ortamlar ve CI/CD, yol haritası. Bir özelliğe başlamadan önce ilgili bölümünü oku.
- `docs/backend.md`: backend planı; modüller, API kuralları, aşamalar ve hangi aşamada hangi mock'un kalktığı. Backend'de iş yapmadan önce oku.
- `deploy/README.md`: image'lar, ortamlar (önizleme, staging, prod), sunucu ve GitHub kurulumu, geri dönüş. Yayınla ilgili iş yapmadan önce oku.
- `design/tomurcuk/`: design system. `tokens.json` tek doğru kaynak; `tokens.css` ondan üretilmiş CSS değişkenleri; `components/bundle.css` bileşen stilleri; her bileşenin `README.md` dosyası kullanım kuralları.
- `design/screens/`: onaylanmış ekran tasarımları (alıcı, satıcı, destek, tanıtım). Bunlar referans mockup'lardır; `<x-dc>`, `{{...}}` ve `data-props` gibi canvas işaretlemeleri içerir. Ekranı React'te yeniden kur, dosyayı olduğu gibi kopyalama. Düzen, metinler, boşluklar ve renk tokenları birebir korunur.

## Güncel kararlar (`docs/mvp.md` ile çelişirse bunlar geçerli)

- **Repo:** tek repo. `web/` Next.js frontend, `api/` Spring Boot backend; `design/` ve `docs/` ortak.
- **Frontend:** Next.js (React, TypeScript, App Router). Alıcı vitrini sunucu tarafında render edilir. Satıcı ve destek panelleri aynı projede ayrı route grupları: `(vitrin)`, `(panel)`, `(destek)`. Thymeleaf/HTMX kullanılmıyor.
- **Backend:** Java 21, Spring Boot 4, Maven, modüler monolit (Spring Modulith), PostgreSQL + Flyway. Frontend'e REST API sunar; tarayıcı API'yi doğrudan çağırmaz.
- **Ödeme:** iyzico (pazaryeri, Checkout Form).
- **CI/CD:** GitHub Actions. Ortama göre dal yok: sadece `main` ve kısa ömürlü feature dalları. PR açılınca önizleme ortamı, `main`'e merge sonrası staging, prod'a tag ve onayla çıkılır. Image bir kez build edilir.
- **Testler:** dar kapsam, geliştirme hızı önce gelir. Modül sınırı testi ve şu beş senaryo: ödeme callback'inin iki kez gelmesi, aynı saat aralığına eşzamanlı sipariş, başka dükkânın verisine erişim denemesi, sipariş durum geçişleri, "bugün" hesabında saat dilimi. Testcontainers ile gerçek Postgres.

## Tasarım kuralları

@design/tomurcuk/README.md

Kodda ek olarak:
- Renk, boşluk, köşe ve yazı tipi değerleri yalnızca `tokens.css` değişkenlerinden gelir; bileşenlerde ham hex yazılmaz.
- Para birimi "TL" olarak yazılır (₺ değil), binlik ayırıcı nokta: `1.250 TL`.
- `font-variant-numeric: tabular-nums` kullanılmaz.
- Kart yığını kurulmaz. Liste öğeleri satırdır; gölge yalnızca süzülen katmanlarda (`--shadow-lift`).
- Arayüz metinleri Türkçe ve "siz" hitabıyla; büyük harfli etiket, emoji ve ünlem yok.

## Claude.ai'deki kaynaklar

Güncel sürümler claude.ai'de; bu repodaki kopyalar 21 Ekim 2026 tarihli.
- Design system: https://claude.ai/artifact/Gr8KNspHwvTwU6hZ44MWNK
- MVP dokümanı: https://claude.ai/artifact/Ny8r4KssJnfMmovQRKbXXQ
- Alıcı vitrini: https://claude.ai/artifact/TMeomLsq4mtk3E38j9peFg
- Satıcı paneli: https://claude.ai/artifact/3em1eaVR2rLatuyKBdSfeB
- Destek paneli: https://claude.ai/artifact/4qmTguQb6NVZ7Ur8P4Y9Qo
- Tanıtım sitesi: https://claude.ai/artifact/3sHjsZ5gvjpDVL7QMqSHqp
