// Bağlantı önizlemesi (Open Graph) ve sekme ikonu: dükkânın sayfaları paylaşılınca dükkânın kendi
// kapağı, adı ve açıklamasıyla görünür. Önizleme mutlak adres ister; sitenin adresi ortamdan gelir
// (TOMURCUK_WEB_URL, deploy/compose.base.yml).
import type { Metadata } from "next";
import type { Shop } from "@/lib/api/types";
import { MOCK_PHOTO_PREFIX } from "@/lib/demo-photos";
import { shopPath } from "@/lib/routes";

export function siteUrl(): string {
  return process.env.TOMURCUK_WEB_URL ?? "http://localhost:3100";
}

/** Fotoğraf adresi önizlemede kullanılabiliyorsa mutlak hali; örnek verinin çizimleri kullanılmaz. */
function absolutePhoto(url: string | null): string | null {
  if (!url || url.startsWith(MOCK_PHOTO_PREFIX)) return null;
  return url.startsWith("/") ? `${siteUrl()}${url}` : url;
}

/** Dükkânın logosu; yoksa adının baş harfi dükkânın renginde (`/<slug>/ikon`). */
export function shopIcon(shop: Shop): string {
  return absolutePhoto(shop.logoUrl) ?? `${shopPath(shop.slug)}/ikon`;
}

/** Paylaşım açıklaması; boşsa kısa tanıtım. */
export function shareDescription(shop: Shop): string {
  return shop.shareDescription || shop.descriptionShort || shop.description;
}

/** Vitrin ve ürün sayfaları için: başlık, açıklama, önizleme görseli ve sekme ikonu. */
export function shopMetadata(
  shop: Shop,
  page: { title: string; description: string; path: string; image: string | null },
): Metadata {
  const image = absolutePhoto(page.image) ?? absolutePhoto(shop.coverPhotoUrl);
  return {
    metadataBase: new URL(siteUrl()),
    title: page.title,
    description: page.description,
    alternates: { canonical: page.path },
    icons: { icon: shopIcon(shop) },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      siteName: shop.name,
      title: page.title,
      description: page.description,
      url: page.path,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: page.title, description: page.description },
  };
}
