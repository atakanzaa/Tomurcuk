Form alanı: etiket, giriş ve altında yardım ya da hata metni.

**Yapı:** `label.tm-field` > `span.tm-field__label` + `input|textarea|select.tm-field__control` + isteğe bağlı `span.tm-field__meta` (yardım metni, sağda `span.tm-field__count` sayaç). Hata halinde kapsayıcıya `tm-field--error`, girişe `aria-invalid="true"`.

**Tüketici verir:** etiket, değer, yardım veya hata metni, karakter sınırı.

**Kullanım**
- Etiket her zaman görünür; yer tutucu etiketin yerine geçmez.
- Giriş yazısı mobilde 16px'in altına inmez (iOS yakınlaştırmasını önler).
- Hata metni neyin yanlış olduğunu ve nasıl düzeltileceğini söyler: "Numara eksik görünüyor. 10 hane olmalı." Özür dilemez, ünlem kullanmaz.
- Telefon için `inputmode="tel"`, tutar için `inputmode="decimal"`.
- Kart notu 250 karakterle sınırlıdır ve sayaç gösterilir.

**Yapma**
- Etiketi alanın içine yüzen etiket olarak koyma.
- Zorunlu alanları yıldızla işaretleme; isteğe bağlı olanların yanına "(isteğe bağlı)" yaz.
