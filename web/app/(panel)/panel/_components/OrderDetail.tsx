import { CaretLeft, MapPin, Phone, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { GiftTag } from "@/components/ui/GiftTag";
import { renderPhoto } from "@/components/ProductPhoto";
import { StatusTag } from "@/components/ui/StatusTag";
import { OptionKind, OrderStatus, PaymentStatus, type CustomerDetail, type Order, type ShopRole } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { formatDayMonth, relativeDayName } from "@/lib/dates";
import { formatPrice, formatTimeRange, phoneHref, whatsappHref, zonedNow } from "@/lib/format";
import { orderSourceLabel, orderStatusTag, paymentLabel } from "@/lib/order";
import { Permission, shopCan } from "@/lib/permissions";
import { DeliveryPhotoButton } from "./DeliveryPhotoButton";
import { OrderActions, OrderMenu } from "./OrderControls";
import styles from "./order.module.css";

interface OrderDetailProps {
  order: Order;
  customer: CustomerDetail | null;
  today: string;
  timeZone: string;
  role: ShopRole;
  /** Masaüstünde listenin yanında kutu olarak; mobilde tam ekran. */
  backHref: string;
  backLabel: string;
}

/** "Bugün, 13:00–16:00", "Yarın, 14:00", "24 Ekim, 10:00–13:00" */
function whenTitle(order: Order, today: string) {
  const day = relativeDayName(order.deliveryDate, today);
  const dayText = ["Bugün", "Yarın", "Dün"].includes(day) ? day : formatDayMonth(order.deliveryDate);
  return `${dayText}, ${order.exactTime && order.deliveryTime ? order.deliveryTime : formatTimeRange(order.slotStart, order.slotEnd)}`;
}

function itemLines(order: Order) {
  return order.items.flatMap((item) => {
    const size = item.options.find((o) => o.kind === OptionKind.Size);
    const extras = item.options.filter((o) => o.kind !== OptionKind.Size);
    const qty = item.quantity > 1 ? `${item.quantity} × ` : "";
    return [
      {
        key: item.id,
        label: `${qty}${item.productName}${size ? `, ${size.name.toLocaleLowerCase("tr")}` : ""}`,
        amount: (item.unitPrice + (size?.extraPrice ?? 0)) * item.quantity,
      },
      ...extras.map((o) => ({ key: `${item.id}-${o.name}`, label: o.name, amount: o.extraPrice * item.quantity })),
    ];
  });
}

export function OrderDetail({ order, customer, today, timeZone, role, backHref, backLabel }: OrderDetailProps) {
  const tag = orderStatusTag(order);
  const created = zonedNow(new Date(order.createdAt), timeZone);
  const createdDay = relativeDayName(created.date, today);
  const createdText = ["Bugün", "Dün"].includes(createdDay) ? createdDay.toLocaleLowerCase("tr") : formatDayMonth(created.date);
  const orderIndex = customer ? [...customer.orders].reverse().findIndex((o) => o.id === order.id) + 1 : 0;
  const paid = order.paymentStatus === PaymentStatus.Paid;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.address}, ${order.zoneName}`)}`;
  const ref = { id: order.id, status: order.status, paymentStatus: order.paymentStatus, paymentMethod: order.paymentMethod };

  return (
    <article className={styles.detail} aria-labelledby={`baslik-${order.id}`}>
      <header className={styles.detailBar}>
        <Link href={backHref} className={styles.back}>
          <CaretLeft size={20} aria-hidden="true" />
          {backLabel}
        </Link>
        <div className={styles.barSide}>
          <span className={styles.number}>{order.number}</span>
          <OrderMenu order={ref} canCancel={shopCan(role, Permission.OrderCancel)} />
        </div>
      </header>

      <div className={styles.body}>
        <section className={styles.top}>
          <div className={styles.meta}>
            <StatusTag tone={tag.tone}>{tag.label}</StatusTag>
            <span className={styles.metaText}>
              {orderSourceLabel[order.source]}, {createdText} {created.time}
            </span>
          </div>
          <h1 id={`baslik-${order.id}`} className={styles.title}>
            {whenTitle(order, today)}
          </h1>
          {order.exactTime && <span className={styles.metaText}>Kesin saat istendi.</span>}
        </section>

        {!paid && order.paymentMethod !== "card" && (
          <p className={styles.warning}>
            Ödeme alınmadı: {paymentLabel(order).toLocaleLowerCase("tr")}. Para gelince &ldquo;Ödendi olarak işaretle&rdquo;yi seçin.
          </p>
        )}

        <section aria-label="Alıcı" className={styles.block}>
          <div className={styles.row}>
            <div className={styles.kv}>
              <span className={styles.label}>Alıcı</span>
              <span className={styles.strong}>{order.recipientName}</span>
              {order.recipientPhone && <span className={styles.value}>{order.recipientPhone}</span>}
            </div>
            {order.recipientPhone && (
              <div className={styles.contactButtons}>
                <a href={phoneHref(order.recipientPhone)} className={styles.iconButton} aria-label="Alıcıyı ara">
                  <Phone size={20} aria-hidden="true" />
                </a>
                <a href={whatsappHref(order.recipientPhone)} className={styles.iconButton} aria-label="Alıcıya WhatsApp'tan yaz">
                  <WhatsappLogo size={20} aria-hidden="true" />
                </a>
              </div>
            )}
          </div>
          <div className={styles.row}>
            <div className={styles.kv}>
              {order.address && <span className={styles.value}>{order.address}</span>}
              <span className={styles.muted}>{order.zoneName}</span>
            </div>
            <a href={mapsHref} className={styles.textLink} target="_blank" rel="noreferrer">
              <MapPin size={16} aria-hidden="true" /> Yol tarifi
            </a>
          </div>
          {order.courierNote && <p className={styles.note}>Kurye notu: {order.courierNote.charAt(0).toLocaleLowerCase("tr") + order.courierNote.slice(1)}</p>}
        </section>

        <section aria-label="Ürünler" className={styles.block}>
          {itemLines(order).map((line) => (
            <div key={line.key} className={styles.line}>
              <span>{line.label}</span>
              <span className={styles.amount}>{formatPrice(line.amount)}</span>
            </div>
          ))}
          {order.deliveryFee > 0 && (
            <div className={cx(styles.line, styles.muted)}>
              <span>Teslimat</span>
              <span className={styles.amount}>{formatPrice(order.deliveryFee)}</span>
            </div>
          )}
          <div className={styles.totalLine}>
            <span className={styles.total}>{formatPrice(order.total)}</span>
            <StatusTag tone={paid ? "delivered" : "muted"}>{paymentLabel(order)}</StatusTag>
          </div>
        </section>

        {order.cardNote && (
          <section aria-label="Kart notu" className={styles.block}>
            <span className={styles.label}>Karta yazılacak</span>
            <GiftTag className={styles.tag} message={order.cardNote} from={order.senderName} anonymous={order.anonymous} />
          </section>
        )}

        {(order.status === OrderStatus.OnWay || order.status === OrderStatus.Delivered) && (
          <section aria-label="Teslim fotoğrafı" className={styles.block}>
            <span className={styles.label}>Teslim fotoğrafı</span>
            {order.deliveryPhotoUrl ? (
              <div className={styles.deliveryPhoto}>{renderPhoto(order.deliveryPhotoUrl, "(min-width: 1024px) 400px, 100vw")}</div>
            ) : (
              <span className={styles.small}>Teslim ederken çekin; gönderen takip sayfasında görür.</span>
            )}
            <div>
              <DeliveryPhotoButton orderId={order.id} hasPhoto={Boolean(order.deliveryPhotoUrl)} />
            </div>
          </section>
        )}

        {customer && (
          <section aria-label="Gönderen" className={cx(styles.block, styles.row)}>
            <div className={styles.kv}>
              <span className={styles.label}>Gönderen</span>
              <span className={styles.value}>
                {customer.customer.name}, {customer.customer.phone}
              </span>
              <span className={styles.small}>
                {orderIndex > 1 ? `Bu, ${orderIndex}. siparişi` : "İlk siparişi"}
                {order.anonymous ? ". İsimsiz gönderim: alıcıya adı söylenmez." : ""}
              </span>
            </div>
            <Link href={`/panel/musteriler/${customer.customer.id}`} className={styles.textLink}>
              Müşteri kartı
            </Link>
          </section>
        )}
      </div>

      <OrderActions order={ref} />
    </article>
  );
}
