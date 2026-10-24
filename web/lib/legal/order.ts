// Sözleşmelerdeki sipariş bilgisi: ödeme adımında taslaktan, sonra takip linkinden siparişten.
import type { IsoDate, OrderContract, OrderDraft, PaymentMethod } from "@/lib/api/types";
import { formatDayMonth } from "@/lib/dates";
import { formatTimeRange, withTimeSuffix, zonedNow } from "@/lib/format";

export interface ContractLine {
  name: string;
  /** Boy ve eklemeler: "Orta, 25 dal; Cam vazo" */
  detail: string;
  quantity: number;
  total: number;
}

export interface ContractOrder {
  /** Sipariş verilmeden (taslakta) yok. */
  number: string | null;
  /** Siparişin verildiği an, ISO; taslakta yok. */
  placedAt: string | null;
  lines: ContractLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  /** Teslimat adımı tamamlanmadıysa yok. */
  delivery: { date: IsoDate; slot: string; recipientName: string; address: string } | null;
  paymentMethod: PaymentMethod | null;
}

export function fromDraft(draft: OrderDraft): ContractOrder {
  const { item, delivery } = draft;
  return {
    number: null,
    placedAt: null,
    lines: [
      {
        name: item.productName,
        detail: item.options.map((o) => (o.detail ? `${o.name}, ${o.detail}` : o.name)).join("; "),
        quantity: 1,
        total: item.lineTotal,
      },
    ],
    subtotal: draft.subtotal,
    deliveryFee: draft.deliveryFee,
    total: draft.total,
    delivery: delivery
      ? {
          date: delivery.date,
          slot: formatTimeRange(delivery.slotStart, delivery.slotEnd),
          recipientName: delivery.recipientName,
          address: `${delivery.address}, ${delivery.neighborhood}, ${delivery.district}`,
        }
      : null,
    paymentMethod: null,
  };
}

export function fromContract(contract: OrderContract): ContractOrder {
  return {
    number: contract.number,
    placedAt: contract.createdAt,
    lines: contract.items.map((item) => ({
      name: item.productName,
      detail: item.options.map((o) => o.name).join("; "),
      quantity: item.quantity,
      total: (item.unitPrice + item.options.reduce((sum, o) => sum + o.extraPrice, 0)) * item.quantity,
    })),
    subtotal: contract.subtotal,
    deliveryFee: contract.deliveryFee,
    total: contract.total,
    delivery: {
      date: contract.deliveryDate,
      slot: formatTimeRange(contract.slotStart, contract.slotEnd),
      recipientName: contract.recipientName,
      address: `${contract.address}, ${contract.zoneName}`,
    },
    paymentMethod: contract.paymentMethod,
  };
}

/** Siparişin verildiği an: "24 Ekim 2026, 10:07'de" */
export function placedAtText(iso: string, timeZone: string): string {
  const { date, time } = zonedNow(new Date(iso), timeZone);
  return `${formatDayMonth(date)} ${date.slice(0, 4)}, ${withTimeSuffix(time, "locative")}`;
}
