# Çiçekçi Sipariş Platformu — MVP

Oct 21, 2026 · @atakan

## Özet ve değer önerisi

MVP, kendi müşterisi olan küçük çiçekçilere üç şey verir: sipariş linki, tek sipariş paneli ve müşteri hatırlatmaları. Hedef 8 haftada çalışan ürün ve 3 ödeme yapan çiçekçi.

**Problem:** Çiçekçiler siparişi telefon, WhatsApp ve Instagram DM'den alıp deftere yazıyor. Saat, adres ve kart notu karışıyor, ödeme takibi zor. ÇiçekSepeti yeni müşteri getiriyor ama her siparişten komisyon kesiyor ve müşteriyi kendine bağlıyor.

**Konumlanma:** ÇiçekSepeti'nin yerine değil, yanında. "ÇiçekSepeti yeni müşteri getirir; sen eski müşterini komisyonsuz tutarsın."

**Tek cümlelik vaat:** "Instagram ve WhatsApp'tan gelen siparişlerini tek ekranda topla, müşterini kaybetme, komisyon ödeme."

## Hedef kullanıcı

İlk hedef, Instagram'dan zaten satış yapan 1-3 kişilik butik çiçekçiler. Tamamen ÇiçekSepeti'ne bağımlı dükkânlar hedef dışı.

| Persona | Durum | Asıl derdi | MVP'de karşılığı |
| --- | --- | --- | --- |
| Butik çiçekçi (birincil) | 1-3 kişi, Instagram'da takipçisi var, günde 5-30 sipariş | DM'de fiyat sorma, sipariş karışıklığı, ödeme takibi | Sipariş linki, online ödeme, panel |
| Mahalle çiçekçisi | Sadık müşteri, telefonla sipariş | Defter, unutulan teslimat, tekrar eden müşteriyi tanımamak | Manuel sipariş girişi, müşteri kartı, hatırlatma |
| Kurumsal iş yapan dükkân | Ofis, açılış, çelenk siparişleri | Faturalama, periyodik sipariş | v2 (abonelik, toplu fatura) |
| Son müşteri | Çiçek gönderen kişi, mobilden sipariş verir | Hızlı sipariş, teslim saati güvencesi | Mobil uyumlu sipariş sayfası, SMS/WhatsApp bilgilendirme |

## MVP kapsamı

Kural: Bir çiçekçinin defteri bırakıp bu ürünü kullanması için gereken minimum. Geri kalan her şey v2.

| Alan | MVP'de | v2 ve sonrası |
| --- | --- | --- |
| Vitrin | Tek sayfalık ürün listesi + sipariş linki (dukkan.alanadi.com) | Özel alan adı, tema seçimi, blog/SEO |
| Ödeme | Online kart ödemesi (iyzico veya PayTR alt üye işyeri), kapıda/havale işareti | Taksit kampanyaları, kupon, hediye çeki |
| Sipariş | Tek panel, durum akışı, manuel giriş, teslim saatine göre sıralama | Çoklu şube, stok takibi |
| Teslimat | İlçe/mahalle bazlı bölge ve ücret, saat aralıkları, günlük kapasite | Kurye uygulaması, rota optimizasyonu, harita |
| Müşteri | Müşteri kartı, sipariş geçmişi, özel gün hatırlatması | Sadakat puanı, segment bazlı kampanya |
| Alıcı hesabı | Üyeliksiz sipariş; takip linki; telefon + kodla "Siparişlerim" | Kayıtlı adresler, favoriler |
| Müşteri hizmetleri | Destek paneli, 3 platform rolü, yetki matrisi, dükkân adına giriş, talep sistemi, denetim kaydı | WhatsApp'tan talep, canlı sohbet, raporlama |
| Bildirim | Çiçekçiye yeni sipariş bildirimi; müşteriye onay ve teslim SMS/WhatsApp | Otomatik pazarlama mesajları |
| Fatura | Yok; çiçekçi mevcut sistemiyle keser | e-Arşiv/e-Fatura entegrasyonu |
| Entegrasyon | Yok | ÇiçekSepeti siparişlerini panele çekme, Instagram Shop |
| Kurumsal | Yok | Abonelik, periyodik sipariş, toplu fatura |

## Özellikler

Altı modül var; ilk üçü ürünün çekirdeği, geri kalanı onları tamamlıyor.

### 1. Sipariş linki ve vitrin

- Çiçekçinin ürünleri: fotoğraf, ad, fiyat, kısa açıklama, aktif/pasif.
- Ürün başına seçenek: boy (S/M/L), vazo ekle, çikolata ekle gibi ek ücretli seçenekler.
- Sipariş formu: alıcı adı ve telefonu, adres, ilçe/mahalle, teslim tarihi, saat aralığı, kart notu, gönderen adı (veya "isimsiz").
- Instagram bio ve WhatsApp'a koyulacak tek link; ürün bazlı paylaşım linki.
- Mobil öncelikli tasarım; siparişin %90'ı telefondan gelir.
- Her dükkânın kendi sayfası: kapak fotoğrafı ve logo, kuruluş yılı ve hikâyesi, en çok üç atölye fotoğrafı, "Dükkânın favorisi" (çiçekçinin notuyla) ve son üç ayın "En çok gönderilen" ürünü.

