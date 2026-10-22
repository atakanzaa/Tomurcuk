import Image from "next/image";
import type { ReactNode } from "react";
import type { Product } from "@/lib/api/types";
import { MOCK_PHOTO_PREFIX, mockIllustration } from "@/lib/demo-photos";

/**
 * Dükkânın çektiği fotoğraf. Yanında ad ya da açıklama yazdığı için dekoratiftir (alt="").
 * Adres yoksa undefined döner. Gerçek fotoğraflar için next.config.ts'e images.remotePatterns eklenmeli.
 */
export function renderPhoto(photoUrl: string | null, sizes: string): ReactNode | undefined {
  if (!photoUrl) return undefined;
  if (photoUrl.startsWith(MOCK_PHOTO_PREFIX)) return mockIllustration(photoUrl) ?? undefined;
  return <Image src={photoUrl} alt="" fill sizes={sizes} style={{ objectFit: "cover" }} />;
}

/** Ürün fotoğrafı; yoksa ProductItem kraft zemin üzerinde adı gösterir. */
export function renderProductPhoto(product: Product, sizes: string): ReactNode | undefined {
  return renderPhoto(product.photoUrl, sizes);
}
