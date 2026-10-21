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
- `/bilesenler`: design system bileşenlerinin önizlemesi

Backend henüz yok. Veri `lib/api` arayüzünden gelir ve şimdilik `lib/mock` ile çalışır; Spring Boot API'ye geçerken yalnızca `lib/api/impl.ts` değişir.
