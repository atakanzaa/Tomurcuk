import { Suspense } from "react";
import { findShop } from "@/lib/api";
import { ShopLookupKind } from "@/lib/api/types";
import { shopThemeCss } from "@/lib/shop-theme";

/**
 * Dükkânın bütün sayfaları (vitrin, ürün, sipariş adımları, takip, sözleşmeler) dükkânın
 * renginde açılır. Renk yoksa ya da çiçekçi Tomurcuk'un renklerini seçtiyse hiçbir şey eklenmez.
 */
export default function ShopLayout({ children, params }: LayoutProps<"/[slug]">) {
  return (
    <>
      <Suspense fallback={null}>
        <ShopThemeStyle params={params} />
      </Suspense>
      {children}
    </>
  );
}

async function ShopThemeStyle({ params }: { params: Promise<{ slug: string }> }) {
  const lookup = await findShop((await params).slug);
  if (lookup.kind !== ShopLookupKind.Found || !lookup.shop.theme) return null;
  return <style>{shopThemeCss(lookup.shop.theme)}</style>;
}
