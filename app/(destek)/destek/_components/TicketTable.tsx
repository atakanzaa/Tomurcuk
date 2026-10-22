import Link from "next/link";
import { StatusTag } from "@/components/ui/StatusTag";
import { TicketPriority, TicketStatus, type TicketSummary } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { formatDayMonth, relativeDayName } from "@/lib/dates";
import { formatShortTimeRange } from "@/lib/format";
import { shortName } from "@/lib/mask";
import { FIRST_RESPONSE_MINUTES, durationText, minutesSince, ticketCategoryLabel, ticketStatusTag } from "@/lib/support";
import styles from "./support.module.css";

export function TicketTable({ tickets, today }: { tickets: TicketSummary[]; today: string }) {
  if (!tickets.length) return <p className={styles.empty}>Bu görünümde talep yok.</p>;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Öncelik</th>
            <th>Talep</th>
            <th>Kategori</th>
            <th>Sipariş</th>
            <th>Durum</th>
            <th>Atanan</th>
            <th>Bekliyor</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => {
            const urgent = t.priority === TicketPriority.Urgent;
            const waited = minutesSince(t.waitingSince);
            const overdue = t.status !== TicketStatus.Resolved && !t.firstResponseAt && waited >= FIRST_RESPONSE_MINUTES[t.priority] / 3;
            const tag = ticketStatusTag[t.status];
            const day = t.orderDate ? relativeDayName(t.orderDate, today) : null;
            return (
              <tr key={t.id}>
                <td className={cx(styles.nowrap, urgent ? styles.urgent : styles.small)}>{urgent ? "Acil" : "Normal"}</td>
                <td>
                  <Link className={styles.subject} href={`/destek/talepler/${t.id}`}>
                    {t.subject}
                  </Link>
                  <span className={styles.sub}>
                    {t.shopName}, {t.shopDistrict}
                  </span>
                </td>
                <td>{ticketCategoryLabel[t.category]}</td>
                <td className={styles.nowrap}>
                  {t.orderNumber ?? <span className={styles.small}>—</span>}
                  {t.orderDate && t.orderSlot && (
                    <span className={styles.sub}>
                      {day === "Bugün" || day === "Yarın" ? day.toLocaleLowerCase("tr") : formatDayMonth(t.orderDate)}{" "}
                      {formatShortTimeRange(t.orderSlot.start, t.orderSlot.end)}
                    </span>
                  )}
                </td>
                <td>
                  <StatusTag tone={tag.tone}>{tag.label}</StatusTag>
                </td>
                <td className={cx(styles.nowrap, !t.assigneeName && styles.small)}>{t.assigneeName ? shortName(t.assigneeName) : "Atanmadı"}</td>
                <td className={cx(styles.nowrap, urgent && overdue && styles.urgent, t.status === TicketStatus.Resolved && styles.small)}>
                  {durationText(waited)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
