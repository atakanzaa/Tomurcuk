Tomurcuk, küçük çiçekçilerin kendi sipariş sayfası, sipariş paneli ve müşteri defteridir. Arayüz bir çiçekçi atölyesinin malzemelerinden gelir: kraft ambalaj kâğıdı, sap yeşili, şakayık pembesi ve buketin üstüne asılan kart notu etiketi. Üç arayüz aynı sistemi kullanır: alıcı vitrini (`alanadi.com/dukkan-adi`), satıcı paneli ve müşteri hizmetleri paneli.

## İçerik ilkeleri

- **Hitap:** Cümlelerde "siz" kullan. Alıcıya dükkân konuşur ("Siparişiniz hazırlanıyor"), çiçekçiye Tomurcuk konuşur ("Bugün 14 teslimatınız var"). Butonlar emir kipinde kısa fiil öbekleridir: "Siparişi tamamla", "Yola çıktı", "Fişi yazdır".
- **Düzen:** Cümle düzeni. Büyük harfle yazılmış etiket, başlık ya da buton yok. Emoji yok. Ünlem yok.
- **Somut ol:** "Siparişiniz alındı" değil, "Siparişiniz alındı. 14 Şubat'ta 13:00–16:00 arasında teslim edilecek." Belirsiz kelime yerine saat, ilçe, tutar yaz.
- **Hata ve boş ekran:** Ne olduğunu ve ne yapılacağını söyle, özür dileme. "Bu saat aralığı doldu. 16:00–19:00 arası hâlâ müsait." Boş ekran bir eyleme çağırır: "Henüz ürün yok. İlk ürününüzü ekleyin."
- **Biçimler:** Para `1.250 TL` (binlik nokta, boşluk, TL). Saat 24 saat `14:30`, aralık en dash ile `13:00–16:00`. Tarih `14 Şubat Cumartesi`; bugün ve yarın için "Bugün", "Yarın". Telefon `0532 412 88 19`.
- **Aynı işin adı değişmez:** "Yola çıktı" butonu, "Yola çıktı olarak işaretlendi" bildirimi, "Yolda" durumu.

## Renk

- Zemin her zaman `paper`. Form alanları, alt sayfalar ve açılır menüler `paper-raised`.
- Metin `ink`; ikincil bilgi (ilçe, saat aralığı, yardım metni) `ink-muted`. İkisi de `paper`, `paper-raised` ve `kraft` üzerinde okunur.
- `stem` marka rengidir: birincil buton, seçili saat aralığı, bağlantı. Üzerindeki metin `on-stem`.
- `kraft` vurgulu ama sakin yüzeydir: kart notu etiketi, seçili sipariş satırı, günün özet bandı. Sayfanın büyük kısmını kaplamaz.
- `peony` ekranda en fazla bir iki yerde: yeni sipariş sayısı, özel gün hatırlatması, alıcı vitrininde tek vurgu. Dolgu olarak kullanılırsa üzerindeki metin `on-peony`.
- Durum renkleri sabittir ve her zaman bir kelimeyle birlikte görünür: Yeni `peony-soft`/`peony-ink`, Hazırlanıyor `pollen-soft`/`pollen-ink`, Yolda `sky-soft`/`sky-ink`, Teslim edildi `stem-soft`/`stem-ink`, İptal ve Teslim edilemedi `danger-soft`/`danger-ink`.
- `pollen` metin rengi değildir; yalnızca nokta ve küçük işaretler.
- Ayırıcı çizgi `line`; form alanı ve ikincil buton kenarlığı `line-strong`.
- Koyu tema aynı rolleri taşır; değerler tokens.json'da. Koyu temada ham beyaz ya da siyah kullanma, `on-*` tokenlarını kullan.

## Tipografi

- İki aile: başlıklar `display` (Young Serif), geri kalan her şey `sans` (Schibsted Grotesk). Google Fonts'tan yüklenir.
- `display` yalnızca adlar ve başlıklar içindir: dükkân adı `display-m` (masaüstü `display-l`), ürün adı ve kart notu `display-s`, tanıtım sitesi ana başlığı `display-xl` (sayfada bir kez). Gövde metni hiçbir zaman serif değildir.
- Gövde `body`, form girişleri en az 16px. Listede ana bilgi `body-strong`, ikincil bilgi `body-s`. Form etiketi `label`, yardım metni `caption`.
- Saat ve tutarlar `numeric`. Tablo rakamı (`tabular-nums`) kullanma; bu ailede iki noktayı ve noktayı açar. Hizayı sabit genişlikli saat sütunu sağlar.
- Başlıkta tek kelimeyi italik, kalın ya da renkli yapma. Başlıkların üstüne küçük etiket ("YENİ", "ÖZELLİKLER") koyma.
- Satır uzunluğu 70 karakteri geçmez.

