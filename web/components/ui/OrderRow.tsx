import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { StatusTag, type StatusTone } from "./StatusTag";
import styles from "./OrderRow.module.css";

/** Sipariş satırlarının listesi. Siparişler kart değil, ince çizgiyle ayrılmış satırlardır. */
export function OrderList({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cx("tm-orders", className)}>{children}</ul>;
}

interface OrderRowProps {
  /** Detay sayfasının adresi; satırın tamamı bu bağlantıdır. */
  href: string;
  /** Saat sütunu: "11:40" ya da yalnızca aralık "13–16". */
  time: string;
  /** Saatin altındaki satır: "10–13", "Kesin saat", "20 dk gecikti". */
  slot?: string | null;
  recipient: string;
  place: string;
  items: string;
  status: { tone: StatusTone; label: string };
  amount: string;
  /** Geciken sipariş: saat kırmızı yazılır. Kelimeyle de söylenmeli ("20 dk gecikti"). */
  late?: boolean;
  /** Açık olan sipariş; masaüstünde sağdaki detay bu satırı gösterir. */
  selected?: boolean;
}

/** Satıcı panelinde bir siparişin tek satırlık özeti. */
export function OrderRow({ href, time, slot, recipient, place, items, status, amount, late, selected }: OrderRowProps) {
  return (
    <li className={cx("tm-order", late && "tm-order--late", selected && "tm-order--selected", styles.row)}>
      <div>
        <span className="tm-order__time">{time}</span>
        {slot && <span className={cx("tm-order__slot", styles.slot)}>{slot}</span>}
      </div>
      <div>
        <Link href={href} className={cx("tm-order__who", styles.link)} aria-current={selected ? "true" : undefined}>
          {recipient}
        </Link>
        <div className="tm-order__where">{place}</div>
        <div className="tm-order__items">{items}</div>
      </div>
      <div className="tm-order__side">
        <StatusTag tone={status.tone}>{status.label}</StatusTag>
        <span className="tm-order__amount">{amount}</span>
      </div>
    </li>
  );
}
