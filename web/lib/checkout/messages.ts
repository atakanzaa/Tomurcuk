// Hata kodlarının Türkçe karşılıkları. Kural: ne olduğunu ve ne yapılacağını söyle,
// özür dileme, ünlem kullanma (design/tomurcuk/README.md "Hata ve boş ekran").
import { CheckoutError, type FieldErrors } from "@/lib/api/types";
import { formatPrice, withTimeSuffix } from "@/lib/format";

/** Alana özgü "boş bırakıldı" mesajları. */
const requiredMessages: Record<string, string> = {
  recipientName: "Alıcının adını yazın.",
  title: "Hangi gün olduğunu yazın, ör. Annesinin doğum günü.",
  recipientPhone: "Alıcının telefonunu yazın. Kurye teslimattan önce bu numarayı arar.",
  neighborhood: "Mahalleyi yazın.",
  address: "Açık adresi yazın: sokak, bina ve daire numarası.",
  slotId: "Bir saat aralığı seçin.",
  senderPhone: "Telefonunuzu yazın. Sipariş yola çıkınca ve teslim edilince SMS göndeririz.",
  number: "Sipariş numarasını yazın, ör. T-4821.",
  customerPhone: "Sipariş verenin telefonunu yazın.",
  source: "Siparişin nereden geldiğini seçin.",
  exactTime: "Kesin saati 14:30 biçiminde yazın.",
  shopName: "Dükkânınızın adını yazın.",
  district: "Dükkânın ilçesini yazın.",
  text: "Mesajı yazın.",
  subject: "Konuyu birkaç kelimeyle yazın.",
  category: "Bir konu seçin.",
  phone: "Telefon numaranızı yazın.",
};

export function checkoutErrorMessage(
  field: string,
  { code, meta = {} }: { code: CheckoutError; meta?: Record<string, string | number> },
): string {
  switch (code) {
    case CheckoutError.Required:
      return requiredMessages[field] ?? "Bu alanı doldurun.";
    case CheckoutError.TooLong:
      return field === "message"
        ? `Kart notu ${meta.max} karakteri geçemez.`
        : `En fazla ${meta.max} karakter yazabilirsiniz.`;
    case CheckoutError.PhoneInvalid:
      return "Numara eksik ya da hatalı görünüyor. 10 hane olmalı, ör. 0532 412 88 19.";
    case CheckoutError.SizeRequired:
      return "Bir boy seçin.";
    case CheckoutError.OptionInvalid:
      if (field === "orderNumber") return "Bu numarayla bir siparişiniz yok. Numarayı kontrol edin ya da boş bırakın.";
      return field === "items"
        ? "En az bir ürün seçin; adet 1 ile 20 arasında olmalı."
        : "Seçtiğiniz ekleme artık yok. Sayfayı yenileyip yeniden seçin.";
    case CheckoutError.ProductUnavailable:
      return "Bu ürün şu an satışta değil. Vitrinden başka bir ürün seçebilirsiniz.";
    case CheckoutError.DayClosed:
      return "Dükkân bu gün kapalı. Başka bir gün seçin.";
    case CheckoutError.SameDayClosed:
      return `Bugünün siparişleri ${withTimeSuffix(String(meta.cutoff), "locative")} kapandı. Yarın için bir saat seçin.`;
    case CheckoutError.DateOutOfRange:
      return "Bu tarih için sipariş alamıyoruz. Önümüzdeki iki hafta içinden bir gün seçin.";
    case CheckoutError.SlotFull:
      if (meta.alternative) return `Bu saat aralığı doldu. ${meta.alternative} arası hâlâ müsait.`;
      return meta.single
        ? "Bu saat aralığı doldu. Başka bir aralık ya da kesin saat seçin."
        : "Bu günün saat aralıkları doldu. Başka bir gün seçin.";
    case CheckoutError.ZoneInvalid:
      return field === "address"
        ? "Adreste teslim bölgelerinizden bir mahalle geçmiyor. Mahalle adını adrese ekleyin."
        : "Bu bölgeye teslimat yapmıyoruz. Listeden bir mahalle seçin.";
    case CheckoutError.ConsentRequired:
      return "Devam etmek için ön bilgilendirme formunu ve mesafeli satış sözleşmesini onaylayın.";
    case CheckoutError.PaymentMethodInvalid:
      return field === "payment" ? "Ödeme durumunu seçin." : "Bir ödeme yöntemi seçin.";
    case CheckoutError.PriceChanged:
      return `Ürünün fiyatı değişti. Yeni toplam ${formatPrice(Number(meta.total))}; kontrol edip yeniden onaylayın.`;
    case CheckoutError.ReservationExpired:
      return "Ayırdığımız saat aralığı başka bir siparişe geçti. Teslimat adımından yeni bir aralık seçin.";
    case CheckoutError.PaymentUnavailable:
      return "Ödeme sayfası şu an açılamıyor. Birkaç dakika sonra yeniden deneyin ya da havaleyle ödeyin.";
    case CheckoutError.DraftIncomplete:
      return "Sipariş bilgileri eksik. Önceki adımları tamamlayın.";
    case CheckoutError.PriceInvalid:
      return "Fiyatı 1 TL ile 100.000 TL arasında, yalnızca rakamla yazın.";
    case CheckoutError.PhotoInvalid:
      return "Fotoğraf okunamadı. JPEG ya da PNG, en az 300 piksel genişliğinde bir fotoğraf seçin.";
    case CheckoutError.DeliveryPhotoStatus:
      return "Teslim fotoğrafı sipariş yola çıkınca eklenir.";
    case CheckoutError.TooMany:
      return `En fazla ${meta.max} tane ekleyebilirsiniz.`;
    case CheckoutError.SlotOverlap:
      return "Saat aralıkları üst üste binmesin. Bir aralık bitmeden diğeri başlamamalı.";
    case CheckoutError.ZoneDuplicate:
      return "Aynı bölgeyi iki kez yazmışsınız. Birini kaldırın.";
    case CheckoutError.TaxNumberInvalid:
      return "Vergi numarası 10, T.C. kimlik numarası 11 hane olmalı; yalnızca rakam yazın.";
    case CheckoutError.EmailInvalid:
      return "E-posta adresi eksik ya da hatalı görünüyor, ör. merhaba@dukkan.com.";
    case CheckoutError.SlugInvalid:
      return "Adres 3–40 karakter olmalı; yalnızca küçük harf, rakam ve tire. Panel, destek gibi ayrılmış kelimeler kullanılamaz.";
    case CheckoutError.SlugTaken:
      return "Bu adres başka bir dükkânın. Sonuna semt adı ekleyin, ör. nergis-moda.";
    case CheckoutError.EmailTaken:
      return "Bu e-postayla açılmış bir hesap var. Başka bir e-posta yazın.";
    case CheckoutError.PasswordShort:
      return `Şifre en az ${meta.min} karakter olmalı.`;
    case CheckoutError.LinkInvalid:
      return "Bu bağlantının süresi geçmiş ya da kullanılmış. Tomurcuk ekibinden yeni bağlantı isteyin.";
  }
}

export function toMessages(errors: FieldErrors): Record<string, string> {
  return Object.fromEntries(
    Object.entries(errors).flatMap(([field, error]) => (error ? [[field, checkoutErrorMessage(field, error)]] : [])),
  );
}
