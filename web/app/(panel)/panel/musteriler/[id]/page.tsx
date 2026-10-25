import { Phone, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { OrderList, OrderRow } from "@/components/ui/OrderRow";
import { getCustomer } from "@/lib/api";
import { formatDayMonth } from "@/lib/dates";
import { formatPrice, phoneHref, whatsappHref, zonedNow } from "@/lib/format";
import { orderItemsSummary, orderStatusTag } from "@/lib/order";
import { FlowHeader } from "@/components/flow/FlowHeader";
import panel from "../../_components/panel.module.css";
import { panelSession } from "../../_lib";
import styles from "../customers.module.css";
import { SpecialDays } from "./SpecialDays";

export const metadata: Metadata = { title: "Müşteri kartı" };

export default function CustomerPage({ params, searchParams }: PageProps<"/panel/musteriler/[id]">) {
  return (
    <Suspense>
      <Customer params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Customer({ params, searchParams }: Pick<PageProps<"/panel/musteriler/[id]">, "params" | "searchParams">) {
  const [{ id }, query, { shop }] = await Promise.all([params, searchParams, panelSession()]);
  const detail = await getCustomer(shop.id, id);
  if (!detail) notFound();
  const { customer, orders, specialDays } = detail;
  const first = orders.at(-1);
  // Sipariş detayındaki "Özel gün olarak kaydet": form siparişin alıcısı ve teslim günüyle dolar.
  const fromOrder = orders.find((o) => o.id === query["ozel-gun"]);
  const draft = fromOrder
    ? { day: Number(fromOrder.deliveryDate.slice(8, 10)), month: Number(fromOrder.deliveryDate.slice(5, 7)), recipientName: fromOrder.recipientName }
    : null;

  return (
    <>
      <FlowHeader back={{ href: "/panel/musteriler", label: "Müşteriler" }} />
      <div className={panel.section}>
        <div className={styles.cardHead}>
          <h1 className={panel.pageTitle}>{customer.name}</h1>
          <div className={styles.contact}>
            <Button variant="secondary" size="s" href={phoneHref(customer.phone)}>
              <Phone size={20} aria-hidden="true" />
              Ara
            </Button>
            {customer.marketingConsent && (
              <Button variant="secondary" size="s" href={whatsappHref(customer.phone)}>
                <WhatsappLogo size={20} aria-hidden="true" />
                WhatsApp
              </Button>
            )}
          </div>
        </div>
        <p className={styles.muted}>{customer.phone}</p>
        <dl className={styles.facts}>
          <div className={styles.fact}>
            <dt>Sipariş</dt>
            <dd>{customer.orderCount}</dd>
          </div>
          <div className={styles.fact}>
            <dt>Toplam harcama</dt>
            <dd>{formatPrice(customer.totalSpent)}</dd>
          </div>
          {first && (
            <div className={styles.fact}>
              <dt>İlk sipariş</dt>
              <dd>{formatDayMonth(zonedNow(new Date(first.createdAt), shop.timeZone).date)} {first.createdAt.slice(0, 4)}</dd>
            </div>
          )}
          <div className={styles.fact}>
            <dt>Mesaj izni</dt>
            <dd>{customer.marketingConsent ? "Var" : "Yok"}</dd>
          </div>
        </dl>

        <h2 className={styles.sectionTitle}>Özel günler</h2>
        <SpecialDays key={fromOrder?.id ?? "kart"} customerId={customer.id} days={specialDays} draft={draft} />

        <h2 className={styles.sectionTitle}>Siparişleri</h2>
        <OrderList>
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              href={`/panel/siparisler/${order.id}`}
              time={formatDayMonth(order.deliveryDate)}
              slot={order.deliveryDate.slice(0, 4)}
              recipient={order.recipientName || "Alıcı kaydı yok"}
              place={order.zoneName}
              items={orderItemsSummary(order)}
              status={orderStatusTag(order)}
              amount={formatPrice(order.total)}
            />
          ))}
        </OrderList>
      </div>
    </>
  );
}
