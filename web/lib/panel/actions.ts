"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createManualOrder, createTicket, endImpersonation, markOrderPaid, updateOrderStatus } from "@/lib/api";
import { OrderStatus } from "@/lib/api/types";
import { formValues, type FormState } from "@/lib/checkout/form-state";
import { toMessages } from "@/lib/checkout/messages";
import { transitionDone } from "@/lib/order-flow";
import type { ActionNotice } from "./notice";
import { IMPERSONATION_COOKIE, loadPanel } from "./session";

const str = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

export async function changeOrderStatus(prev: ActionNotice, formData: FormData): Promise<ActionNotice> {
  const { shop } = await loadPanel();
  const status = Object.values(OrderStatus).find((s) => s === str(formData, "status"));
  const result = status ? await updateOrderStatus(shop.id, str(formData, "orderId"), status) : null;
  if (!status || !result?.ok) {
    return { version: prev.version + 1, message: "Bu işlem siparişin şu anki durumunda yapılamıyor. Sayfayı yenileyin.", error: true };
  }
  refresh();
  return { version: prev.version + 1, message: transitionDone[status], error: false };
}

export async function markPaid(prev: ActionNotice, formData: FormData): Promise<ActionNotice> {
  const { shop } = await loadPanel();
  const result = await markOrderPaid(shop.id, str(formData, "orderId"));
  if (!result.ok) return { version: prev.version + 1, message: "Sipariş bulunamadı. Sayfayı yenileyin.", error: true };
  refresh();
  return { version: prev.version + 1, message: "Ödendi olarak işaretlendi.", error: false };
}

export async function saveManualOrder(prev: FormState, formData: FormData): Promise<FormState> {
  const { shop } = await loadPanel();
  const products = formData.getAll("product").map(String);
  const quantities = formData.getAll("quantity").map((q) => Number(q));
  const result = await createManualOrder(shop.id, {
    source: str(formData, "source"),
    customerPhone: str(formData, "customerPhone"),
    customerName: str(formData, "customerName"),
    items: products.map((value, i) => {
      const [productId, optionId] = value.split(":");
      return { productId, optionId: optionId || null, quantity: quantities[i] ?? 1 };
    }),
    date: str(formData, "date"),
    slotId: str(formData, "slotId"),
    exactTime: str(formData, "exactTime"),
    recipientName: str(formData, "recipientName"),
    recipientPhone: str(formData, "recipientPhone"),
    address: str(formData, "address"),
    cardNote: str(formData, "cardNote"),
    payment: str(formData, "payment"),
  });
  if (!result.ok) {
    return { version: prev.version + 1, errors: toMessages(result.errors), values: formValues(formData) };
  }
  redirect(`/panel/siparisler/${result.value.orderId}?yeni=1`);
}

export async function finishImpersonation() {
  const jar = await cookies();
  const id = jar.get(IMPERSONATION_COOKIE)?.value;
  if (id) await endImpersonation(id);
  jar.delete(IMPERSONATION_COOKIE);
  redirect("/destek/dukkanlar");
}

export async function openTicket(prev: FormState, formData: FormData): Promise<FormState> {
  const { shop } = await loadPanel();
  const result = await createTicket(shop.id, {
    subject: str(formData, "subject"),
    category: str(formData, "category"),
    orderNumber: str(formData, "orderNumber"),
    text: str(formData, "text"),
  });
  if (!result.ok) return { version: prev.version + 1, errors: toMessages(result.errors), values: formValues(formData) };
  refresh();
  return { version: prev.version + 1, errors: {}, values: { sent: "1" } };
}