### 2. Ödeme

- iyzico veya PayTR ile kart ödemesi. Para doğrudan çiçekçiye gider (pazaryeri/alt üye işyeri modeli), sen paraya dokunmazsın.
- Alternatif: "Havale/kapıda ödeme" seçeneği; çiçekçi panelde "ödendi" işaretler.
- Başarısız ödemede sipariş "ödeme bekliyor" durumunda kalır.

### 3. Sipariş paneli

- Tüm siparişler tek listede: bugün, yarın, bu hafta sekmeleri.
- Teslim saatine göre sıralama ve "geciken" uyarısı.
- Durum akışı: Yeni → Hazırlanıyor → Yolda → Teslim edildi (+ İptal).
- **Manuel sipariş girişi:** telefon ve DM'den gelen sipariş 30 saniyede girilir. Bu, defteri bıraktıran özellik.
- Sipariş kaynağı etiketi: Link, Telefon, WhatsApp, Instagram, ÇiçekSepeti (manuel).
- Yazdırılabilir sipariş fişi ve kart notu.
- Teslim fotoğrafı yükleme; müşteriye otomatik gönderilir.

### 4. Müşteri kartı ve hatırlatma

- Telefon numarasıyla müşteri otomatik oluşur; geçmiş siparişler ve toplam harcama görünür.
- Özel gün kaydı: "Annesinin doğum günü 12 Mart" gibi; sipariş sırasında veya sonradan eklenir.
- Hatırlatma listesi: önümüzdeki 7 günün özel günleri. MVP'de çiçekçi tek tıkla hazır WhatsApp mesajı açar (wa.me linki), otomatik gönderim v2.
- Özel günler (14 Şubat, Anneler Günü) için müşteri listesi dışa aktarma.

### 5. Bildirimler

- Çiçekçiye: yeni siparişte e-posta + panel sesi; PWA push bildirimi.
- Müşteriye: sipariş onayı ve teslim edildi mesajı (SMS veya WhatsApp Business API).
- MVP'de maliyet düşük tutmak için müşteri bildirimi SMS ile başlar.

### 6. Teslimat bölgeleri ve kapasite

- Çiçekçi teslim ettiği ilçe/mahalleleri ve ücretini girer; listede olmayan adres sipariş veremez.
- Saat aralıkları (ör. 10-13, 13-16, 16-19) ve aralık başına maksimum sipariş.
- Kapalı günler ve "aynı gün sipariş için son saat" ayarı.

## Müşteri hizmetleri ve yetkilendirme

Destek temsilcisi tüm dükkânları ve siparişleri görür, çoğu işlemi dükkân adına yapabilir. Para, ödeme hesabı ve veri silme ise yalnızca dükkân sahibinde ya da senin elinde kalır. Her destek işlemi gerekçesiyle birlikte silinemez bir denetim kaydına yazılır.

### Roller

- **Platform sahibi (sen):** Her şey, rol yönetimi dahil.
- **Destek lideri:** Temsilcinin yapabildikleri artı iptal/iade onayı, dükkân askıya alma, zor taleplerin sahibi.
- **Destek temsilcisi:** Günlük destek: görüntüleme, düzeltme, dükkân adına giriş, talep yönetimi.
- **Dükkân sahibi / çalışanı:** Sadece kendi dükkânı (mevcut roller).

Son müşteri sorunu önce çiçekçiye gider. Destek ekibi çiçekçiye destek verir, gerektiğinde çiçekçi adına son müşteriyle konuşur.

### Yetki matrisi

| İşlem | Platform sahibi | Destek lideri | Destek temsilcisi | Dükkân sahibi | Dükkân çalışanı |
| --- | --- | --- | --- | --- | --- |
| Dükkân, sipariş, müşteri görüntüleme | Tümü | Tümü | Tümü | Kendi | Kendi |
| Müşteri telefon ve adresini açık görme | Evet | Evet | Maskeli; gerekçeyle açar | Evet | Evet |
| Sipariş durumu, not ekleme | Evet | Evet | Evet | Evet | Evet |
| Sipariş düzeltme (adres, saat, kart notu) | Evet | Evet | Evet | Evet | Evet |
| Sipariş iptali | Evet | Evet | Talep açar, lider onaylar | Evet | Hayır |
| İade başlatma | Evet | Evet | Hayır | Evet | Hayır |
| Ürün, fiyat, teslimat ayarı | Evet | Evet | Evet (dükkân adına) | Evet | Hayır |
| Dükkân adına giriş | Evet | Evet | Evet; süreli ve kayıtlı | — | — |
| Siparişleri geçici kapatma | Evet | Evet | Evet | — | — |
| Dükkân askıya alma, kalıcı kapatma | Evet | Evet | Hayır | — | — |
| Ödeme hesabı (IBAN, alt üye işyeri) | Hayır | Hayır | Hayır | Evet | Hayır |
| Abonelik ve plan değişikliği | Evet | Evet | Görüntüler | Görüntüler | Hayır |
| Kullanıcı ve rol yönetimi | Evet | Temsilci ekler | Hayır | Kendi çalışanları | Hayır |
| KVKK silme talebi | Evet | Hazırlar | Hayır | Talep açar | Hayır |
| Denetim kaydı | Tümü | Tümü | Kendi işlemleri | Kendi dükkânı | Hayır |

