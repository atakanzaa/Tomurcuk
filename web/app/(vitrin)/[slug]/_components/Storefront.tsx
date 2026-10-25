import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { findShop, getBestseller, getCategories, getDeliveryZones, getProducts } from "@/lib/api";
import { ShopLookupKind, ShopStatus, type Category, type Product, type Shop } from "@/lib/api/types";
import { NO_SELECTION, parseCatalogSelection } from "@/lib/catalog";
import { cx } from "@/lib/cx";
import { shopPath } from "@/lib/routes";
import { BestsellerRow } from "./BestsellerRow";
import { Catalog } from "./Catalog";
import { DeliveryBand } from "./DeliveryBand";
import { FavoriteProduct } from "./FavoriteProduct";
import { HeaderCategories, StoreHeader } from "./StoreHeader";
import { ShopHero } from "./ShopHero";
import { ShopStory } from "./ShopStory";
import { StoreFooter } from "./StoreFooter";
import container from "./container.module.css";
import hero from "./Hero.module.css";
import sections from "./ShopSections.module.css";

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
  if (shop.status === ShopStatus.Suspended) return <SuspendedStorefront shop={shop} />;
  const [categories, products, zones, bestseller] = await Promise.all([
    getCategories(shop.id),
    getProducts(shop.id),
    getDeliveryZones(shop.id),
    getBestseller(shop.id),
  ]);
  const favorite = products.find((product) => product.id === shop.featuredProductId) ?? null;
  // Favoriyle aynıysa ayrı satır olmaz; sayı favorinin altına yazılır.
  const best = products.find((product) => product.id === bestseller.productId) ?? null;
  const bestIsFavorite = best !== null && best === favorite;
  const hasStory = shop.story.trim() !== "" || shop.storyPhotos.length > 0;

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
        <ShopHero shop={shop} />
        {(favorite || (best && !bestIsFavorite) || hasStory) && (
          <div className={cx(container.container, sections.sections)}>
            {favorite && (
              <FavoriteProduct shop={shop} product={favorite} sentCount={bestIsFavorite ? bestseller.orders : null} />
            )}
            {((best && !bestIsFavorite) || hasStory) && (
              <div className={sections.side}>
                {best && !bestIsFavorite && <BestsellerRow shop={shop} product={best} orders={bestseller.orders} />}
                {hasStory && <ShopStory shop={shop} />}
              </div>
            )}
          </div>
        )}
        <Suspense fallback={<Catalog shop={shop} categories={categories} products={products} selection={NO_SELECTION} />}>
          <SelectedCatalog shop={shop} categories={categories} products={products} searchParams={searchParams} />
        </Suspense>
      </main>
      <StoreFooter shop={shop} zones={zones} />
    </>
  );
}

/** Askıdaki dükkân: yalnızca adı ve durumu; ürünler ve sipariş yok. */
function SuspendedStorefront({ shop }: { shop: Shop }) {
  return (
    <>
      <StoreHeader shop={shop} categoryNav={null} />
      <main>
        <section className={cx(container.container, hero.hero)}>
          <div className={hero.intro}>
            <h1 className={hero.title}>{shop.name}</h1>
            <DeliveryBand shop={shop} sameDayOpen={false} />
          </div>
        </section>
      </main>
      <StoreFooter shop={shop} zones={[]} />
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
