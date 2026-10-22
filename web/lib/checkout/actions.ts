"use server";

import { redirect } from "next/navigation";
import {
  createDraft,
  findShop,
  findTrackingToken,
  placeOrder,
  saveCard,
  saveDelivery,
} from "@/lib/api";
import { CheckoutError, ShopLookupKind, type FieldErrors } from "@/lib/api/types";
import { CheckoutStep, checkoutPath, trackingOrderPath } from "@/lib/routes";
import { formValues, type FormState } from "./form-state";
import { checkoutErrorMessage, toMessages } from "./messages";
import { clearDraftId, readDraftId, writeDraftId } from "./session";

// Sipariş akışının sunucu işlemleri. Her biri girdiyi backend'e iletir; doğrulama
// orada yapılır. Hata olursa form, gönderilen değerlerle ve mesajlarla geri döner.

const str = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

async function requireShop(slug: string) {
  const lookup = await findShop(slug);
  if (lookup.kind !== ShopLookupKind.Found) redirect(`/${slug}`);
  return lookup.shop;
}

function failed(prev: FormState, formData: FormData, errors: FieldErrors): FormState {
  return { version: prev.version + 1, errors: toMessages(errors), values: formValues(formData) };
}

const missingDraft = (prev: FormState, formData: FormData) =>
  failed(prev, formData, { form: { code: CheckoutError.DraftIncomplete } });

export async function startOrder(slug: string, prev: FormState, formData: FormData): Promise<FormState> {
  const shop = await requireShop(slug);
  const productId = str(formData, "productId");
  const optionIds = [str(formData, "size"), ...formData.getAll("addon").map(String)].filter(Boolean);
  const result = await createDraft(shop.id, { productId, optionIds });
  if (!result.ok) return failed(prev, formData, result.errors);
  await writeDraftId(slug, result.value.id);
  redirect(checkoutPath(slug, CheckoutStep.Delivery));
}

export async function submitDelivery(slug: string, prev: FormState, formData: FormData): Promise<FormState> {
  const shop = await requireShop(slug);
  const draftId = await readDraftId();
  if (!draftId) return missingDraft(prev, formData);
  const result = await saveDelivery(shop.id, draftId, {
    date: str(formData, "date"),
    slotId: str(formData, "slotId"),
    recipientName: str(formData, "recipientName"),
    recipientPhone: str(formData, "recipientPhone"),
    zoneId: str(formData, "zoneId"),
    neighborhood: str(formData, "neighborhood"),
    address: str(formData, "address"),
    courierNote: str(formData, "courierNote"),
  });
  if (!result.ok) return failed(prev, formData, result.errors);
  redirect(checkoutPath(slug, CheckoutStep.Card));
}

export async function submitCard(slug: string, prev: FormState, formData: FormData): Promise<FormState> {
  const shop = await requireShop(slug);
  const draftId = await readDraftId();
  if (!draftId) return missingDraft(prev, formData);
  const result = await saveCard(shop.id, draftId, {
    message: str(formData, "message"),
    signature: str(formData, "signature"),
    anonymous: formData.get("anonymous") === "on",
    senderPhone: str(formData, "senderPhone"),
  });
  if (!result.ok) return failed(prev, formData, result.errors);
  redirect(checkoutPath(slug, CheckoutStep.Payment));
}

export async function submitPayment(slug: string, prev: FormState, formData: FormData): Promise<FormState> {
  const shop = await requireShop(slug);
  const draftId = await readDraftId();
  if (!draftId) return missingDraft(prev, formData);
  const result = await placeOrder(shop.id, draftId, {
    paymentMethod: str(formData, "paymentMethod"),
    consent: formData.get("consent") === "on",
    idempotencyKey: str(formData, "idempotencyKey"),
  });
  if (!result.ok) {
    // Taslağa bağlı hatalar formun üstünde tek mesaj olarak gösterilir.
    const { draft, ...fields } = result.errors;
    return failed(prev, formData, draft ? { ...fields, form: draft } : fields);
  }
  // Kartla ödemede taslak, ödeme yarıda kalırsa yeniden denenebilsin diye ödeme dönüşüne kadar durur.
  if (result.value.paymentUrl) redirect(result.value.paymentUrl);
  await clearDraftId(slug);
  redirect(trackingOrderPath(slug, result.value.trackingToken));
}

export async function lookupOrder(slug: string, prev: FormState, formData: FormData): Promise<FormState> {
  const shop = await requireShop(slug);
  const number = str(formData, "number");
  const phone = str(formData, "phone");
  const errors: Record<string, string> = {};
  if (!number.trim()) errors.number = checkoutErrorMessage("number", { code: CheckoutError.Required });
  if (!phone.trim()) errors.phone = checkoutErrorMessage("phone", { code: CheckoutError.Required });
  if (Object.keys(errors).length) return { version: prev.version + 1, errors, values: formValues(formData) };
  const token = await findTrackingToken(shop.id, { number, phone });
  if (!token) {
    return {
      version: prev.version + 1,
      errors: { form: "Bu numara ve telefonla bir sipariş bulamadık. Bilgileri kontrol edin ya da dükkânı arayın." },
      values: formValues(formData),
    };
  }
  redirect(trackingOrderPath(slug, token));
}
