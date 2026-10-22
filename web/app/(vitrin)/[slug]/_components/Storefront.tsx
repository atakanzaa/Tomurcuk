import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { findShop, getCategories, getDeliveryZones, getProducts } from "@/lib/api";
import { ShopLookupKind, type Category, type Product, type Shop } from "@/lib/api/types";
import { NO_SELECTION, parseCatalogSelection } from "@/lib/catalog";
import { cx } from "@/lib/cx";
import { shopPath } from "@/lib/routes";
import { Catalog } from "./Catalog";
import { DeliveryBand, LiveDeliveryBand } from "./DeliveryBand";
import { FeaturedProduct } from "./FeaturedProduct";
import { HeaderCategories, StoreHeader } from "./StoreHeader";
import { StoreFooter } from "./StoreFooter";
import container from "./container.module.css";
import hero from "./Hero.module.css";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface StorefrontProps {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}

/**
 * Dükkân vitrini. Dükkân ve ürün verisi önbellekli olduğu için sayfanın statik kabuğuna
 * girer; istek anına bağlı iki parça <Suspense> içinde akar ve yerlerinde en sık görülen
 * hal (süzgeçsiz liste, "bugün teslim" bandı) önceden çizilmiş olarak durur:
 * - URL'deki kategori ve süzgeç (searchParams)
 * - aynı gün son sipariş saati (şu anki saat)
 */
export async function Storefront({ params, searchParams }: StorefrontProps) {
  const { slug } = await params;
  const lookup = await findShop(slug);
  // Proxy bu iki durumu render başlamadan karşılar (301, 404); buradaki kontrol
  // istemci tarafı gezinmeler içindir.
  if (lookup.kind === ShopLookupKind.Moved) permanentRedirect(shopPath(lookup.slug));
  if (lookup.kind === ShopLookupKind.Missing) notFound();

  const { shop } = lookup;
  const [categories, products, zones] = await Promise.all([
    getCategories(shop.id),
    getProducts(shop.id),
    getDeliveryZones(shop.id),
  ]);
  const featured = products.find((product) => product.id === shop.featuredProductId) ?? null;
  const listed = products.filter((product) => product !== featured);

  return (
    <>
      <StoreHeader
        shop={shop}
        categoryNav={
          <Suspense fallback={<HeaderCategories shop={shop} categories={categories} selection={NO_SELECTION} />}>
            <SelectedHeaderCategories shop={shop} categories={categories} searchParams={searchParams} />
          </Suspense>
        }
      />
      <main>
        <section className={cx(container.container, hero.hero)}>
          <div className={hero.intro}>
            <h1 className={hero.title}>{shop.name}</h1>
            <p className={hero.lede}>{shop.descriptionShort}</p>
            <p className={hero.ledeLong}>{shop.description}</p>
            {shop.active ? (
              <Suspense fallback={<DeliveryBand shop={shop} sameDayOpen />}>
                <LiveDeliveryBand shop={shop} />
              </Suspense>
            ) : (
              <DeliveryBand shop={shop} sameDayOpen={false} />
            )}
          </div>
          {featured && <FeaturedProduct shopSlug={shop.slug} product={featured} />}
        </section>
        <Suspense fallback={<Catalog shop={shop} categories={categories} products={listed} selection={NO_SELECTION} />}>
          <SelectedCatalog shop={shop} categories={categories} products={listed} searchParams={searchParams} />
        </Suspense>
      </main>
      <StoreFooter shop={shop} zones={zones} />
    </>
  );
}

interface SelectionProps {
  shop: Shop;
  categories: Category[];
  searchParams: SearchParams;
}

async function SelectedHeaderCategories({ searchParams, ...props }: SelectionProps) {
  const selection = parseCatalogSelection(props.categories, await searchParams);
  return <HeaderCategories {...props} selection={selection} />;
}

async function SelectedCatalog({ searchParams, ...props }: SelectionProps & { products: Product[] }) {
  const selection = parseCatalogSelection(props.categories, await searchParams);
  return <Catalog {...props} selection={selection} />;
}