Ödeme hesabını kimse dükkân adına değiştiremez. Bu, "destek hesabı ele geçirildi, paralar başka IBAN'a gitti" senaryosunu baştan kapatır.

### Destek paneli

- **Global arama:** Sipariş no, telefon, dükkân adı veya alıcı adıyla tek kutudan arama.
- **Dükkân özeti:** Plan, son siparişler, ödeme durumu, gönderilen SMS'ler, açık talepler, dahili notlar tek ekranda.
- **Sipariş zaman çizelgesi:** Her durum değişikliği, kimin yaptığı, ödeme callback'leri ve bildirimler sırayla. "SMS gitti mi, ödeme düştü mü" sorusu 10 saniyede cevaplanır.
- **Dükkân adına giriş:** Gerekçe zorunlu, 30 dakika süreli, ekranın üstünde "Destek oturumu" bandı. Dükkân sahibine bildirim gider, tüm işlemler kayıtlı.
- **Maskeli veri:** Telefon "0532 \*\*\* \*\* 12" görünür. "Göster"e basınca gerekçe istenir ve loglanır.
- **Hazır cevaplar ve dahili notlar:** Sık sorulara şablon; dükkâna görünmeyen ekip notları.

### Talep sistemi

- **Kanallar:** MVP'de panel içi "Yardım" formu ve e-posta; hepsi talebe dönüşür. WhatsApp Business entegrasyonu v2.
- **Talep alanları:** Dükkân, ilgili sipariş, kategori (ödeme, teslimat, teknik, hesap), öncelik, durum (Açık, Dükkân bekleniyor, Çözüldü), atanan kişi.
- **Öncelik kuralı:** Bugün teslim edilecek siparişe bağlı talep otomatik "acil" olur.
- **Hedef yanıt süresi:** Acil talepte 15 dakika, normal talepte 4 saat (mesai içinde).
- **Özel gün modu:** 14 Şubat ve Anneler Günü haftasında acil talepler en üstte, destek saatleri uzatılır.
- Talep kapanınca dükkâna tek soruluk memnuniyet anketi.

### Güvenlik kuralları

- Rol tabanlı yetki, izinler tabloda: yeni rol eklemek deploy gerektirmez. Kontroller Spring Security'de izin bazlı (`ORDER_CANCEL`, `CUSTOMER_PII_VIEW` gibi).
- Platform kullanıcıları dükkân kullanıcılarından ayrı tabloda, ayrı giriş adresinde; iki adımlı doğrulama zorunlu.
- Kiracı izolasyonu: Dükkân kullanıcısının her sorgusu `shop_id` filtreli. Destek erişimi ayrı ve açıkça işaretlenmiş bir yoldan geçer ve her zaman loglanır.
- Denetim kaydı sadece eklenebilir: kim, ne zaman, hangi kayıt, eski ve yeni değer, gerekçe, IP.
- Kart bilgisi sistemde hiç tutulmaz, ödeme sağlayıcısında kalır.
- Çiçekçiyle yapılan hizmet sözleşmesine destek ekibinin veriye erişimi ve amacı yazılır (KVKK).

## Ekranlar: alıcı, satıcı, müşteri hizmetleri

Üç rolün üç ayrı arayüzü var: ayrı adres, ayrı giriş, ayrı menü. Arkada aynı uygulama ve veritabanı çalışır; ekranlar yalnızca o rolün işine göre kesilir.

| Arayüz | Adres | Giriş | Cihaz |
| --- | --- | --- | --- |
| Alıcı (son müşteri) | alanadi.com/dukkan-adi | Üyelik yok; sipariş takibi SMS linki veya telefon + tek kullanımlık kod | Mobil tarayıcı |
| Satıcı (çiçekçi) | panel.alanadi.com | E-posta + şifre | Telefon (PWA) ve bilgisayar |
| Müşteri hizmetleri | destek.alanadi.com | E-posta + şifre + iki adımlı doğrulama | Bilgisayar |

### Alıcı ekranları