## Yerleşim

- **Kart yığını yok.** Siparişler, müşteriler ve talepler ince `line` çizgileriyle ayrılmış satırlardır. Gruplamayı boşluk (`space-5`, `space-6`) ve gerekiyorsa tek bir kraft bant yapar.
- Kutu yalnızca gerçek nesneler için: ürün fotoğrafı (`radius-l`), kart notu etiketi, alt sayfa.
- Köşe yarıçapı hiyerarşiye göre: kontroller `radius-m`, fotoğraf ve alt sayfa `radius-l`, etiket `radius-s`, durum çipi `radius-pill`.
- Gölge yalnızca süzülen katmanlarda: alt sayfa, açılır menü, bildirim (`shadow-lift`). Sayfa üzerindeki hiçbir şey gölgeli değildir.
- Kenar boşluğu mobilde `space-4`, masaüstünde `space-6`. Metin içeriği sola hizalıdır; ortalanmış metin yalnızca tek satırlık boş ekran mesajlarında.
- Arayüzlerin yoğunluğu farklıdır:
  - **Alıcı vitrini:** mobil öncelikli, tek sütun akış, ferah. Dükkânın adı ve fotoğrafları öne çıkar; Tomurcuk geri planda kalır ("Tomurcuk ile" yazısı yalnızca altbilgide).
  - **Alıcı ana sayfası (`/`):** Tomurcuk'un adıyla açılır; semt ve gün seçimi, o gün teslim eden dükkânlar satır satır. Dükkân satırına tıklayınca dükkânın kendi vitrinine geçilir.
  - **Satıcı paneli:** telefonda tek elle kullanılır. Ana ekran "Bugün": saat sütunlu sipariş satırları. Masaüstünde liste solda, seçili siparişin detayı sağda.
  - **Destek paneli:** masaüstü, yoğun. Satır yüksekliği 40px, tablolar ve zaman çizelgeleri; aynı renk ve tipografi.

## Görüntü

- Ürün fotoğrafları çiçekçinin kendi çektikleridir; stok görsel kullanılmaz. Oran 4:5.
- Fotoğraf yoksa yer tutucu `kraft` zemin üzerinde ürün adıdır.
- İllüstrasyon, maskot, 3B görsel ve degrade yok.
- Kraft nesneler kâğıt gibi görünür: kart notu etiketi, kraft bant, fotoğraf yer tutucusu ve giriş ekranının sol yüzü hafif lif dokusu taşır (`--kraft-fiber`, `web/app/globals.css`). Doku renk değildir, rengi yine `kraft` verir. Seçili satır ve üzerine gelme gibi durum yüzeyleri düz kalır.

## Hareket

- Hareket yalnızca bir eylemin sonucunu gösterir: alt sayfa açılır, durum değişince satır kısa süre `kraft` ile parlar. Süre 160–220ms, ease-out.
- Sayfa yüklenirken kayan, beliren bölümler yok. `prefers-reduced-motion` açıksa geçiş yok.

## Durumlar ve erişilebilirlik

- Odak halkası `focus`: 2px düz çizgi, 2px boşluk. Fareyle tıklamada görünmez, klavyede her zaman görünür.
- Dokunma hedefi en az 44px.
- Tüm metin çiftleri iki temada da 4.5:1 üstü; kontrol kenarlıkları 3:1 üstü.
- Devre dışı butonlar `opacity: .45` ve nedenini yanında söyler ("Ödeme bekleniyor").

## İkonlar

- İkon az kullanılır; kelime önce gelir. İkon yalnızca evrensel anlamı olan işler içindir: yazdır, ara, telefon, WhatsApp, kapat, geri.
- Phosphor Icons, "regular" ağırlık, 20px, renk `ink-muted` (etkin halde `ink`). React'te `@phosphor-icons/react@2.1.7`.
- Bu sistemde henüz ikon dosyası yok; ikon seti paket olarak yüklenir.

## Logo

- İşaret sap üstünde bir tomurcuktur: `kraft` kare zemin, `stem` sap, `peony` tomurcuk. Favicon (`web/app/icon.svg`) ile aynı çizim; kodda `Logo` ve `LogoMark` (`web/components/ui/Logo.tsx`), renkleri temadan alır.
- Ad `display` ailesinde "Tomurcuk", `ink` renginde; işaret adın solunda durur ve yazı boyutuyla büyür.
- Alıcı vitrininde Tomurcuk yalnızca altbilgide, küçük işaretle görünür. Satıcı panelinde menünün dibindedir; panelde öne çıkan ad dükkânınkidir.
- Büyük işaret yalnızca iki yerde: ana sayfadaki çiçekçilere bandı ve giriş ekranının kraft yüzü. Başka zeminde `--mark-bg`, `--mark-stem`, `--mark-bud` ile renkleri değişir.
