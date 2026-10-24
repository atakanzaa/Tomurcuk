import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { effectiveDate, LegalPage } from "@/components/legal/LegalPage";
import { BuyerPrivacy, DeliveryReturns, DistanceSale, PreInformation } from "@/components/legal/ShopDocuments";
import { findShop, getDraft } from "@/lib/api";
import { ShopLookupKind, type Shop } from "@/lib/api/types";
import { readDraftId } from "@/lib/checkout/session";
import { documentPath, ShopDocument, shopDocumentTitle } from "@/lib/legal/documents";
import { fromDraft } from "@/lib/legal/order";
import { TERMS_DATE } from "@/lib/legal/version";
import { SHELL_SLUG, shopPath } from "@/lib/routes";

type Props = PageProps<"/[slug]/sozlesmeler/[belge]">;

const parseDocument = (value: string) => Object.values(ShopDocument).find((d) => d === value);

/** Vitrin gibi derlemede yalnızca kabuk; dükkânların metinleri ilk ziyarette üretilir. */
export async function generateStaticParams() {
  return Object.values(ShopDocument).map((belge) => ({ slug: SHELL_SLUG, belge }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, belge } = await params;
  const doc = parseDocument(belge);
  const lookup = await findShop(slug);
  if (!doc || lookup.kind !== ShopLookupKind.Found) return {};
  return { title: `${shopDocumentTitle[doc]} · ${lookup.shop.name}` };
}

export default function ShopDocumentPage({ params }: Props) {
  return (
    <Suspense>
      <Document params={params} />
    </Suspense>
  );
}

async function Document({ params }: Pick<Props, "params">) {
  const { slug, belge } = await params;
  const doc = parseDocument(belge);
  const lookup = await findShop(slug);
  if (!doc || lookup.kind !== ShopLookupKind.Found) notFound();
  const { shop } = lookup;
  const others = Object.values(ShopDocument)
    .filter((d) => d !== doc)
    .map((d) => ({ href: documentPath(shop.slug, d), label: shopDocumentTitle[d] }));

  return (
    <>
      <FlowHeader back={{ href: shopPath(shop.slug), label: shop.shortName }} />
      <LegalPage title={shopDocumentTitle[doc]} meta={effectiveDate(TERMS_DATE)} others={others}>
        {doc === ShopDocument.PreInformation || doc === ShopDocument.DistanceSale ? (
          // Ödeme adımından açıldıysa metin siparişin bilgileriyle dolar; çerez okunduğu için istek anında.
          <Suspense fallback={doc === ShopDocument.PreInformation ? <PreInformation shop={shop} order={null} /> : <DistanceSale shop={shop} order={null} />}>
            <WithDraft shop={shop} doc={doc} />
          </Suspense>
        ) : doc === ShopDocument.DeliveryReturns ? (
          <DeliveryReturns shop={shop} />
        ) : (
          <BuyerPrivacy shop={shop} />
        )}
      </LegalPage>
    </>
  );
}

async function WithDraft({ shop, doc }: { shop: Shop; doc: ShopDocument }) {
  const draftId = await readDraftId();
  const draft = draftId ? await getDraft(shop.id, draftId) : null;
  const order = draft ? fromDraft(draft) : null;
  return doc === ShopDocument.PreInformation ? <PreInformation shop={shop} order={order} /> : <DistanceSale shop={shop} order={order} />;
}