| Ekran | Ne yapar |
| --- | --- |
| Dükkân vitrini | Kapak, logo, dükkân adı, hikâye, dükkânın favorisi, en çok gönderilen, ürün listesi, teslim bölgeleri bilgisi |
| Ürün detayı | Fotoğraflar, boy ve ek seçenekleri, fiyat |
| Sipariş formu | Teslim bölgesi, tarih, saat aralığı, alıcı bilgisi, kart notu, isimsiz gönderim |
| Ödeme | Kart ödemesi (sağlayıcı sayfası) veya havale/kapıda seçeneği |
| Sipariş onayı | Özet, sipariş no, takip linki |
| Sipariş takip | Durum (Hazırlanıyor, Yolda, Teslim edildi), teslim fotoğrafı, dükkânı ara / WhatsApp butonu |
| Siparişlerim | Telefon + kodla giriş; geçmiş siparişler, "tekrar gönder", özel gün ekleme |
| Yardım | Dükkâna ulaşma; sorun bildirme formu (dükkâna düşer) |

### Satıcı ekranları

| Ekran | Ne yapar |
| --- | --- |
| Bugün | Bugün ve yarın teslim edilecekler saat sırasıyla, geciken uyarısı |
| Siparişler | Tüm siparişler; durum, tarih, kaynak filtreleri |
| Sipariş detayı | Bilgiler, durum değiştirme, fiş ve kart notu yazdırma, teslim fotoğrafı yükleme |
| Yeni sipariş (manuel) | Telefon/DM siparişini 30 saniyede girme; telefonla müşteri otomatik bulunur |
| Ürünler | Ürün ve seçenek ekleme, fiyat, aktif/pasif |
| Müşteriler | Müşteri kartları, sipariş geçmişi, özel günler |
| Hatırlatmalar | Önümüzdeki 7 günün özel günleri, tek tıkla WhatsApp mesajı |
| Ayarlar | Teslimat bölgeleri, saat aralıkları, kapalı günler, çalışanlar, ödeme hesabı |
| Yardım | Talep açma, açık taleplerim, SSS |

### Müşteri hizmetleri ekranları

| Ekran | Ne yapar |
| --- | --- |
| Ana ekran | Bana atanan talepler, acil kuyruk, bugünkü teslimatı riskli siparişler |
| Global arama | Sipariş no, telefon, dükkân veya alıcı adıyla arama |
| Talepler | Kuyruk, filtreler, atama, durum |
| Talep detayı | Yazışma, dahili not, hazır cevap, ilgili sipariş ve dükkâna geçiş |
| Dükkânlar | Tüm dükkânlar; plan, durum, son aktivite |
| Dükkân özeti | Siparişler, ödemeler, bildirim logları, talepler, notlar; "dükkân adına gir" butonu |
| Sipariş zaman çizelgesi | Durum, ödeme ve bildirim olayları sırayla, kim yaptı |
| Denetim kaydı | Destek işlemleri; kişi, dükkân, tarih filtreleri |
| Ekip ve roller | Destek kullanıcıları ve yetkileri (lider ve sahip görür) |

Tasarım ilkesi: Alıcı ekranı tek iş için sade, satıcı ekranı telefonda tek elle kullanılır, müşteri hizmetleri ekranı bilgisayarda yoğun bilgi gösterir.

## Kullanıcı akışları

Linkten gelen sipariş de telefonla gelen sipariş de aynı panele düşer ve müşteri kartında birikir; ürünün değeri bu döngüde.

&#91;embedded content: sipariş akışı · müşteri ve çiçekçi\]

Son müşterinin akışı üye olmadan 2 dakikanın altında bitmeli. Çiçekçinin günü panelde "Bugün" sekmesiyle başlar.

## Edge case'ler

En pahalı hatalar para, zaman ve eşzamanlılık sınırlarında çıkar. "Çözüm" sütunu tasarım kararıdır; kod baştan bu kararlara göre yazılır.

### Sipariş ve ödeme

| Durum | Risk | Çözüm |
| --- | --- | --- |
| Ödeme alındı ama callback gelmedi veya geç geldi | Para çekildi, sipariş görünmüyor | Sipariş "ödeme bekliyor"da kalır; zamanlanmış iş 15 dakikada bir sağlayıcıdan durumu sorgular |
| Callback iki kez geldi | Çift sipariş, çift bildirim | `payment.sağlayıcı_ref` tekil; ikinci çağrı etkisiz |
| Alıcı "Öde"ye iki kez bastı | İki sipariş | Formda tek kullanımlık idempotency anahtarı; sunucuda tekil |
| Ödeme sayfasındayken saat aralığı doldu | Kapasite aşımı | Formda 10 dakikalık geçici rezervasyon; süre dolarsa serbest kalır |
| 3D Secure yarıda kaldı | Sipariş sonsuza kadar bekler | 30 dakika sonra iptal, rezervasyon serbest |
| Sipariş sonrası ürün fiyatı değişti | Yanlış tutar | Fiyat ve ürün adı sipariş anında `order_item`'a kopyalanır |
| Ürün ödeme anında pasife alındı | Olmayan ürün satılır | Ödeme başlamadan önce sunucuda yeniden doğrulama |
| Kısmi iade (vazo yoktu) | Fazla iade | İade toplamı ödenen tutarı aşamaz; her iade ayrı kayıt |
| Havale seçildi, para gelmedi | Ücretsiz teslimat | Panelde "ödeme alınmadı" rozeti; teslim günü uyarı |

### Teslimat ve zaman

