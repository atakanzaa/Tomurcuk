"use server";

import { refresh, updateTag } from "next/cache";
import { findShop, hideReview, writeReview } from "@/lib/api";
import { CheckoutError, ShopLookupKind } from "@/lib/api/types";
import { formValues, type FormState } from "@/lib/checkout/form-state";
import { toMessages } from "@/lib/checkout/messages";

// Yorum yazma (takip sayfası, oturumsuz; takip kodu yetkidir) ve gizleme (destek paneli).

const str = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

/** Yazılınca vitrin, ürün sayfası ve ana sayfadaki yorumlar yenilenir; takip sayfası yorumu gösterir. */
export async function writeReviewAction(
  slug: string,
  token: string,
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const failed = (errors: Record<string, string>): FormState => ({
    version: prev.version + 1,
    errors,
    values: formValues(formData),
  });
  const lookup = await findShop(slug);
  if (lookup.kind !== ShopLookupKind.Found) return failed({ form: "Dükkân bulunamadı. Sayfayı yenileyin." });
  const rating = Number(str(formData, "rating"));
  const result = await writeReview(lookup.shop.id, token, {
    rating: Number.isInteger(rating) && rating > 0 ? rating : null,
    text: str(formData, "text"),
    hideName: formData.get("hideName") === "on",
  });
  if (!result)
    return failed({
      form: "Sipariş bulunamadı. Takip linkini SMS'ten yeniden açın.",
    });
  if (!result.ok) return failed(toMessages(result.errors));
  updateTag(`reviews:${lookup.shop.id}`);
  updateTag("reviews");
  refresh();
  return { version: prev.version + 1, errors: {}, values: { done: "1" } };
}

export async function hideReviewAction(
  shopId: string,
  reviewId: string,
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = await hideReview(reviewId, str(formData, "reason"));
  if (!result) {
    return {
      version: prev.version + 1,
      errors: { form: "Yorum zaten gizlenmiş. Sayfayı yenileyin." },
      values: formValues(formData),
    };
  }
  if (!result.ok) {
    // Ortak "gerekçe" mesajı e-postadan söz eder; yorum gizlemede e-posta gitmez.
    const errors = toMessages(result.errors);
    if (result.errors.reason?.code === CheckoutError.Required)
      errors.reason = "Gerekçe yazın; denetim kaydına bu metin gider.";
    return { version: prev.version + 1, errors, values: formValues(formData) };
  }
  updateTag(`reviews:${shopId}`);
  updateTag("reviews");
  refresh();
  return { version: prev.version + 1, errors: {}, values: { done: "1" } };
}
