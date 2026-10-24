import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { LegalPage } from "@/components/legal/LegalPage";
import { DistanceSale, PreInformation } from "@/components/legal/ShopDocuments";
import { documentPath, ShopDocument, shopDocumentTitle } from "@/lib/legal/documents";
import legal from "@/components/legal/legal.module.css";
import { findShop, getOrderContract } from "@/lib/api";
import { ShopLookupKind } from "@/lib/api/types";
import { fromContract, placedAtText } from "@/lib/legal/order";
import { trackingOrderPath } from "@/lib/routes";

// Takip linki kişiye özeldir; arama motorlarına kapalı.
export const metadata: Metadata = { title: "Sözleşmeleriniz", robots: { index: false, follow: false } };

export default function OrderContractsPage({ params }: PageProps<"/[slug]/takip/[token]/sozlesmeler">) {
  return (
    <Suspense>
      <Contracts params={params} />
    </Suspense>
  );
}

/** Siparişin onaylandığı andaki bilgilerle ön bilgilendirme formu ve mesafeli satış sözleşmesi. */
async function Contracts({ params }: Pick<PageProps<"/[slug]/takip/[token]/sozlesmeler">, "params">) {
  await connection();
  const { slug, token } = await params;
  const lookup = await findShop(slug);
  if (lookup.kind !== ShopLookupKind.Found) notFound();
  const { shop } = lookup;
  const contract = await getOrderContract(shop.id, token);
  if (!contract) notFound();
  const order = fromContract(contract);

  return (
    <>
      <FlowHeader back={{ href: trackingOrderPath(shop.slug, token), label: `Sipariş ${contract.number}` }} />
      <LegalPage
        title="Sözleşmeleriniz"
        meta={`Sipariş ${contract.number} ${placedAtText(contract.createdAt, shop.timeZone)} verildi.${contract.termsVersion ? " Aşağıdaki metinler o anda onaylandı." : ""}`}
        others={[ShopDocument.DeliveryReturns, ShopDocument.Privacy].map((d) => ({
          href: documentPath(shop.slug, d),
          label: shopDocumentTitle[d],
        }))}
      >
        <h2 className={legal.title}>{shopDocumentTitle[ShopDocument.PreInformation]}</h2>
        <PreInformation shop={shop} order={order} />
        <h2 className={legal.title}>{shopDocumentTitle[ShopDocument.DistanceSale]}</h2>
        <DistanceSale shop={shop} order={order} />
      </LegalPage>
    </>
  );
}
