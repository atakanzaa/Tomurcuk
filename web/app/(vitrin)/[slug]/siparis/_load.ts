import "server-only";
import { notFound } from "next/navigation";
import { findShop, getDraft } from "@/lib/api";
import { ShopLookupKind } from "@/lib/api/types";
import { readDraftId } from "@/lib/checkout/session";

/** Adım sayfalarının ortak verisi: dükkân ve çerezdeki taslak (yoksa null). */
export async function loadCheckout(params: Promise<{ slug: string }>) {
  const { slug } = await params;
  const lookup = await findShop(slug);
  if (lookup.kind !== ShopLookupKind.Found) notFound();
  const draftId = await readDraftId();
  const draft = draftId ? await getDraft(lookup.shop.id, draftId) : null;
  return { shop: lookup.shop, draft };
}
