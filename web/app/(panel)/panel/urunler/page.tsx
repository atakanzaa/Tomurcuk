import type { Metadata } from "next";
import { Suspense } from "react";
import { parseStatusFilter } from "@/lib/panel/products";
import { panelSession } from "../_lib";
import { ProductBoard } from "./_components/ProductBoard";

export const metadata: Metadata = { title: "Ürünler" };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default function ProductsPage({ searchParams }: PageProps<"/panel/urunler">) {
  return (
    <Suspense>
      <Products searchParams={searchParams} />
    </Suspense>
  );
}

async function Products({ searchParams }: Pick<PageProps<"/panel/urunler">, "searchParams">) {
  const [query, session] = await Promise.all([searchParams, panelSession()]);
  return (
    <ProductBoard
      session={session}
      filter={parseStatusFilter(query.durum)}
      query={first(query.ara)}
      selected={null}
      notice={query.silindi ? "Ürün silindi. Vitrinden de kalktı." : undefined}
    />
  );
}
