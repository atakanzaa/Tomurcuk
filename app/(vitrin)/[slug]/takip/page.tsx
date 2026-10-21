import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { findShop } from "@/lib/api";
import { ShopLookupKind } from "@/lib/api/types";
import { shopPath } from "@/lib/routes";
import { FlowHeader } from "../_components/flow/FlowHeader";
import { LookupForm } from "./LookupForm";

export const metadata: Metadata = { title: "Siparişim nerede?", robots: { index: false } };

export default function LookupPage({ params }: PageProps<"/[slug]/takip">) {
  return (
    <Suspense>
      <Lookup params={params} />
    </Suspense>
  );
}

async function Lookup({ params }: { params: Promise<{ slug: string }> }) {
  const lookup = await findShop((await params).slug);
  if (lookup.kind !== ShopLookupKind.Found) notFound();
  const { shop } = lookup;
  return (
    <>
      <FlowHeader back={{ href: shopPath(shop.slug), label: shop.shortName }} />
      <LookupForm slug={shop.slug} phone={shop.phone} />
    </>
  );
}
