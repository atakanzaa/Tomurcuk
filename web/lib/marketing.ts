// Tanıtım sitesinin değişken içeriği. Fiyatlar pilot görüşmelerinden sonra kesinleşecek
// (docs/mvp.md "Fiyatlandırma"); null olan fiyat sitede "Belirleniyor" olarak görünür.
export const PLANS: { name: string; monthlyPrice: number | null; summary: string }[] = [
  {
    name: "Başlangıç",
    monthlyPrice: null,
    summary: "Sipariş sayfası, sipariş paneli, müşteri defteri ve ayda 100 SMS. Tek dükkân, iki kullanıcı.",
  },
  {
    name: "Pro",
    monthlyPrice: null,
    summary: "Başlangıç'taki her şey, ayda 500 SMS, sınırsız kullanıcı ve öncelikli destek.",
  },
];
