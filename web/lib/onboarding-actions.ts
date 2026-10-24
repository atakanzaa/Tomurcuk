"use server";

import { refresh } from "next/cache";
import { createPasswordLink, openShop, requestPasswordReset, setPassword } from "@/lib/api";
import type { PasswordLink } from "@/lib/api/types";
import { formValues, type FormState } from "@/lib/checkout/form-state";
import { toMessages } from "@/lib/checkout/messages";

const str = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

const requiredMessages: Record<string, string> = {
  name: "Dükkânın adını yazın.",
  shortName: "Kısa adı yazın, ör. Nergis.",
  slug: "Dükkânın adresini yazın, ör. nergis.",
  phone: "Dükkânın telefonunu yazın.",
  address: "Dükkânın adresini yazın.",
  ownerName: "Dükkân sahibinin adını yazın.",
  ownerEmail: "Dükkân sahibinin e-postasını yazın; panele bununla girer.",
};

/** Bağlantı yalnızca bu yanıtta gelir; ekranda kopyalanıp sahibine gönderilir. */
export interface OpenShopState extends FormState {
  link: PasswordLink | null;
}

export async function openShopAction(prev: OpenShopState, formData: FormData): Promise<OpenShopState> {
  const result = await openShop({
    applicationId: str(formData, "applicationId"),
    name: str(formData, "name"),
    shortName: str(formData, "shortName"),
    slug: str(formData, "slug"),
    phone: str(formData, "phone"),
    address: str(formData, "address"),
    ownerName: str(formData, "ownerName"),
    ownerEmail: str(formData, "ownerEmail"),
  });
  if (!result.ok) {
    const messages = toMessages(result.errors);
    for (const [field, error] of Object.entries(result.errors)) {
      if (error?.code === "required" && requiredMessages[field]) messages[field] = requiredMessages[field];
    }
    return { version: prev.version + 1, errors: messages, values: formValues(formData), link: null };
  }
  refresh();
  return { version: prev.version + 1, errors: {}, values: {}, link: result.value };
}

export async function newPasswordLinkAction(shopId: string): Promise<PasswordLink | null> {
  return createPasswordLink(shopId);
}

export interface SetPasswordState extends FormState {
  done: boolean;
}

export async function setPasswordAction(token: string, prev: SetPasswordState, formData: FormData): Promise<SetPasswordState> {
  const password = str(formData, "password");
  if (password !== str(formData, "confirm")) {
    return { ...prev, version: prev.version + 1, errors: { confirm: "İki şifre aynı değil. Yeniden yazın." } };
  }
  const result = await setPassword(token, password);
  if (!result.ok) return { ...prev, version: prev.version + 1, errors: toMessages(result.errors) };
  return { version: prev.version + 1, errors: {}, values: {}, done: true };
}

export interface ResetRequestState {
  version: number;
  error: string | null;
  sent: boolean;
}

/** Şifremi unuttum. Adres kayıtlı olsun olmasın aynı sonuç gösterilir. */
export async function requestResetAction(prev: ResetRequestState, formData: FormData): Promise<ResetRequestState> {
  const email = str(formData, "email").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { version: prev.version + 1, error: "Panele girdiğiniz e-posta adresini yazın, ör. ayla@nergiscicek.com.", sent: false };
  }
  await requestPasswordReset(email);
  return { version: prev.version + 1, error: null, sent: true };
}
