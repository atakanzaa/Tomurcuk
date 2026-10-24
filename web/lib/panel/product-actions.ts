"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { deleteProduct, saveProduct, uploadProductPhoto } from "@/lib/api";
import type { FieldErrors, ProductInput } from "@/lib/api/types";
import { productErrorMessages } from "@/lib/panel/products";
import type { ActionNotice } from "./notice";
import { loadPanel } from "./session";

export interface ProductFormState {
  version: number;
  errors: Record<string, string>;
  notice: ActionNotice;
}

const str = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

/** Vitrin, ürün sayfası ve alıcı ana sayfası önbellekten değil yeniden okunur. */
function refreshShowcase(shopId: string) {
  updateTag(`products:${shopId}`);
  updateTag(`shop:${shopId}`);
  updateTag("discover");
}

/** Form alanları istemcide tutulur ve tek JSON olarak gelir (`payload`). */
export async function saveProductForm(prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const { shop } = await loadPanel();
  const productId = str(formData, "productId") || null;
  let input: ProductInput;
  try {
    input = JSON.parse(str(formData, "payload")) as ProductInput;
  } catch {
    return { ...prev, version: prev.version + 1, errors: { form: "Form okunamadı. Sayfayı yenileyip yeniden deneyin." } };
  }
  const result = await saveProduct(shop.id, productId, input);
  if (!result) {
    return { ...prev, version: prev.version + 1, errors: { form: "Bu ürün silinmiş. Ürünler listesine dönün." } };
  }
  if (!result.ok) {
    return { ...prev, version: prev.version + 1, errors: productErrorMessages(result.errors as FieldErrors) };
  }
  refreshShowcase(shop.id);
  if (!productId) redirect(`/panel/urunler/${result.value.productId}?eklendi=1`);
  refresh();
  return {
    version: prev.version + 1,
    errors: {},
    notice: { version: prev.notice.version + 1, message: "Değişiklikler kaydedildi. Vitrininizde görünüyor.", error: false },
  };
}

export async function removeProduct(formData: FormData) {
  const { shop } = await loadPanel();
  await deleteProduct(shop.id, str(formData, "productId"));
  refreshShowcase(shop.id);
  redirect("/panel/urunler?silindi=1");
}

/** Tek fotoğraf; seçilir seçilmez yüklenir, adresi ürün kaydedilirken listeye girer. */
export async function uploadPhoto(formData: FormData): Promise<{ url: string } | { error: string }> {
  const { shop } = await loadPanel();
  const file = formData.get("file");
  if (!(file instanceof Blob) || file.size === 0) return { error: "Fotoğraf seçilmedi." };
  const result = await uploadProductPhoto(shop.id, file);
  if (result.ok) return { url: result.value.url };
  return { error: productErrorMessages(result.errors as FieldErrors).photo ?? "Fotoğraf yüklenemedi. Yeniden deneyin." };
}
