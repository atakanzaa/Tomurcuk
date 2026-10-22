import type { Metadata } from "next";
import { Suspense } from "react";
import { findShop } from "@/lib/api";
import { ShopLookupKind } from "@/lib/api/types";
import { SHELL_SLUG } from "@/lib/routes";
import { Storefront } from "./_components/Storefront";
import styles from "./page.module.css";

/**
 * Derlemede yalnızca sayfa kabuğu doğrulanır (SHELL_SLUG); dükkânlar ilk ziyarette
 * üretilip önbelleğe alınır. Böylece aynı image her ortamın kendi verisiyle çalışır.
 */
export async function generateStaticParams() {
  return [{ slug: SHELL_SLUG }];
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
