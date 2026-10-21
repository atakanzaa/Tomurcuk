# Tomurcuk

Küçük çiçekçiler için sipariş sayfası, sipariş paneli ve müşteri defteri. Proje kuralları `CLAUDE.md`'de.

## Çalıştırma

```bash
pnpm install
pnpm dev     # http://localhost:3000
pnpm lint
pnpm build
```

- `/nergis`: alıcı vitrini (mock dükkân)
- `/nergis/urun/p_lale`: ürün detayı; buradan sipariş akışı başlar
- `/nergis/siparis/teslimat`, `/kart-notu`, `/odeme`: sipariş adımları
- `/nergis/takip`: sipariş numarası ve telefonla sipariş bulma
- `/nergis/takip/a3Fq9ZmLx2VbN8cR` (alındı), `y7Kp2RvXq9LmT3sB` (yolda), `d4Wn8HcZp1QaE6uJ` (teslim edildi, isimsiz): örnek takip sayfaları
- `/bilesenler`: design system bileşenlerinin önizlemesi

Mock backend taslakları ve verilen siparişleri bellekte tutar; sunucu yeniden başlayınca sıfırlanır.

Backend henüz yok. Veri `lib/api` arayüzünden gelir ve şimdilik `lib/mock` ile çalışır; Spring Boot API'ye geçerken yalnızca `lib/api/impl.ts` değişir.
