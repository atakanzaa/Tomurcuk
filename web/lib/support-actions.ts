"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { addShopNote, escalateTicket, replyToTicket, revealPhone, startImpersonation } from "@/lib/api";
import { formValues, type FormState } from "@/lib/checkout/form-state";
import { toMessages } from "@/lib/checkout/messages";
import { IMPERSONATION_COOKIE } from "@/lib/panel/session";

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
  (await cookies()).set(IMPERSONATION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(session.endsAt),
  });
  redirect("/panel");
}
