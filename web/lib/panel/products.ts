// Panelde ürün yönetiminin sunucu ve istemcide ortak parçaları: hata metinleri, liste satırı
// bilgisi ve formun başlangıç değerleri.
import { CheckoutError, OptionKind, type FieldErrors, type Product } from "@/lib/api/types";
import { productPriceLabel } from "@/lib/catalog";
import { checkoutErrorMessage } from "@/lib/checkout/messages";

/** Listede süzgeç; URL'de `?durum=`. */
export const ProductStatusFilter = { All: "", OnSale: "satista", OffSale: "satista-degil" } as const;
export type ProductStatusFilter = (typeof ProductStatusFilter)[keyof typeof ProductStatusFilter];

export function parseStatusFilter(value: string | string[] | undefined): ProductStatusFilter {
  const v = Array.isArray(value) ? value[0] : value;
  return Object.values(ProductStatusFilter).find((f) => f && f === v) ?? ProductStatusFilter.All;
}

const requiredMessages: Record<string, string> = {
  name: "Ürünün adını yazın.",
  category: "Bir kategori seçin ya da yeni kategorinin adını yazın.",
  price: "Fiyatı yazın. Ürünün boyları varsa fiyatları boylara yazın.",
};

const optionMessages: Record<string, string> = {
  sizes: "Her boyun adını ve fiyatını yazın; fiyat 1 TL ile 100.000 TL arasında olmalı.",
  extras: "Her seçeneğin adını ve ek ücretini yazın; ücretsiz seçenek için 0 yazın.",
  category: "Bu kategori artık yok. Listeden başka bir kategori seçin.",
};

export function productErrorMessages(errors: FieldErrors): Record<string, string> {
  return Object.fromEntries(
    Object.entries(errors).flatMap(([field, error]) => {
      if (!error) return [];
      if (error.code === CheckoutError.Required && requiredMessages[field]) return [[field, requiredMessages[field]]];
      if (error.code === CheckoutError.OptionInvalid && optionMessages[field]) return [[field, optionMessages[field]]];
      if (error.code === CheckoutError.PhotoInvalid && field === "photos") {
        return [[field, "Fotoğraflardan biri bu dükkâna ait değil. Kaldırıp yeniden yükleyin."]];
      }
      return [[field, checkoutErrorMessage(field, error)]];
    }),
  );
}

const sizesOf = (product: Product) => product.options.filter((o) => o.kind === OptionKind.Size);
const extrasOf = (product: Product) => product.options.filter((o) => o.kind !== OptionKind.Size);

/** Telefonda satırın ikinci satırı: "15 dal, kraft sarımlı, 3 boy, 2 ek seçenek". */
export function productListMeta(product: Product): string {
  const sizes = sizesOf(product).length;
  const extras = extrasOf(product).length;
  return [product.summary, sizes > 1 ? `${sizes} boy` : "", extras ? `${extras} ek seçenek` : ""].filter(Boolean).join(", ");
}

/** Masaüstünde dar listede: "850 TL'den, 3 boy". */
export function productPriceMeta(product: Product): string {
  const sizes = sizesOf(product).length;
  return [productPriceLabel(product), sizes > 1 ? `${sizes} boy` : ""].filter(Boolean).join(", ");
}

/** Formda TL tam sayı olarak yazılır; kuruşlu fiyat ondalıkla gösterilir. */
export const toLira = (kurus: number) => (kurus % 100 === 0 ? String(kurus / 100) : (kurus / 100).toFixed(2).replace(".", ","));

/** "1.250", "1250" ya da "1250,50" → kuruş; boş ya da geçersizse null. */
export function parseLira(text: string): number | null {
  const clean = text.replace(/\s|TL/gi, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (!clean) return null;
  const value = Number(clean);
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : null;
}

export interface ChoiceRow {
  key: string;
  id: string | null;
  name: string;
  price: string;
}

export interface ProductFormValues {
  categoryId: string;
  newCategory: string;
  name: string;
  summary: string;
  description: string;
  price: string;
  sizes: ChoiceRow[];
  extras: ChoiceRow[];
  photos: string[];
  active: boolean;
}

/** Var olan ürünün formdaki hali: boyların fiyatı tam fiyattır (ürün fiyatı + ek fiyat). */
export function productFormValues(product: Product | null, firstCategoryId: string): ProductFormValues {
  if (!product) {
    return {
      categoryId: firstCategoryId,
      newCategory: "",
      name: "",
      summary: "",
      description: "",
      price: "",
      sizes: [],
      extras: [],
      photos: [],
      active: true,
    };
  }
  return {
    categoryId: product.categoryId,
    newCategory: "",
    name: product.name,
    summary: product.summary,
    description: product.description,
    price: sizesOf(product).length ? "" : toLira(product.price),
    sizes: sizesOf(product).map((o) => ({
      key: o.id,
      id: o.id,
      name: o.detail ? `${o.name}, ${o.detail}` : o.name,
      price: toLira(product.price + o.extraPrice),
    })),
    extras: extrasOf(product).map((o) => ({ key: o.id, id: o.id, name: o.name, price: toLira(o.extraPrice) })),
    photos: product.photos,
    active: product.active,
  };
}
