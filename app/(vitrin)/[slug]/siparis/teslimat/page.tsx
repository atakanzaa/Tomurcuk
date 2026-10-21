import type { Metadata } from "next";
import { Suspense } from "react";
import { getDeliveryDays, getDeliveryZones, getTimeSlots } from "@/lib/api";
import { BOOKING_WINDOW_DAYS } from "@/lib/checkout/limits";
import { productPath, shopPath } from "@/lib/routes";
import { FlowHeader } from "../../_components/flow/FlowHeader";
import { FlowNotice } from "../FlowNotice";
import { loadCheckout } from "../_load";
import { DeliveryForm } from "./DeliveryForm";

export const metadata: Metadata = { title: "Teslimat", robots: { index: false } };

export default function DeliveryPage({ params }: PageProps<"/[slug]/siparis/teslimat">) {
  return (
    <Suspense>
      <DeliveryStep params={params} />
    </Suspense>
  );
}

async function DeliveryStep({ params }: { params: Promise<{ slug: string }> }) {
  const { shop, draft } = await loadCheckout(params);
  if (!draft) {
    return (
      <>
        <FlowHeader back={{ href: shopPath(shop.slug), label: shop.shortName }} />
        <FlowNotice
          message="Sipariş bilgileriniz bulunamadı. Vitrinden bir ürün seçerek yeniden başlayın."
          href={shopPath(shop.slug)}
          action="Vitrine dön"
        />
      </>
    );
  }
  const [days, slots, zones] = await Promise.all([
    getDeliveryDays(shop.id, BOOKING_WINDOW_DAYS),
    getTimeSlots(shop.id),
    getDeliveryZones(shop.id),
  ]);

  return (
    <>
      <FlowHeader back={{ href: productPath(shop.slug, draft.item.productId), label: "Ürün" }} step={1} />
      <DeliveryForm slug={shop.slug} draft={draft} days={days} slots={slots} zones={zones} />
    </>
  );
}
