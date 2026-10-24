import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Permission, shopCan } from "@/lib/permissions";
import { parseStatusFilter } from "@/lib/panel/products";
import { panelSession } from "../../_lib";
import { ProductBoard } from "../_components/ProductBoard";

export const metadata: Metadata = { title: "Ürün ekle" };

export default function NewProductPage({ searchParams }: PageProps<"/panel/urunler/yeni">) {
  return (
    <Suspense>
      <NewProduct searchParams={searchParams} />
    </Suspense>
  );
}

async function NewProduct({ searchParams }: Pick<PageProps<"/panel/urunler/yeni">, "searchParams">) {
  const [query, session] = await Promise.all([searchParams, panelSession()]);
  // Çalışan ürün ekleyemez (yetki matrisi); listeye döner.
  if (!shopCan(session.user.role, Permission.CatalogEdit)) redirect("/panel/urunler");
  return <ProductBoard session={session} filter={parseStatusFilter(query.durum)} query="" selected="new" />;
}
