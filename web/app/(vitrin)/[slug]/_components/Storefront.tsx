import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { findShop, getBestseller, getCategories, getDeliveryZones, getProducts, getShopRatings } from "@/lib/api";
import { ShopLayout, ShopLookupKind, ShopStatus, type Category, type Product, type Shop } from "@/lib/api/types";
import { NO_SELECTION, parseCatalogSelection } from "@/lib/catalog";
import { cx } from "@/lib/cx";
import { shopPath } from "@/lib/routes";
import { BestsellerRow } from "./BestsellerRow";
import { Catalog } from "./Catalog";
import { DeliveryBand } from "./DeliveryBand";
import { FavoriteProduct } from "./FavoriteProduct";
import { HeaderCategories, StoreHeader } from "./StoreHeader";
import { ShopContact } from "./ShopContact";
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
  const [categories, products, zones, bestseller, ratings] = await Promise.all([
    getCategories(shop.id),
    getProducts(shop.id),
    getDeliveryZones(shop.id),
    getBestseller(shop.id),
    getShopRatings(shop.id),
  ]);
  const favorite = products.find((product) => product.id === shop.featuredProductId) ?? null;
  // Favoriyle aynıysa ayrı satır olmaz; sayı favorinin altına yazılır.
  const best = products.find((product) => product.id === bestseller.productId) ?? null;
  const bestIsFavorite = best !== null && best === favorite;
  const hasStory = shop.story.trim() !== "" || shop.storyPhotos.length > 0;

  const layout = shop.layout;
  // Hikâye önde düzeninde hikâye girişte; çiçekler önde düzeninde favori ve en çok gönderilen
  // ürün kartlarında etiket olur, hikâye en alta iner.
  const storyInSections = hasStory && layout === ShopLayout.Cover;
  const showBest = best !== null && !bestIsFavorite;
  const badges: Record<string, string> = {};
  if (layout === ShopLayout.Products) {
    if (best) badges[best.id] = "En çok gönderilen";
    if (favorite) badges[favorite.id] = "Dükkânın favorisi";
  }
  const catalog = (
    <Suspense
      fallback={
        <Catalog shop={shop} categories={categories} products={products} selection={NO_SELECTION} badges={badges} />
      }
    >
      <SelectedCatalog
        shop={shop}
        categories={categories}
        products={products}
        searchParams={searchParams}
        badges={badges}
      />
    </Suspense>
  );

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
        <ShopHero shop={shop} rating={ratings.shop} />
        {layout !== ShopLayout.Products && (favorite || showBest || storyInSections) && (
          <div className={cx(container.container, sections.sections)}>
            {favorite && (
              <FavoriteProduct shop={shop} product={favorite} sentCount={bestIsFavorite ? bestseller.orders : null} />
            )}
            {(showBest || storyInSections) && (
              <div className={sections.side}>
                {showBest && (
                  <BestsellerRow
                    shop={shop}
                    product={best}
                    orders={bestseller.orders}
                    rating={ratings.products[best.id]}
                  />
                )}
                {storyInSections && <ShopStory shop={shop} />}
              </div>
            )}
          </div>
        )}
        {catalog}
        {layout === ShopLayout.Products && hasStory && (
          <div className={cx(container.container, sections.sections)}>
            <ShopStory shop={shop} />
          </div>
        )}
        <ShopContact shop={shop} zones={zones} />
      </main>
      <StoreFooter shop={shop} />
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
      <StoreFooter shop={shop} />
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

async function SelectedCatalog({
  searchParams,
  ...props
}: SelectionProps & { products: Product[]; badges?: Record<string, string> }) {
  const selection = parseCatalogSelection(props.categories, await searchParams);
  return <Catalog {...props} selection={selection} />;
}
