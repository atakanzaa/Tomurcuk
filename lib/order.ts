import { formatShortTimeRange } from "@/lib/format";
import { OptionKind, OrderStatus, PaymentStatus, type Order } from "@/lib/api/types";
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

const orderStatusTone: Record<OrderStatus, StatusTone> = {
  [OrderStatus.New]: "new",
  [OrderStatus.Preparing]: "preparing",
  [OrderStatus.OnWay]: "onway",
  [OrderStatus.Delivered]: "delivered",
  [OrderStatus.Failed]: "failed",
  [OrderStatus.Cancelled]: "failed",
};

/** Ödemesi alınmamış yeni sipariş, akış dışı hal olarak "Ödenmedi" gösterilir. */
export function orderStatusTag(order: Order): { tone: StatusTone; label: string } {
  if (order.status === OrderStatus.New && order.paymentStatus === PaymentStatus.Unpaid) {
    return { tone: "muted", label: "Ödenmedi" };
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
  if (delayMinutes > 0) return { time: order.deliveryTime ?? range, slot: `${delayMinutes} dk gecikti` };
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
