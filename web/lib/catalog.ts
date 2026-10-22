import { formatPrice, formatPriceFrom } from "@/lib/format";
import { OptionKind, type Category, type Product } from "@/lib/api/types";

const sizeOptions = (product: Product) => product.options.filter((o) => o.kind === OptionKind.Size);

/** En küçük boyla birlikte en düşük fiyat (kuruş). */
export function lowestPrice(product: Product): number {
  const sizes = sizeOptions(product);
  return product.price + (sizes.length ? Math.min(...sizes.map((o) => o.extraPrice)) : 0);
}

/** Boy seçimi olan üründe fiyat en küçük boydan başlar: "850 TL'den". */
export function productPriceLabel(product: Product): string {
  return sizeOptions(product).length > 1 ? formatPriceFrom(lowestPrice(product)) : formatPrice(product.price);
}

/** Vitrindeki fiyat ve vazo süzgeçleri; URL'de `?filtre=` ile taşınır. */
export const CatalogFilter = {
  Under1000: "1000-tl-alti",
  WithVase: "vazolu",
} as const;
export type CatalogFilter = (typeof CatalogFilter)[keyof typeof CatalogFilter];

export const catalogFilterLabel: Record<CatalogFilter, string> = {
  [CatalogFilter.Under1000]: "1.000 TL altı",
  [CatalogFilter.WithVase]: "Vazolu",
};

const catalogFilterTest: Record<CatalogFilter, (product: Product) => boolean> = {
  [CatalogFilter.Under1000]: (product) => lowestPrice(product) < 100000,
  [CatalogFilter.WithVase]: (product) => product.options.some((o) => o.kind === OptionKind.Vase),
};

export function isCatalogFilter(value: unknown): value is CatalogFilter {
  return typeof value === "string" && Object.values<string>(CatalogFilter).includes(value);
}

export interface CatalogSelection {
  category: Category | null;
  filter: CatalogFilter | null;
}

/** URL'den gelen ham değerleri doğrular; tanınmayan değer yok sayılır. */
export function parseCatalogSelection(
  categories: Category[],
  params: { [key: string]: string | string[] | undefined },
): CatalogSelection {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const categorySlug = first(params.kategori);
  const filter = first(params.filtre);
  return {
    category: categories.find((c) => c.slug === categorySlug) ?? null,
    filter: isCatalogFilter(filter) ? filter : null,
  };
}

export function selectProducts(products: Product[], { category, filter }: CatalogSelection): Product[] {
  return products.filter(
    (product) =>
      (!category || product.categoryId === category.id) && (!filter || catalogFilterTest[filter](product)),
  );
}

/** Seçimi koruyarak tek bir alanı değiştiren sorgu nesnesi; Link href'inde kullanılır. */
export function catalogQuery(selection: CatalogSelection, change: Partial<CatalogSelection>) {
  const next = { ...selection, ...change };
  return {
    ...(next.category ? { kategori: next.category.slug } : {}),
    ...(next.filter ? { filtre: next.filter } : {}),
  };
}

/** Süzgeçsiz hal: URL okunmadan önce statik kabukta gösterilir. */
export const NO_SELECTION: CatalogSelection = { category: null, filter: null };