| Durum | Risk | Çözüm |
| --- | --- | --- |
| Saat dilimi | "Bugün" yanlış hesaplanır | Zamanlar UTC saklanır, dükkânın saat dilimine (Europe/Istanbul) göre gösterilir ve hesaplanır |
| Aynı gün son saati geçti | Yetişmeyecek sipariş | Kontrol sunucuda; istemciye güvenilmez |
| Aynı aralığa eşzamanlı iki sipariş | Kapasite aşımı | Atomik güncelleme: `UPDATE … SET used = used + 1 WHERE used < capacity` |
| Siparişi olan güne kapalı gün eklendi | Unutulan teslimat | Eklerken etkilenen siparişler listelenir, onay istenir |
| Teslimat bölgesi silindi | Eski sipariş bozulur | Soft delete; bölge adı ve ücret siparişe kopyalanır |
| Alıcı adreste yok | Çiçek solar | "Teslim edilemedi" durumu + not; tekrar deneme; alıcıya ve gönderene SMS |
| Hatalı telefon numarası | Ulaşılamayan alıcı | Format doğrulaması (libphonenumber); alıcı telefonu zorunlu |
| 14 Şubat'ta normalin 10 katı sipariş | Yavaşlama, kayıp | Aralık kapasiteleri, ocak sonunda yük testi |

### Müşteri ve veri

| Durum | Risk | Çözüm |
| --- | --- | --- |
| Gönderen ile alıcı farklı kişi | Yanlış müşteri kartı | Müşteri kartı göndereni tutar; özel gün alıcı adıyla gönderene bağlanır |
| İsimsiz gönderim | Sürpriz bozulur | Alıcıya giden SMS'te ve takip sayfasında gönderen adı gösterilmez |
| Aynı telefon farklı isimle | Mükerrer müşteri | Dükkân + telefon tekil; isim farkı not olarak kalır |
| 29 Şubat özel günü | Hatırlatma hiç gelmez | Artık yıl olmayan yıllarda 28 Şubat'ta hatırlatılır |
| Pazarlama izni yok | İYS ihlali | İzinsiz müşteriye hatırlatma butonu kapalı |
| KVKK silme talebi | Muhasebe kaydı kaybı | Kişisel veri anonimleştirilir, tutarlar kalır |
| Kart notunda uzun metin veya emoji | Fiş taşar | 250 karakter sınırı; yazdırma önizlemesi |

### Çok kiracılık, destek, bildirim

| Durum | Risk | Çözüm |
| --- | --- | --- |
| Başka dükkânın sipariş id'si URL'de denendi | Veri sızıntısı | Her sorgu `shop_id` filtreli; 403 değil 404 döner |
| Sıralı id'ler | Sipariş hacmi tahmin edilir | Dışa açık id'ler ULID; takip linki tahmin edilemez token |
| Destek oturumunun süresi doldu | Yetkisiz işlem | İşlem reddedilir; yeni gerekçeyle oturum |
| Dükkânın aboneliği bitti | Veri kaybı korkusu | Vitrin "şu an sipariş alınmıyor", panel salt okunur; veri silinmez |
| Dükkân adresi (slug) değişti | Eski Instagram linki kırılır | Eski slug kalıcı yönlendirme (301) |
| SMS sağlayıcısı çöktü | Sipariş akışı durur | Outbox tablosu + artan aralıklarla yeniden deneme; sipariş bloklanmaz |
| Aynı bildirim iki kez | Spam | Bildirim anahtarı (sipariş + tür) tekil |
| Gece geç saatte hatırlatma | Rahatsızlık | Pazarlama mesajları 09:00-21:00 arası; işlem mesajları her saat |

## Veri modeli

Çok kiracılı (multi-tenant) tek veritabanı: her tabloda `shop_id` var, tüm sorgular ona göre filtrelenir.

| Tablo | Temel alanlar | Not |
| --- | --- | --- |
| shop | id, ad, slug, telefon, adres, logo, aktif, plan, aynı\_gün\_son\_saat | Çiçekçi dükkânı; slug sipariş linkinde kullanılır |
| shop\_user | id, shop\_id, ad, e-posta, şifre\_hash, rol (sahip/çalışan) | MVP'de dükkân başı 1-2 kullanıcı |
| product | id, shop\_id, ad, açıklama, fiyat, fotoğraf\_url, aktif, sıra |  |
| product\_option | id, product\_id, ad, ek\_fiyat | Boy, vazo, çikolata gibi eklemeler |
| delivery\_zone | id, shop\_id, ilçe, mahalle (opsiyonel), ücret, aktif |  |
| time\_slot | id, shop\_id, başlangıç, bitiş, kapasite | Haftalık şablon |
| closed\_day | id, shop\_id, tarih | Tatil ve kapalı günler |
| customer | id, shop\_id, ad, telefon, e-posta, not | shop\_id + telefon tekil |
| special\_day | id, customer\_id, başlık, gün, ay, alıcı\_adı | Yıl tutulmaz; her yıl tekrar eder |
| order | id, shop\_id, customer\_id, kaynak, durum, ödeme\_durumu, ödeme\_yöntemi, teslim\_tarihi, time\_slot\_id, delivery\_zone\_id, alıcı\_adı, alıcı\_telefon, adres, kart\_notu, isimsiz, ara\_toplam, teslimat\_ücreti, toplam, teslim\_foto\_url, oluşturma\_zamanı | Para alanları kuruş cinsinden tamsayı |
| order\_item | id, order\_id, product\_id, ürün\_adı, birim\_fiyat, adet, seçenekler (JSON) | Ad ve fiyat sipariş anında kopyalanır |
| payment | id, order\_id, sağlayıcı, sağlayıcı\_ref, tutar, durum, ham\_yanıt (JSON) | Callback'ler idempotent işlenir |
| notification\_log | id, shop\_id, order\_id, kanal, alıcı, durum, gönderim\_zamanı | SMS maliyet takibi için |

