import Image from "next/image";
import type { ReactNode } from "react";
import type { Product } from "@/lib/api/types";
import { MOCK_PHOTO_PREFIX, mockIllustration } from "@/lib/mock/illustrations";

/**
 * Ürün fotoğrafı. Ad hemen altında yazdığı için görsel dekoratiftir (alt="").
 * Fotoğraf yoksa undefined döner; ProductItem kraft zemin üzerinde adı gösterir.
 * Gerçek fotoğraflar için next.config.ts'e images.remotePatterns eklenmeli.
 */
export function renderProductPhoto(product: Product, sizes: string): ReactNode | undefined {
  if (!product.photoUrl) return undefined;
  if (product.photoUrl.startsWith(MOCK_PHOTO_PREFIX)) return mockIllustration(product.photoUrl) ?? undefined;
  return <Image src={product.photoUrl} alt="" fill sizes={sizes} style={{ objectFit: "cover" }} />;
}
