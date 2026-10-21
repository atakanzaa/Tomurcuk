Sipariş ve talep durumunu bir kelime ve renkli bir noktayla gösterir.

**Sınıflar:** `tm-status` + bir durum: `--new` (Yeni), `--preparing` (Hazırlanıyor), `--onway` (Yolda), `--delivered` (Teslim edildi), `--failed` (İptal, Teslim edilemedi), `--muted` (Ödeme bekleniyor, Taslak gibi akış dışı haller).

**Tüketici verir:** durum kelimesi.

**Kullanım**
- Durum her zaman kelimeyle yazılır; renk tek başına anlam taşımaz.
- Renk eşlemesi sabittir: Yeni şakayık, Hazırlanıyor polen, Yolda gök, Teslim edildi sap yeşili, sorunlu haller `danger`. Başka bir anlam için bu renkleri kullanma.
- Destek talebi durumları da aynı bileşeni kullanır: Açık `--new`, Dükkân bekleniyor `--preparing`, Çözüldü `--delivered`.

**Yapma**
- Etiketi tıklanabilir yapma; durum değiştirme ayrı bir butondur.
