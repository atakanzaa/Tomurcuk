import type { Metadata } from "next";
import { Suspense } from "react";
import { GiftTag } from "@/components/ui/GiftTag";
import { getOrder, getOrders } from "@/lib/api";
import { OrderStatus, type Order } from "@/lib/api/types";
import { formatLongDate } from "@/lib/dates";
import { formatPrice, formatTimeRange } from "@/lib/format";
import { orderItemsSummary, paymentLabel } from "@/lib/order";
import { dayRange, panelSession, parseDayView } from "../_lib";
import { PrintOnLoad } from "./PrintOnLoad";
import styles from "./receipt.module.css";

export const metadata: Metadata = { title: "Fişler" };

export default function ReceiptsPage({ searchParams }: PageProps<"/panel/fisler">) {
  return (
    <Suspense>
      <Receipts searchParams={searchParams} />
    </Suspense>
  );
}

async function Receipts({ searchParams }: Pick<PageProps<"/panel/fisler">, "searchParams">) {
  const [{ shop }, query] = await Promise.all([panelSession(), searchParams]);
  let orders: Order[];
  let title: string;
  if (typeof query.siparis === "string") {
    const order = await getOrder(shop.id, query.siparis);
    orders = order ? [order] : [];
    title = order ? `Fiş ${order.number}` : "Fiş bulunamadı";
  } else {
    const { from, to } = dayRange(parseDayView(query.gun), shop.timeZone);
    orders = (await getOrders(shop.id, { from, to })).filter((o) => o.status !== OrderStatus.Cancelled && o.status !== OrderStatus.Delivered);
    title = `${orders.length} fiş`;
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>{title}</h1>
        {orders.length > 0 && <PrintOnLoad />}
      </div>
      {orders.map((order) => (
        <section key={order.id} className={styles.receipt} aria-label={`Fiş ${order.number}`}>
          <div className={styles.receiptHead}>
            <span>{shop.name}</span>
            <span>{order.number}</span>
          </div>
          <h2 className={styles.when}>
            {formatLongDate(order.deliveryDate)}, {order.exactTime && order.deliveryTime ? order.deliveryTime : formatTimeRange(order.slotStart, order.slotEnd)}
          </h2>
          <dl className={styles.dl}>
            <dt>Alıcı</dt>
            <dd>
              {order.recipientName}, {order.recipientPhone}
            </dd>
            <dt>Adres</dt>
            <dd>{[order.address, order.zoneName].filter(Boolean).join(", ")}</dd>
            {order.courierNote && (
              <>
                <dt>Kurye notu</dt>
                <dd>{order.courierNote}</dd>
              </>
            )}
            <dt>Ürünler</dt>
            <dd>{orderItemsSummary(order)}</dd>
            <dt>Tutar</dt>
            <dd>
              {formatPrice(order.total)}, {paymentLabel(order).toLocaleLowerCase("tr")}
            </dd>
          </dl>
          {order.cardNote && <GiftTag className={styles.tag} message={order.cardNote} from={order.senderName} anonymous={order.anonymous} />}
        </section>
      ))}
    </div>
  );
}
