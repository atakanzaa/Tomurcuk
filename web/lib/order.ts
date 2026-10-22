import { formatShortTimeRange } from "@/lib/format";
import { OptionKind, OrderSource, OrderStatus, PaymentMethod, PaymentStatus, type Order } from "@/lib/api/types";
import type { StatusTone } from "@/components/ui/StatusTag";

// Durum adları ve renkleri sabittir (design/tomurcuk/README.md "Renk").
export const orderStatusLabel: Record<OrderStatus, string> = {
  [OrderStatus.New]: "Yeni",
  [OrderStatus.Preparing]: "Hazırlanıyor",
  [OrderStatus.OnWay]: "Yolda",
  [OrderStatus.Delivered]: "Teslim edildi",
  [OrderStatus.Failed]: "Teslim edilemedi",
  [OrderStatus.Cancelled]: "İptal",
};

export const orderStatusTone: Record<OrderStatus, StatusTone> = {
  [OrderStatus.New]: "new",
  [OrderStatus.Preparing]: "preparing",
  [OrderStatus.OnWay]: "onway",
  [OrderStatus.Delivered]: "delivered",
  [OrderStatus.Failed]: "failed",
  [OrderStatus.Cancelled]: "failed",
};

/**
 * Ödemesi alınmamış yeni sipariş akış dışı hal olarak gösterilir: kartla ödemede
 * sağlayıcıdan onay gelmediyse "Ödeme bekleniyor", havale ve kapıda ödemede "Ödenmedi".
 */
export function orderStatusTag(order: Order): { tone: StatusTone; label: string } {
  if (order.status === OrderStatus.New && order.paymentStatus !== PaymentStatus.Paid) {
    return { tone: "muted", label: order.paymentMethod === PaymentMethod.Card ? "Ödeme bekleniyor" : "Ödenmedi" };
  }
  return { tone: orderStatusTone[order.status], label: orderStatusLabel[order.status] };
}

/** "Mevsim buketi (O), vazo" */
export function orderItemsSummary(order: Order): string {
  return order.items
    .map((item) => {
      const size = item.options.find((o) => o.kind === OptionKind.Size);
      const hasVase = item.options.some((o) => o.kind === OptionKind.Vase);
      return `${item.productName}${size ? ` (${size.name.charAt(0)})` : ""}${hasVase ? ", vazo" : ""}`;
    })
    .join(", ");
}

/**
 * Saat sütunu: planlanan saat varsa saat ve altında aralık, yoksa yalnızca aralık.
 * Geciken siparişte alt satır gecikmeyi kelimeyle söyler: "20 dk gecikti".
 */
export function orderTimeColumn(order: Order, delayMinutes = 0): { time: string; slot: string | null } {
  const range = formatShortTimeRange(order.slotStart, order.slotEnd);
  if (delayMinutes > 0) return { time: order.deliveryTime ?? range, slot: delayText(delayMinutes) };
  if (!order.deliveryTime) return { time: range, slot: null };
  return { time: order.deliveryTime, slot: order.exactTime ? "Kesin saat" : range };
}

const minutesOf = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

/** Planlanan saati geçmiş ve henüz yola çıkmamış siparişin gecikmesi (dakika); yoksa 0. */
export function orderDelayMinutes(order: Order, now: string): number {
  const waiting = order.status === OrderStatus.New || order.status === OrderStatus.Preparing;
  if (!waiting) return 0;
  const due = order.deliveryTime ?? order.slotEnd;
  return Math.max(0, minutesOf(now) - minutesOf(due));
}

/** Gecikme metni: "20 dk gecikti", "3 sa 15 dk gecikti". */
export function delayText(minutes: number): string {
  if (minutes < 60) return `${minutes} dk gecikti`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} sa ${rest} dk gecikti` : `${hours} sa gecikti`;
}

export const orderSourceLabel: Record<OrderSource, string> = {
  [OrderSource.Link]: "Sipariş linkinden",
  [OrderSource.Phone]: "Telefondan",
  [OrderSource.WhatsApp]: "WhatsApp'tan",
  [OrderSource.Instagram]: "Instagram'dan",
  [OrderSource.Store]: "Dükkândan",
  [OrderSource.CicekSepeti]: "ÇiçekSepeti'nden",
};

/** Kaynak seçimindeki kısa ad. */
export const orderSourceName: Record<OrderSource, string> = {
  [OrderSource.Link]: "Link",
  [OrderSource.Phone]: "Telefon",
  [OrderSource.WhatsApp]: "WhatsApp",
  [OrderSource.Instagram]: "Instagram",
  [OrderSource.Store]: "Dükkân",
  [OrderSource.CicekSepeti]: "ÇiçekSepeti",
};

export const paymentLabel = (order: Order): string => {
  if (order.paymentStatus === PaymentStatus.Paid) {
    return order.paymentMethod === PaymentMethod.Card ? "Kartla ödendi" : order.paymentMethod === PaymentMethod.Transfer ? "Havaleyle ödendi" : "Ödendi";
  }
  if (order.paymentMethod === PaymentMethod.Card) return "Ödeme bekleniyor";
  return order.paymentMethod === PaymentMethod.Transfer ? "Havale bekleniyor" : "Kapıda ödenecek";
};
