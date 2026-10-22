import { StatusTag } from "@/components/ui/StatusTag";
import type { SupportOrderView } from "@/lib/api/types";
import { formatDayMonth, relativeDayName } from "@/lib/dates";
import { formatPrice, formatShortTimeRange } from "@/lib/format";
import { orderStatusLabel, orderStatusTone } from "@/lib/order";
import styles from "./support.module.css";

/** Destek ekibinin sipariş tablosu: kişisel veri maskeli. */
export function OrderTable({ orders, today }: { orders: (SupportOrderView & { shopName: string })[]; today: string }) {
  if (!orders.length) return <p className={styles.empty}>Eşleşen sipariş yok.</p>;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Sipariş</th>
            <th>Dükkân</th>
            <th>Teslim</th>
            <th>Alıcı</th>
            <th>Gönderen</th>
            <th>Tutar</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const day = relativeDayName(o.deliveryDate, today);
            return (
              <tr key={o.id}>
                <td className={styles.nowrap}>{o.number}</td>
                <td>{o.shopName}</td>
                <td className={styles.nowrap}>
                  {["Bugün", "Yarın", "Dün"].includes(day) ? day : formatDayMonth(o.deliveryDate)} {formatShortTimeRange(o.slotStart, o.slotEnd)}
                </td>
                <td>
                  {o.recipientName}
                  <span className={styles.sub}>{o.recipientPhone}</span>
                </td>
                <td>
                  {o.senderName}
                  <span className={styles.sub}>{o.senderPhone}</span>
                </td>
                <td className={styles.nowrap}>{formatPrice(o.total)}</td>
                <td>
                  <StatusTag tone={orderStatusTone[o.status]}>{orderStatusLabel[o.status]}</StatusTag>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
