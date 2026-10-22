import type { Metadata } from "next";
import { Suspense } from "react";
import { findShop, listFeaturedShopSlugs } from "@/lib/api";
import { ShopLookupKind } from "@/lib/api/types";
import { Storefront } from "./_components/Storefront";
import styles from "./page.module.css";

/** Bilinen dükkânlar derlemede hazırlanır; diğerleri ilk ziyarette üretilip saklanır. */
export async function generateStaticParams() {
  const slugs = await listFeaturedShopSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const lookup = await findShop((await params).slug);
  if (lookup.kind !== ShopLookupKind.Found) return {};
  return { title: lookup.shop.name, description: lookup.shop.descriptionShort };
}

export default function StorefrontPage({ params, searchParams }: PageProps<"/[slug]">) {
  return (
    <Suspense fallback={<div className={styles.shell} aria-busy="true" />}>
      <Storefront params={params} searchParams={searchParams} />
    </Suspense>
  );
}
