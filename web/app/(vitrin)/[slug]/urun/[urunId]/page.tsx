import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { findShop, getDeliveryZones, getProduct, getProducts, listFeaturedShopSlugs } from "@/lib/api";
import { ShopLookupKind, type Product } from "@/lib/api/types";
import { joinWithAnd, withDativeSuffix, withTimeSuffix } from "@/lib/format";
import { shopPath } from "@/lib/routes";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { renderProductPhoto } from "@/components/ProductPhoto";
import { ProductOrderForm } from "./ProductOrderForm";
import { ShareButton } from "./ShareButton";
import styles from "./product.module.css";

type Props = PageProps<"/[slug]/urun/[urunId]">;

export async function generateStaticParams() {
  const params: { slug: string; urunId: string }[] = [];
  for (const slug of await listFeaturedShopSlugs()) {
    const lookup = await findShop(slug);
    if (lookup.kind !== ShopLookupKind.Found) continue;
    for (const product of await getProducts(lookup.shop.id)) params.push({ slug, urunId: product.id });
  }
  return params;
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
  const zones = await getDeliveryZones(shop.id);
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
            <p className={styles.description}>{product.description}</p>
          </div>
          <ProductOrderForm slug={shop.slug} product={product} note={note} />
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
