import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { getDeliveryDays } from "@/lib/api";
import { OptionKind, type OrderDraft } from "@/lib/api/types";
import { formatDeliveryDay } from "@/lib/dates";
import { formatPrice, formatTimeRange } from "@/lib/format";
import { CheckoutStep, checkoutPath, shopPath } from "@/lib/routes";
import { FlowHeader } from "@/components/flow/FlowHeader";
import flow from "@/components/flow/flow.module.css";
import { FlowNotice } from "../FlowNotice";
import { loadCheckout } from "../_load";
import { PaymentForm } from "./PaymentForm";
import styles from "./payment.module.css";

export const metadata: Metadata = { title: "Ödeme", robots: { index: false } };

export default function PaymentPage({ params }: PageProps<"/[slug]/siparis/odeme">) {
  return (
    <Suspense>
      <PaymentStep params={params} />
    </Suspense>
  );
}

async function PaymentStep({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { shop, draft } = await loadCheckout(params);
  const back = { href: checkoutPath(shop.slug, CheckoutStep.Card), label: "Kart notu" };
  if (!draft?.delivery || !draft.card) {
    const missing = !draft
      ? { message: "Sipariş bilgileriniz bulunamadı. Vitrinden bir ürün seçerek yeniden başlayın.", href: shopPath(shop.slug), action: "Vitrine dön" }
      : !draft.delivery
        ? { message: "Ödemeden önce teslimat bilgilerini doldurun.", href: checkoutPath(shop.slug, CheckoutStep.Delivery), action: "Teslimat bilgilerine dön" }
        : { message: "Ödemeden önce kart notu adımını tamamlayın.", href: back.href, action: "Kart notuna dön" };
    return (
      <>
        <FlowHeader back={back} step={3} />
        <FlowNotice {...missing} />
      </>
    );
  }

  const [today] = await getDeliveryDays(shop.id, 1);
  const { delivery, card } = draft;
  const edit = (step: CheckoutStep) => checkoutPath(shop.slug, step);

  return (
    <>
      <FlowHeader back={back} step={3} />
      <div className={flow.body}>
        <h1 className={flow.title}>Kontrol edip ödeyin</h1>
        <OrderSummary draft={draft} />
        <section aria-label="Teslimat bilgileri" className={styles.review}>
          <ReviewRow label="Ne zaman" href={edit(CheckoutStep.Delivery)}>
            <span className={styles.value}>
              {formatDeliveryDay(delivery.date, today?.date ?? delivery.date)},{" "}
              {formatTimeRange(delivery.slotStart, delivery.slotEnd)}
            </span>
          </ReviewRow>
          <ReviewRow label="Kime, nereye" href={edit(CheckoutStep.Delivery)}>
            <span className={styles.value}>
              {delivery.recipientName}, {delivery.recipientPhone}
            </span>
            <span className={styles.secondary}>
              {delivery.address}, {delivery.neighborhood}, {delivery.district}
            </span>
          </ReviewRow>
          <ReviewRow label="Kart notu" href={edit(CheckoutStep.Card)}>
            {card.message ? (
              <span className={styles.cardNote}>{card.message}</span>
            ) : (
              <span className={styles.value}>Kart boş gidecek.</span>
            )}
            <span className={styles.secondary}>{card.anonymous ? "İsimsiz gönderim" : card.signature}</span>
          </ReviewRow>
        </section>
      </div>
      <PaymentForm
        slug={shop.slug}
        total={draft.total}
        shopName={shop.name}
        idempotencyKey={crypto.randomUUID()}
      />
    </>
  );
}

function OrderSummary({ draft }: { draft: OrderDraft }) {
  const { item, delivery } = draft;
  const size = item.options.find((o) => o.kind === OptionKind.Size);
  const extras = item.options.filter((o) => o.kind !== OptionKind.Size);
  return (
    <section aria-label="Sipariş özeti" className={styles.summary}>
      <div className={styles.line}>
        <span>
          {item.productName}
          {size && `, ${size.name.toLocaleLowerCase("tr")}`}
          {size?.detail && <span className={styles.secondaryInline}> {size.detail}</span>}
        </span>
        <span className={styles.amount}>{formatPrice(item.unitPrice + (size?.extraPrice ?? 0))}</span>
      </div>
      {extras.map((o) => (
        <div key={o.id} className={styles.line}>
          <span>{o.name}</span>
          <span className={styles.amount}>{formatPrice(o.extraPrice)}</span>
        </div>
      ))}
      {delivery && (
        <div className={styles.line}>
          <span>Teslimat, {delivery.neighborhood}</span>
          <span className={styles.amount}>{formatPrice(delivery.fee)}</span>
        </div>
      )}
      <hr className={styles.rule} />
      <div className={styles.totalLine}>
        <span>Toplam</span>
        <span>{formatPrice(draft.total)}</span>
      </div>
    </section>
  );
}

function ReviewRow({ label, href, children }: { label: string; href: string; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <div className={styles.rowText}>
        <span className={styles.label}>{label}</span>
        {children}
      </div>
      <Link href={href} className={styles.change} aria-label={`${label}: değiştir`}>
        Değiştir
      </Link>
    </div>
  );
}
