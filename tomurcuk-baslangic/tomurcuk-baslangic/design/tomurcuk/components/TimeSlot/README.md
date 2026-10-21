Teslim saati aralığı seçimi; kapasiteyi kelimeyle gösterir.

**Yapı:** `div.tm-slots[role=radiogroup]` içinde her aralık `div.tm-slot[role=radio]`; seçili olan `aria-checked="true"`, dolu olan `aria-disabled="true"`. Aralık metni üstte, durum `small` içinde altta.

**Tüketici verir:** aralıklar, her birinin kalan kapasitesi, seçili aralık. Ok tuşlarıyla gezinme ve boşlukla seçim tüketicinin işidir.

**Kullanım**
- Kalan yer 3 ve altına düşünce sayıyla yazılır ("3 yer kaldı"); üstünde "Müsait".
- Dolu aralık gizlenmez, kesik kenarla ve "Dolu" yazısıyla görünür kalır; alıcı başka saat seçmesi gerektiğini anlar.
- Aynı gün için son saat geçtiyse o günün tüm aralıkları "Bugün için kapandı" ile tek satırda gösterilir.
- Saatler 24 saat biçiminde ve aralıklar en dash ile yazılır: 13:00–16:00.
