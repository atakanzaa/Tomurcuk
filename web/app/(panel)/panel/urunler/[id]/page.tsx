import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPanelProduct } from "@/lib/api";
import { parseStatusFilter } from "@/lib/panel/products";
import { panelSession } from "../../_lib";
import { ProductBoard } from "../_components/ProductBoard";

export const metadata: Metadata = { title: "Ürün" };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default function ProductPage({ params, searchParams }: PageProps<"/panel/urunler/[id]">) {
  return (
    <Suspense>
      <ProductView params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ProductView({ params, searchParams }: PageProps<"/panel/urunler/[id]">) {
  const [{ id }, query, session] = await Promise.all([params, searchParams, panelSession()]);
  // Başka dükkânın ürünü de bulunamaz.
  const product = await getPanelProduct(session.shop.id, id);
  if (!product) notFound();
  return (
    <ProductBoard
      session={session}
      filter={parseStatusFilter(query.durum)}
      query={first(query.ara)}
      selected={product}
      justCreated={Boolean(query.eklendi)}
    />
  );
}
