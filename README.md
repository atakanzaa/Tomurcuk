# Tomurcuk

Küçük çiçekçiler için sipariş sayfası, sipariş paneli ve müşteri defteri. Proje kuralları `CLAUDE.md`'de.

## Çalıştırma

```bash
pnpm install
pnpm dev     # http://localhost:3000
pnpm lint
pnpm build
```

**Tanıtım sitesi**
- `/`: tanıtım ve pilot başvuru formu

**Alıcı (vitrin ve sipariş akışı)**
- `/nergis`: dükkân vitrini; `/nergis/urun/p_lale` ürün detayı, buradan sipariş akışı başlar
- `/nergis/siparis/teslimat`, `/kart-notu`, `/odeme`: sipariş adımları
- `/nergis/takip`: sipariş numarası ve telefonla sipariş bulma (T-4821, 0533 207 41 65)
- `/nergis/takip/a3Fq9ZmLx2VbN8cR` (alındı), `y7Kp2RvXq9LmT3sB` (yolda), `d4Wn8HcZp1QaE6uJ` (teslim edildi, isimsiz)

**Satıcı paneli** (giriş ekranı yok; mock dükkân sahibi Ayla Er oturumda sayılır)
- `/panel`: Bugün; `?gun=yarin`, `?gun=hafta`
- `/panel/siparisler/[id]`: sipariş detayı ve durum geçişleri; `/panel/siparisler/yeni`: elle sipariş
- `/panel/siparisler`, `/panel/musteriler`, `/panel/musteriler/ozel-gunler`, `/panel/urunler`, `/panel/teslimat`, `/panel/yardim`, `/panel/fisler`

**Destek paneli** (mock destek temsilcisi Selin Karaca oturumda sayılır)
- `/destek`: talepler; `/destek/talepler/tk_1187` talep detayı
- `/destek/dukkanlar/shop_nergis`: dükkân özeti, "Dükkân adına gir"
- `/destek/siparisler`, `/destek/denetim`, `/destek/hazir-cevaplar`, `/destek/ara?q=elif`

**Geliştirme**
- `/bilesenler`: design system bileşenlerinin önizlemesi

Mock backend bütün değişiklikleri bellekte tutar; sunucu yeniden başlayınca sıfırlanır. Tasarımlardaki örnek tarihler (22 Ekim) ilk istekte bugüne kaydırılır.

Backend henüz yok. Veri `lib/api` arayüzünden gelir ve şimdilik `lib/mock` ile çalışır; Spring Boot API'ye geçerken yalnızca `lib/api/impl.ts` değişir.
