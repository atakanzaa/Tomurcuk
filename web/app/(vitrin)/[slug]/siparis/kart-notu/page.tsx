import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutStep, checkoutPath, shopPath } from "@/lib/routes";
import { FlowHeader } from "@/components/flow/FlowHeader";
import { FlowNotice } from "../FlowNotice";
import { loadCheckout } from "../_load";
import { CardForm } from "./CardForm";

export const metadata: Metadata = { title: "Kart notu", robots: { index: false } };

export default function CardPage({ params }: PageProps<"/[slug]/siparis/kart-notu">) {
  return (
    <Suspense>
      <CardStep params={params} />
    </Suspense>
  );
}

async function CardStep({ params }: { params: Promise<{ slug: string }> }) {
  const { shop, draft } = await loadCheckout(params);
  const back = { href: checkoutPath(shop.slug, CheckoutStep.Delivery), label: "Teslimat" };
  if (!draft?.delivery) {
    return (
      <>
        <FlowHeader back={back} step={2} />
        {draft ? (
          <FlowNotice
            message="Kart notundan önce teslimat bilgilerini doldurun."
            href={back.href}
            action="Teslimat bilgilerine dön"
          />
        ) : (
          <FlowNotice
            message="Sipariş bilgileriniz bulunamadı. Vitrinden bir ürün seçerek yeniden başlayın."
            href={shopPath(shop.slug)}
            action="Vitrine dön"
          />
        )}
      </>
    );
  }
  return (
    <>
      <FlowHeader back={back} step={2} />
      <CardForm slug={shop.slug} draft={draft} />
    </>
  );
}
