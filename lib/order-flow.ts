// Sipariş durum akışı: Yeni → Hazırlanıyor → Yolda → Teslim edildi (+ İptal, Teslim edilemedi).
// Arayüz buradan buton üretir; backend aynı geçişleri doğrular.
import { OrderStatus } from "@/lib/api/types";

export const orderTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.New]: [OrderStatus.Preparing, OrderStatus.Cancelled],
  [OrderStatus.Preparing]: [OrderStatus.OnWay, OrderStatus.Cancelled],
  [OrderStatus.OnWay]: [OrderStatus.Delivered, OrderStatus.Failed],
  // Teslim edilemeyen sipariş yeniden yola çıkabilir.
  [OrderStatus.Failed]: [OrderStatus.OnWay, OrderStatus.Cancelled],
  [OrderStatus.Delivered]: [],
  [OrderStatus.Cancelled]: [],
};

export const canTransition = (from: OrderStatus, to: OrderStatus) => orderTransitions[from].includes(to);

/** Buton etiketi; aynı işin adı akış boyunca değişmez. */
export const transitionAction: Record<OrderStatus, string> = {
  [OrderStatus.New]: "",
  [OrderStatus.Preparing]: "Hazırlamaya başla",
  [OrderStatus.OnWay]: "Yola çıktı",
  [OrderStatus.Delivered]: "Teslim edildi",
  [OrderStatus.Failed]: "Teslim edilemedi",
  [OrderStatus.Cancelled]: "Siparişi iptal et",
};

/** İşlemden sonraki bildirim. */
export const transitionDone: Record<OrderStatus, string> = {
  [OrderStatus.New]: "",
  [OrderStatus.Preparing]: "Hazırlanıyor olarak işaretlendi.",
  [OrderStatus.OnWay]: "Yola çıktı olarak işaretlendi. Alıcıya SMS gönderildi.",
  [OrderStatus.Delivered]: "Teslim edildi olarak işaretlendi. Gönderene SMS gönderildi.",
  [OrderStatus.Failed]: "Teslim edilemedi olarak işaretlendi. Alıcıya ve gönderene SMS gönderildi.",
  [OrderStatus.Cancelled]: "Sipariş iptal edildi.",
};

/** Ana akıştaki bir sonraki adım (birincil buton); iptal ve teslim edilemedi ikincil işlerdir. */
export function primaryTransition(status: OrderStatus): OrderStatus | null {
  return orderTransitions[status].find((s) => s !== OrderStatus.Cancelled && s !== OrderStatus.Failed) ?? null;
}
