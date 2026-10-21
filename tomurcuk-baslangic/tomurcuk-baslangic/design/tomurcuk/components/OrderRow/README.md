Satıcı panelinde bir siparişin tek satırlık özeti: saat, alıcı, yer, ürün, durum, tutar.

**Yapı:** `ul.tm-orders` > `li.tm-order` üç sütun: saat (`tm-order__time` + `tm-order__slot`), kim ve ne (`tm-order__who`, `tm-order__where`, `tm-order__items`), sağda durum ve tutar (`tm-order__side`). Geciken sipariş `tm-order--late`, açık olan `tm-order--selected`.

**Tüketici verir:** teslim saati veya aralığı, alıcı adı, ilçe ve mahalle, ürün özeti, durum, tutar, tıklanınca açılacak detay.

**Kullanım**
- Siparişler kart değil, ince çizgiyle ayrılmış satırlardır. Liste uzunsa saat başlıklarıyla gruplanır ("Öğleden önce", "Öğleden sonra").
- Saat sütunu sabit genişliktedir (76px); göz saat sütunundan aşağı iner.
- Gecikme kırmızı saat ve kelimeyle gösterilir ("20 dk gecikme").
- Seçili satır kraft zeminle vurgulanır; masaüstünde sağdaki detay paneli bu satırı gösterir.
- Mobilde satırın tamamı dokunulabilir; durum değiştirme detayda yapılır.
