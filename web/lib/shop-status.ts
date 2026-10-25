// Dükkânın durumu (destek ekibi değiştirir): metinler vitrin, panel ve destek ekranında aynı.
import { formatDayMonth } from "@/lib/dates";
import { zonedNow } from "@/lib/format";
import { ShopStatus, type Shop } from "@/lib/api/types";

export const shopStatusLabel: Record<ShopStatus, string> = {
  [ShopStatus.Open]: "Açık",
  [ShopStatus.Paused]: "Siparişe kapalı",
  [ShopStatus.Suspended]: "Askıda",
  [ShopStatus.Closed]: "Kapalı",
};

/** "26 Ekim 14:00"; dükkânın saat diliminde. */
export function formatReopening(pausedUntil: string, timeZone: string): string {
  const at = zonedNow(new Date(pausedUntil), timeZone);
  return `${formatDayMonth(at.date)} ${at.time}`;
}

/** Vitrinde siparişe kapalı dükkânın bandı: ne zaman açılacağı biliniyorsa söylenir. */
export function closedNotice(shop: Shop): string {
  if (shop.status === ShopStatus.Paused && shop.pausedUntil) {
    return `${formatReopening(shop.pausedUntil, shop.timeZone)} itibarıyla yeniden sipariş alıyoruz.`;
  }
  return `Bilgi için ${shop.phone} numarasından bize ulaşın.`;
}