Müşteri hizmetleri ve alıcı girişi için ek tablolar:

| Tablo | Temel alanlar | Not |
| --- | --- | --- |
| platform\_user | id, ad, e-posta, şifre\_hash, totp\_secret, aktif | Destek ekibi; shop\_user'dan ayrı |
| role | id, kapsam (platform/dükkân), ad | Platform sahibi, Destek lideri, Destek temsilcisi, Dükkân sahibi, Dükkân çalışanı |
| permission | id, kod | ORDER\_CANCEL, CUSTOMER\_PII\_VIEW, SHOP\_IMPERSONATE gibi |
| role\_permission | role\_id, permission\_id | Yetki matrisi buradan okunur |
| user\_role | kullanıcı\_tipi, kullanıcı\_id, role\_id | Platform ve dükkân kullanıcıları için ortak |
| impersonation\_session | id, platform\_user\_id, shop\_id, gerekçe, başlangıç, bitiş | 30 dk süre; dükkâna bildirim |
| audit\_log | id, aktör\_tipi, aktör\_id, shop\_id, işlem, kayıt\_tipi, kayıt\_id, eski\_değer (JSON), yeni\_değer (JSON), gerekçe, ip, zaman | Sadece ekleme; güncelleme ve silme yok |
| support\_ticket | id, shop\_id, order\_id, kategori, öncelik, durum, atanan\_id, açan\_tipi, oluşturma\_zamanı, ilk\_yanıt\_zamanı, kapanış\_zamanı | Yanıt süresi buradan ölçülür |
| ticket\_message | id, ticket\_id, yazan\_tipi, yazan\_id, metin, dahili (bool), zaman | Dahili notlar dükkâna görünmez |
| canned\_reply | id, başlık, metin, kategori | Hazır cevaplar |
| buyer\_otp | id, telefon, kod\_hash, son\_geçerlilik, deneme\_sayısı | Alıcının "Siparişlerim" girişi |

KVKK notu: Alıcı adı, telefonu ve adresi kişisel veridir. Aydınlatma metni, açık rıza (hatırlatma mesajları için) ve silme talebi akışı MVP'de olmalı.

## Teknik mimari

Zaten bildiğin stack: Java 21 + Spring Boot, modüler monolit, PostgreSQL. Mikroservis yok; tek kişi için tek deploy ve tek veritabanı en hızlı yol.

&#91;embedded content: teknik mimari · tek uygulama, 4 dış servis\]

| Katman | Seçim | Neden |
| --- | --- | --- |
| Backend | Java 21, Spring Boot 3, Spring Modulith | Günlük iş stack'in; modül sınırları ileride servis ayırmayı kolaylaştırır |
| Veritabanı | PostgreSQL + Flyway | JSON alanlar, sağlam migration |
| Vitrin ve panel | Thymeleaf + HTMX (ya da Next.js) | Tek uygulamada sunucu tarafı render; vitrin mobilde hızlı açılır. Frontend deneyimin varsa Next.js |
| Panel bildirimleri | PWA + Web Push | Uygulama mağazasına gerek yok |
| Dosyalar | S3 uyumlu depo (Cloudflare R2 vb.) | Ucuz, CDN ile hızlı |
| Ödeme | iyzico veya PayTR pazaryeri/alt üye işyeri | Para çiçekçiye gider, sen lisanslı ödeme kuruluşu olmazsın |
| SMS | Yerli SMS sağlayıcı (Netgsm, İleti Merkezi vb.) | İYS uyumu, TL fiyat |
| Hosting | Tek VPS + Docker Compose, günlük DB yedeği | Düşük sabit maliyet; KVKK için yurt içi sunucu tercih sebebi |
| İzleme | Sentry + basit uptime kontrolü | 14 Şubat'ta sorun olursa anında haber |

Maliyet tahmini (yaklaşık, doğrulanmadı): VPS, alan adı ve dosya deposu ayda birkaç yüz TL düzeyinde; SMS kullanım kadar.

## Ortamlar ve CI/CD

