"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import {
  createManualOrder,
  createTicket,
  deleteSpecialDay,
  endImpersonation,
  markOrderPaid,
  saveSpecialDay,
  updateOrderStatus,
  uploadDeliveryPhoto,
} from "@/lib/api";
import { OrderStatus } from "@/lib/api/types";
import { formValues, type FormState } from "@/lib/checkout/form-state";
import { checkoutErrorMessage, toMessages } from "@/lib/checkout/messages";
import { transitionDone } from "@/lib/order-flow";
import type { ActionNotice } from "./notice";
import { clearImpersonation, readImpersonation } from "@/lib/auth/cookie";
import { SUPPORT_HOME_PATH } from "@/lib/routes";
import { loadPanel } from "./session";

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

/** Teslim fotoğrafı; tarayıcı küçültüp JPEG yapar (lib/panel/photo.ts). */
export async function addDeliveryPhoto(formData: FormData): Promise<{ message: string; error: boolean }> {
  const { shop } = await loadPanel();
  const file = formData.get("file");
  if (!(file instanceof Blob) || file.size === 0) return { message: "Fotoğraf seçilmedi.", error: true };
  const result = await uploadDeliveryPhoto(shop.id, str(formData, "orderId"), file);
  if (!result) return { message: "Sipariş bulunamadı. Sayfayı yenileyin.", error: true };
  if (!result.ok) {
    const error = result.errors.photo;
    return { message: error ? checkoutErrorMessage("photo", error) : "Fotoğraf yüklenemedi. Yeniden deneyin.", error: true };
  }
  refresh();
  return { message: "Teslim fotoğrafı eklendi. Gönderen takip sayfasında görür.", error: false };
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
  const id = await readImpersonation();
  if (id) await endImpersonation(id);
  await clearImpersonation();
  redirect(SUPPORT_HOME_PATH);
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

export interface SpecialDayFormState extends FormState {
  notice: ActionNotice;
  /** Kayıt başarılı olunca artar; düzenleme formu kapanır. */
  saved: number;
}

/** Müşteri kartında özel gün ekleme ve düzenleme; `dayId` boşsa yeni kayıt. */
export async function saveSpecialDayForm(prev: SpecialDayFormState, formData: FormData): Promise<SpecialDayFormState> {
  const { shop } = await loadPanel();
  const dayId = str(formData, "dayId");
  const result = await saveSpecialDay(shop.id, str(formData, "customerId"), dayId || null, {
    title: str(formData, "title"),
    day: Number(str(formData, "day")),
    month: Number(str(formData, "month")),
    recipientName: str(formData, "recipientName"),
  });
  const notice = (message: string, error: boolean) => ({ version: prev.notice.version + 1, message, error });
  if (!result) {
    return { ...prev, version: prev.version + 1, notice: notice("Kayıt bulunamadı. Sayfayı yenileyin.", true) };
  }
  if (!result.ok) {
    const errors = toMessages(result.errors);
    return { ...prev, version: prev.version + 1, errors, values: formValues(formData), notice: errors.form ? notice(errors.form, true) : prev.notice };
  }
  refresh();
  return {
    version: prev.version + 1,
    errors: {},
    values: {},
    notice: notice(dayId ? "Özel gün güncellendi." : "Özel gün eklendi. Tarihi yaklaşınca hatırlatmalarda görünür.", false),
    saved: prev.saved + 1,
  };
}

export async function removeSpecialDay(prev: ActionNotice, formData: FormData): Promise<ActionNotice> {
  const { shop } = await loadPanel();
  const removed = await deleteSpecialDay(shop.id, str(formData, "customerId"), str(formData, "dayId"));
  if (removed) refresh();
  return {
    version: prev.version + 1,
    message: removed ? "Özel gün silindi." : "Özel gün bulunamadı. Sayfayı yenileyin.",
    error: !removed,
  };
}
