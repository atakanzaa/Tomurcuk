// Hata kodlarının Türkçe karşılıkları. Kural: ne olduğunu ve ne yapılacağını söyle,
// özür dileme, ünlem kullanma (design/tomurcuk/README.md "Hata ve boş ekran").
import { CheckoutError, type FieldErrors } from "@/lib/api/types";
import { formatPrice, withTimeSuffix } from "@/lib/format";

/** Alana özgü "boş bırakıldı" mesajları. */
const requiredMessages: Record<string, string> = {
  recipientName: "Alıcının adını yazın.",
  recipientPhone: "Alıcının telefonunu yazın. Kurye teslimattan önce bu numarayı arar.",
  neighborhood: "Mahalleyi yazın.",
  address: "Açık adresi yazın: sokak, bina ve daire numarası.",
  slotId: "Bir saat aralığı seçin.",
  senderPhone: "Telefonunuzu yazın. Sipariş yola çıkınca ve teslim edilince SMS göndeririz.",
  number: "Sipariş numarasını yazın, ör. T-4821.",
  phone: "Siparişi verirken yazdığınız telefonu girin.",
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
      return "Seçtiğiniz ekleme artık yok. Sayfayı yenileyip yeniden seçin.";
    case CheckoutError.ProductUnavailable:
      return "Bu ürün şu an satışta değil. Vitrinden başka bir ürün seçebilirsiniz.";
    case CheckoutError.DayClosed:
      return "Dükkân bu gün kapalı. Başka bir gün seçin.";
    case CheckoutError.SameDayClosed:
      return `Bugünün siparişleri ${withTimeSuffix(String(meta.cutoff), "locative")} kapandı. Yarın için bir saat seçin.`;
    case CheckoutError.DateOutOfRange:
      return "Bu tarih için sipariş alamıyoruz. Önümüzdeki iki hafta içinden bir gün seçin.";
    case CheckoutError.SlotFull:
      return meta.alternative
        ? `Bu saat aralığı doldu. ${meta.alternative} arası hâlâ müsait.`
        : "Bu günün saat aralıkları doldu. Başka bir gün seçin.";
    case CheckoutError.ZoneInvalid:
      return "Bu bölgeye teslimat yapmıyoruz. Listeden bir mahalle seçin.";
    case CheckoutError.ConsentRequired:
      return "Devam etmek için ön bilgilendirme formunu ve mesafeli satış sözleşmesini onaylayın.";
    case CheckoutError.PaymentMethodInvalid:
      return "Bir ödeme yöntemi seçin.";
    case CheckoutError.PriceChanged:
      return `Ürünün fiyatı değişti. Yeni toplam ${formatPrice(Number(meta.total))}; kontrol edip yeniden onaylayın.`;
    case CheckoutError.ReservationExpired:
      return "Ayırdığımız saat aralığı başka bir siparişe geçti. Teslimat adımından yeni bir aralık seçin.";
    case CheckoutError.DraftIncomplete:
      return "Sipariş bilgileri eksik. Önceki adımları tamamlayın.";
  }
}

export function toMessages(errors: FieldErrors): Record<string, string> {
  return Object.fromEntries(
    Object.entries(errors).flatMap(([field, error]) => (error ? [[field, checkoutErrorMessage(field, error)]] : [])),
  );
}
