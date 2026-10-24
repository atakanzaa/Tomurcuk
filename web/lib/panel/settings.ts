// Ayar formlarının sunucu ve istemcide ortak parçaları: hata metinleri ve TL dönüşümü.
import { CheckoutError, type FieldErrors } from "@/lib/api/types";
import { checkoutErrorMessage } from "@/lib/checkout/messages";

const requiredMessages: Record<string, string> = {
  name: "Dükkânın adını yazın.",
  shortName: "Kısa adı yazın; panelde ve takip sayfasında görünür.",
  phone: "Dükkânın telefonunu yazın.",
  address: "Dükkânın adresini yazın.",
  notifyPhone: "SMS'in gideceği cep telefonunu yazın.",
  slots: "En az bir saat aralığı ekleyin.",
  zones: "En az bir teslim bölgesi ekleyin.",
  date: "Bir tarih seçin.",
};

const optionMessages: Record<string, string> = {
  slots: "Her aralığın başlangıcı bitişinden önce olmalı; kapasite 0 ile 200 arasında.",
  zones: "Her bölgenin ilçesini ve ücretini yazın; ücret 0 ile 100.000 TL arasında.",
  featuredProductId: "Bu ürün artık satışta değil. Başka bir ürün seçin.",
  sameDayCutoff: "Saati 15:00 biçiminde yazın.",
};

export function settingsErrorMessages(errors: FieldErrors): Record<string, string> {
  return Object.fromEntries(
    Object.entries(errors).flatMap(([field, error]) => {
      if (!error) return [];
      if (error.code === CheckoutError.Required && requiredMessages[field]) return [[field, requiredMessages[field]]];
      if (error.code === CheckoutError.OptionInvalid && optionMessages[field]) return [[field, optionMessages[field]]];
      if (error.code === CheckoutError.ZoneInvalid) {
        return [[field, "Bölgeyi listeden seçin. Listede olmayan semt adı alıcı aramasında görünmez."]];
      }
      if (error.code === CheckoutError.DateOutOfRange) {
        return [[field, "Bugünden itibaren bir yıl içinde bir gün seçin."]];
      }
      return [[field, checkoutErrorMessage(field, error)]];
    }),
  );
}
