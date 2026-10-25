"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { addShopNote, changeShopStatus, escalateTicket, replyToTicket, revealPhone, startImpersonation } from "@/lib/api";
import { ShopStatus } from "@/lib/api/types";
import { formValues, type FormState } from "@/lib/checkout/form-state";
import { toMessages } from "@/lib/checkout/messages";
import { writeImpersonation } from "@/lib/auth/cookie";

// Destek panelinin işlemleri. Her biri backend'de yetki ve denetim kaydından geçer.

const str = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

/** Yanıt, dahili not ya da "yanıtla, dükkânı bekle": hangi butona basıldığına göre. */
export async function sendReply(ticketId: string, prev: FormState, formData: FormData): Promise<FormState> {
  const mode = str(formData, "mode");
  const result = await replyToTicket(ticketId, {
    text: str(formData, "text"),
    internal: mode === "internal",
    waitForShop: mode === "wait",
  });
  if (!result.ok) return { version: prev.version + 1, errors: toMessages(result.errors), values: formValues(formData) };
  refresh();
  return {
    version: prev.version + 1,
    errors: {},
    values: { done: mode === "internal" ? "Dahili not eklendi." : mode === "wait" ? "Yanıt gönderildi; talep dükkânı bekliyor." : "Yanıt gönderildi." },
  };
}

export async function escalate(ticketId: string) {
  await escalateTicket(ticketId);
  refresh();
}

export interface RevealState {
  version: number;
  phone: string | null;
  error: string | null;
}

/** Maskeli telefonu gerekçeyle açar; gerekçe ve kişi denetim kaydına yazılır. */
export async function reveal(orderId: string, field: "recipient" | "sender", prev: RevealState, formData: FormData): Promise<RevealState> {
  const reason = str(formData, "reason") === "other" ? str(formData, "detail") : str(formData, "reason");
  if (!reason.trim()) return { version: prev.version + 1, phone: null, error: "Gerekçe yazın; denetim kaydına bu metin geçer." };
  const phone = await revealPhone(orderId, field, reason);
  return { version: prev.version + 1, phone, error: phone ? null : "Telefon açılamadı. Sayfayı yenileyin." };
}

export async function saveNote(shopId: string, prev: FormState, formData: FormData): Promise<FormState> {
  const result = await addShopNote(shopId, str(formData, "text"));
  if (!result.ok) return { version: prev.version + 1, errors: toMessages(result.errors), values: formValues(formData) };
  refresh();
  return { version: prev.version + 1, errors: {}, values: { done: "Not eklendi." } };
}

/** 30 dakikalık dükkân adına giriş; panel her sayfada "Destek oturumu" bandını gösterir. */
export async function impersonate(shopId: string, prev: FormState, formData: FormData): Promise<FormState> {
  const reason = str(formData, "reason") === "other" ? str(formData, "detail") : str(formData, "reason");
  if (!reason.trim()) {
    return { version: prev.version + 1, errors: { reason: "Gerekçe seçin ya da yazın; denetim kaydına bu metin geçer." }, values: formValues(formData) };
  }
  const session = await startImpersonation(shopId, reason);
  if (!session) return { version: prev.version + 1, errors: { reason: "Oturum açılamadı. Sayfayı yenileyin." }, values: formValues(formData) };
  await writeImpersonation(session.id, session.endsAt);
  redirect("/panel");
}

/** Geçici kapatma süresinin seçenekleri; saat dilimine bağlı olmasın diye süre olarak. */
const PAUSE_HOURS: Record<string, number> = { "1s": 1, "3s": 3, "1g": 24, "3g": 72, "7g": 168 };

/**
 * Dükkânın durumu: geçici kapatma, askıya alma, kalıcı kapatma, yeniden açma. Vitrin ve alıcı
 * ana sayfasının önbelleği hemen yenilenir.
 */
export async function changeStatusAction(
  shop: { id: string; slugs: string[] },
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const status = str(formData, "status") as ShopStatus;
  const hours = PAUSE_HOURS[str(formData, "duration")];
  const result = await changeShopStatus(shop.id, {
    status,
    reason: str(formData, "reason"),
    pausedUntil: status === ShopStatus.Paused && hours ? new Date(Date.now() + hours * 3_600_000).toISOString() : null,
    confirmOpenOrders: formData.get("confirmOpenOrders") === "on",
  });
  if (!result) return { version: prev.version + 1, errors: { form: "Dükkân bulunamadı. Sayfayı yenileyin." }, values: formValues(formData) };
  if (!result.ok) return { version: prev.version + 1, errors: toMessages(result.errors), values: formValues(formData) };
  updateTag(`shop:${shop.id}`);
  updateTag(`products:${shop.id}`);
  shop.slugs.forEach((slug) => updateTag(`shop-slug:${slug}`));
  updateTag("discover");
  refresh();
  return { version: prev.version + 1, errors: {}, values: { done: "1" } };
}