Üç kalıcı ortam gerekmez: PR başına geçici önizleme, tek staging (QA) ve prod yeter. Ortamı dal değil deploy belirler; aynı Docker image staging'den proda değişmeden ilerler.

&#91;embedded content: deploy hattı · önizleme, staging, prod\]

### Ortamlar

| Ortam | Ne zaman | Veri | Dış servisler | Nerede |
| --- | --- | --- | --- | --- |
| Local | Geliştirirken | Docker Compose Postgres + örnek veri | iyzico sandbox, SMS log'a yazılır | Bilgisayarın |
| Önizleme (test) | PR açılınca; kapanınca silinir | Boş DB + örnek dükkân ve ürünler | iyzico sandbox, SMS kapalı | Sunucu 1, pr-42.test.alanadi.com |
| Staging (QA) | main'e her merge | Kalıcı test verisi; prod verisi asla kopyalanmaz | iyzico sandbox, SMS sadece ekip numaralarına | Sunucu 1, staging.alanadi.com |
| Prod | Manuel onayla | Gerçek | Canlı | Sunucu 2 |

### Karıştırmamak için kurallar

- **Dal = ortam değil.** develop, qa, prod dalları yok; sadece main ve kısa ömürlü feature dalları.
- **Bir kez build et.** Image bir kez build edilir, git sha ile etiketlenir; staging ve prod aynı image'ı çeker.
- **Kodda ortam kontrolü yok.** `if (prod)` yazılmaz; farklar sadece config'te: `application.yml` + profil dosyaları (preview, staging, prod).
- **Dış servis farkları adapter ile.** Örneğin `SmsSender` arayüzü: prod'da gerçek sağlayıcı, diğerlerinde log'a yazan sürüm; seçimi profil yapar.
- **Sırlar repoda değil.** CI'ın secret yönetiminde ve sunucudaki `.env` dosyasında.
- **Bitmemiş özellik feature flag arkasında** main'e girer; uzun yaşayan dal açılmaz.
- **Migration'lar önce staging'de çalışır.** Kolon silme gibi geri alınamayan değişiklik iki deploy'a bölünür.
- **Prod deploy:** manuel onay, otomatik smoke test, sorun olursa tek komutla bir önceki etikete dönüş.

### Repo düzeni

```
/
├─ src/                         # uygulama kodu, ortamdan bağımsız
├─ src/main/resources/
│  ├─ application.yml
│  ├─ application-preview.yml
│  ├─ application-staging.yml
│  └─ application-prod.yml
├─ deploy/
│  ├─ compose.base.yml
│  ├─ compose.preview.yml
│  ├─ compose.staging.yml
│  ├─ compose.prod.yml
│  └─ scripts/                   # deploy.sh, rollback.sh, smoke.sh
├─ Dockerfile
└─ Jenkinsfile                  # veya .github/workflows/
```

Önizleme ortamı: Sunucu 1'de Traefik ve `*.test.alanadi.com` joker DNS kaydı. Her PR ayrı bir compose projesi (`docker compose -p pr-42`) ve kendi Postgres container'ı ile kalkar. PR kapanınca `down -v` ile silinir. Aynı anda en fazla 3 önizleme çalışır.

### Jenkins mi, GitHub Actions mı

|  | Jenkins | GitHub Actions |
| --- | --- | --- |
| Kurulum | Ayrı sunucu, eklenti ve güvenlik güncellemeleri sende | Sunucu yok |
| Prod onayı | Pipeline'da `input` adımı | Environment korumasıyla hazır onay kutusu |
| PR önizleme tetikleyicisi | Multibranch pipeline + webhook | `pull_request` olayları hazır |
| Tanıdıklık | n11'den biliyorsun | Yeni ama basit |

Öneri: Tek kişilik MVP için GitHub Actions. Jenkins'te ısrarcıysan tasarım aynı kalır, sadece pipeline dosyası Jenkinsfile olur.

## Fiyatlandırma

Sabit aylık ücret, sipariş başına komisyon yok. "Komisyon yok" satış argümanının kendisi olduğu için bu bozulmamalı. Aşağıdaki rakamlar başlangıç varsayımı; doğrulama görüşmelerinde test edilecek.

| Paket | Kime | İçerik | Öneri (aylık) |
| --- | --- | --- | --- |
| Pilot | İlk 5 çiçekçi | Her şey, 3 ay ücretsiz; karşılığında haftalık geri bildirim | 0 TL |
| Başlangıç | Butik çiçekçi | Vitrin, panel, müşteri kartı, 100 SMS | 499-799 TL |
| Pro | Yoğun dükkân | + çoklu kullanıcı, sınırsız ürün, 500 SMS, öncelikli destek | 999-1.499 TL |

- Ödeme sağlayıcısının (iyzico/PayTR) komisyonu ayrıdır ve çiçekçiden kesilir; bunu satışta açıkça söyle.
- Ek SMS paketleri maliyetin üstüne küçük bir marjla satılır.
- Kurulum hizmeti (ürünleri yükleme, fotoğraf düzenleme) tek seferlik ücretli seçenek olabilir.
- Kıyas için çiçekçiye şunu hesaplat: "Ayda kaç siparişin tekrar eden müşteriden geliyor ve ÇiçekSepeti'ne ne kadar komisyon ödüyorsun?" Aylık ücret, birkaç siparişin komisyonundan az olmalı.

