import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { findShop, getDeliveryZones, getProduct, getProductReviews } from "@/lib/api";
import { ShopLookupKind, ShopStatus, type Product } from "@/lib/api/types";
import { joinWithAnd, withDativeSuffix, withTimeSuffix } from "@/lib/format";
import { formatRating, reviewCountLabel } from "@/lib/reviews";
import { SHELL_PRODUCT_ID, SHELL_SLUG, shopPath } from "@/lib/routes";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { renderProductPhoto } from "@/components/ProductPhoto";
import { StarMark } from "@/components/ui/Stars";
import { DeliveryBand } from "../../_components/DeliveryBand";
import { ProductOrderForm } from "./ProductOrderForm";
import { ProductReviewList } from "./ProductReviewList";
import { ShareButton } from "./ShareButton";
import styles from "./product.module.css";

type Props = PageProps<"/[slug]/urun/[urunId]">;

/** Vitrin sayfasındaki gibi derlemede yalnızca kabuk; ürün sayfaları ilk ziyarette üretilir. */
export async function generateStaticParams() {
  return [{ slug: SHELL_SLUG, urunId: SHELL_PRODUCT_ID }];
}

async function load(params: Props["params"]) {
  const { slug, urunId } = await params;
  const lookup = await findShop(slug);
  if (lookup.kind !== ShopLookupKind.Found) return null;
  const product = await getProduct(lookup.shop.id, urunId);
  return product ? { shop: lookup.shop, product } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load(params);
  if (!data) return {};
  return { title: `${data.product.name} · ${data.shop.name}`, description: data.product.description };
}

export default function ProductPage({ params }: Props) {
  return (
    <Suspense>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: Pick<Props, "params">) {
  const data = await load(params);
  if (!data) notFound();
  const { shop, product } = data;
  // Askıdaki dükkânın ürünleri gösterilmez; vitrin yalnızca durumu söyler.
  if (shop.status === ShopStatus.Suspended) redirect(shopPath(shop.slug));
  const [zones, reviews] = await Promise.all([getDeliveryZones(shop.id), getProductReviews(shop.id, product.id)]);
  const districts = [...new Set(zones.map((z) => z.district))];
  const note = `${withDativeSuffix(joinWithAnd(districts))} teslim. ${withTimeSuffix(shop.sameDayCutoff, "dative")} kadar verilen siparişler aynı gün yola çıkar.`;

  return (
    <>
      <FlowHeader back={{ href: shopPath(shop.slug), label: shop.shortName }} aside={<ShareButton title={product.name} />} />
      <main className={styles.layout}>
        <div className={styles.photo}>{photoOf(product)}</div>
        <div className={styles.details}>
          <div className={styles.intro}>
            <h1 className={styles.name}>{product.name}</h1>
            {reviews.rating.count > 0 && (
              <a href="#yorumlar" className={styles.rating}>
                <StarMark />
                <strong>{formatRating(reviews.rating.average)}</strong>
                <span className={styles.ratingCount}>{reviewCountLabel(reviews.rating)}</span>
              </a>
            )}
            <p className={styles.description}>{product.description}</p>
          </div>
          {shop.active ? (
            <ProductOrderForm slug={shop.slug} product={product} note={note} />
          ) : (
            <DeliveryBand shop={shop} sameDayOpen={false} />
          )}
          <ProductReviewList shop={shop} reviews={reviews} />
        </div>
      </main>
    </>
  );
}

function photoOf(product: Product) {
  return (
    renderProductPhoto(product, "(min-width: 1024px) 640px, 100vw") ?? (
      <span className={styles.photoPlaceholder} aria-hidden="true">
        {product.name}
      </span>
    )
  );
}
