"use server";

import { redirect } from "next/navigation";
import { formValues, type FormState } from "@/lib/checkout/form-state";
import { LOGIN_PATH } from "@/lib/routes";
import { loginToApi, logoutFromApi } from "./auth";
import { clearPanelSession, writePanelSession } from "./cookie";

const str = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

export async function login(prev: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, "email").trim();
  const password = str(formData, "password");
  // Şifre forma geri yazılmaz.
  const { password: _password, ...values } = formValues(formData);
  const errors: Record<string, string> = {};
  if (!email) errors.email = "E-posta adresinizi yazın.";
  if (!password) errors.password = "Şifrenizi yazın.";
  if (Object.keys(errors).length) return { version: prev.version + 1, errors, values };

  const result = await loginToApi(email, password);
  if (!result) {
    return {
      version: prev.version + 1,
      errors: { form: "E-posta ya da şifre yanlış. Bilgilerinizi kontrol edip yeniden deneyin." },
      values,
    };
  }
  await writePanelSession(result.session);
  redirect("/panel");
}

export async function logout() {
  await logoutFromApi();
  await clearPanelSession();
  redirect(LOGIN_PATH);
}
