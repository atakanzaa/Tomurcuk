"use server";

import { redirect } from "next/navigation";
import { formValues, type FormState } from "@/lib/checkout/form-state";
import { LOGIN_PATH, SUPPORT_LOGIN_PATH } from "@/lib/routes";
import { loginToApi, logoutFromApi } from "./api";
import { clearImpersonation, clearSession, writeSession } from "./cookie";

const str = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

/** Satıcı paneli girişi: e-posta ve şifre. */
export async function login(prev: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, "email").trim();
  const password = str(formData, "password");
  // Şifre forma geri yazılmaz.
  const { password: _password, ...values } = formValues(formData);
  const errors: Record<string, string> = {};
  if (!email) errors.email = "E-posta adresinizi yazın.";
  if (!password) errors.password = "Şifrenizi yazın.";
  if (Object.keys(errors).length) return { version: prev.version + 1, errors, values };

  const result = await loginToApi("panel", { email, password });
  if (!result) {
    return {
      version: prev.version + 1,
      errors: { form: "E-posta ya da şifre yanlış. Bilgilerinizi kontrol edip yeniden deneyin." },
      values,
    };
  }
  await writeSession("panel", result.session);
  redirect("/panel");
}

export async function logout() {
  await logoutFromApi("panel");
  await clearSession("panel");
  redirect(LOGIN_PATH);
}

/** Destek paneli girişi: e-posta, şifre ve doğrulama uygulamasındaki 6 haneli kod. */
export async function supportLogin(prev: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, "email").trim();
  const password = str(formData, "password");
  const code = str(formData, "code").replace(/\s/g, "");
  const { password: _password, code: _code, ...values } = formValues(formData);
  const errors: Record<string, string> = {};
  if (!email) errors.email = "E-posta adresinizi yazın.";
  if (!password) errors.password = "Şifrenizi yazın.";
  if (!/^\d{6}$/.test(code)) errors.code = "Doğrulama uygulamanızdaki 6 haneli kodu yazın.";
  if (Object.keys(errors).length) return { version: prev.version + 1, errors, values };

  const result = await loginToApi("support", { email, password, code });
  if (!result) {
    return {
      version: prev.version + 1,
      errors: { form: "Bilgiler ya da doğrulama kodu yanlış. Kod 30 saniyede bir değişir; yenisini yazıp tekrar deneyin." },
      values,
    };
  }
  await writeSession("support", result.session);
  redirect("/destek");
}

export async function supportLogout() {
  await logoutFromApi("support");
  await clearSession("support");
  await clearImpersonation();
  redirect(SUPPORT_LOGIN_PATH);
}