## Yol haritası

Mesai dışı haftada 10-15 saatle 9 hafta; müşteri hizmetleri paneli bir hafta ekliyor. Bugünden başlarsan pilot aralık sonunda biter, ocak ayı 14 Şubat hazırlığına kalır.

&#91;embedded content: yol haritası · 8 hafta, 2 kapı\]

Birinci kapı geçilmezse kod yazılmaz, kapsam değişir. 14 Şubat gerçek yük testi: pilot dükkânlar o gün sorunsuz çalışırsa ürün satışa hazırdır.

## Doğrulama planı ve metrikler

Kod yazmadan önce 10 çiçekçiyle konuş; en az 3'ü pilota "evet" demezse kapsamı değiştir.

**Adımlar**

1. Instagram'da şehrindeki 20-30 butik çiçekçiyi listele, 10'u ile yüz yüze veya telefonda 15 dakika konuş.
2. Figma ya da basit bir HTML ile tıklanabilir sipariş sayfası ve panel prototipi göster.
3. 5 pilot çiçekçi seç, ürünlerini sen yükle, 2 hafta gerçek siparişle kullansınlar.
4. Pilot sonunda ücretli pakete geçmeyi teklif et.

**Sorulacak sorular**

- Günde/haftada kaç sipariş alıyorsunuz, hangi kanaldan ne kadar?
- Siparişi nereye yazıyorsunuz? En son hangi sipariş karıştı ya da unutuldu?
- ÇiçekSepeti veya benzerini kullanıyor musunuz? Siparişlerin ne kadarı oradan geliyor, komisyon ne kadar?
- Müşterilerinizin ne kadarı tekrar geliyor? Onlara özel günlerde ulaşıyor musunuz?
- Online ödeme alıyor musunuz, nasıl (IBAN, link, POS)?
- Teslimatı kim yapıyor, hangi bölgelere?
- Bugün bu iş için herhangi bir yazılıma para veriyor musunuz? Ne kadar?
- Bu araç olsa ayda ne verirdiniz? Pilota katılır mıydınız?

**Başarı metrikleri (pilot sonu)**

| Metrik | Hedef |
| --- | --- |
| Pilot sonrası ücretli devam eden dükkân | 5'te 3 |
| Pilot dükkânlarda panele girilen siparişlerin oranı | %80+ (defter bırakıldı mı?) |
| Sipariş linkinden gelen sipariş oranı | %30+ |
| Haftalık aktif kullanım | Dükkân başına haftada 5+ gün |
| Hatırlatmadan dönen sipariş | En az 1 dükkânda ölçülebilir örnek |

## Riskler ve hukuki notlar

En büyük risk teknik değil: çiçekçinin alışkanlığını değiştirmek. İkincisi, işverenle ilgili sözleşme maddeleri.

| Risk | Etki | Önlem |
| --- | --- | --- |
| Çiçekçi defteri bırakmıyor | Ürün kullanılmaz | Manuel giriş 30 saniyenin altında; ilk kurulumu sen yap |
| Özel günlerde yük patlaması (14 Şubat) | Sistem yavaşlar, sipariş kaybı | Basit mimari, yük testi, ocak sonuna kadar hazır ol |
| Ödeme sağlayıcısı alt üye işyeri onayı uzun sürer | Pilot gecikir | Başvuruyu 1. haftada başlat; yedek olarak havale/kapıda |
| Destek yükü | Tek kişi boğulur | WhatsApp destek saatleri, SSS, video rehber |
| ÇiçekSepeti benzer araç çıkarır | Fark azalır | Müşteri sahipliği ve komisyonsuz model kopyalanamaz |
| İşveren sözleşmesi (ek iş, rekabet, fikri mülkiyet) | Hukuki sorun | Sözleşmeyi oku; gerekirse İK'dan yazılı izin; kendi cihaz, hesap ve mesai dışı |

**Hukuki kontrol listesi**

- [ ] İş sözleşmesindeki ek iş, rekabet ve fikri mülkiyet maddelerini oku
- [ ] Gerekirse İK'dan yazılı izin al
- [ ] Şahıs şirketi veya şirket kuruluşu (fatura kesebilmek için)
- [ ] KVKK aydınlatma metni, açık rıza ve VERBİS gerekliliğini kontrol et
- [ ] Mesafeli satış sözleşmesi ve ön bilgilendirme formu şablonları (çiçekçi adına)
- [ ] Çiçekçiyle hizmet sözleşmesi: veri sorumlusu çiçekçi, sen veri işleyen
- [ ] SMS için İYS (İleti Yönetim Sistemi) kaydı; ticari mesajlarda onay

Bu notlar hukuki tavsiye değildir; şirket kuruluşu ve sözleşmeler için bir avukat ve muhasebeciyle görüş.
