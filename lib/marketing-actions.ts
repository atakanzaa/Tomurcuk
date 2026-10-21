"use server";

import { submitPilotApplication } from "@/lib/api";
import { formValues, type FormState } from "@/lib/checkout/form-state";
import { toMessages } from "@/lib/checkout/messages";

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
