"use server";

import { redirect } from "next/navigation";
import { findOrder, submitPilotApplication } from "@/lib/api";
import { formValues, type FormState } from "@/lib/checkout/form-state";
import { CheckoutError } from "@/lib/api/types";
import { checkoutErrorMessage, toMessages } from "@/lib/checkout/messages";
import { trackingOrderPath } from "@/lib/routes";

const str = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

export async function applyForPilot(prev: FormState, formData: FormData): Promise<FormState> {
  const result = await submitPilotApplication({
    shopName: str(formData, "shopName"),
    phone: str(formData, "phone"),
    district: str(formData, "district"),
    instagram: str(formData, "instagram"),
  });
  if (!result.ok) return { version: prev.version + 1, errors: toMessages(result.errors), values: formValues(formData) };
  return { version: prev.version + 1, errors: {}, values: { done: "1", shopName: str(formData, "shopName") } };
}

/** Alıcı ana sayfasında "Siparişinizi bulun": dükkân bilinmeden numara ve telefonla. */
export async function lookupOrderAnywhere(prev: FormState, formData: FormData): Promise<FormState> {
  const number = str(formData, "number");
  const phone = str(formData, "phone");
  const errors: Record<string, string> = {};
  if (!number.trim()) errors.number = checkoutErrorMessage("number", { code: CheckoutError.Required });
  if (!phone.trim()) errors.phone = checkoutErrorMessage("phone", { code: CheckoutError.Required });
  if (Object.keys(errors).length) return { version: prev.version + 1, errors, values: formValues(formData) };
  const found = await findOrder({ number, phone });
  if (!found) {
    return {
      version: prev.version + 1,
      errors: { form: "Bu numara ve telefonla bir sipariş bulamadık. Numara onay SMS'inde yazar, T ile başlar." },
      values: formValues(formData),
    };
  }
  redirect(trackingOrderPath(found.slug, found.token));
}
