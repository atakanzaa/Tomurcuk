import Link from "next/link";
import panel from "../_components/panel.module.css";

export function CustomerTabs({ current, customerCount, reminderCount }: { current: "all" | "days"; customerCount: number; reminderCount: number }) {
  return (
    <nav aria-label="Müşteri görünümü" className={panel.tabs}>
      <Link href="/panel/musteriler" className={panel.tabLink} aria-current={current === "all" ? "page" : undefined}>
        Tüm müşteriler <span className={panel.tabCount}>{customerCount}</span>
      </Link>
      <Link href="/panel/musteriler/ozel-gunler" className={panel.tabLink} aria-current={current === "days" ? "page" : undefined}>
        Özel günler <span className={panel.tabCount}>{reminderCount ? `${reminderCount}, 7 gün` : "7 gün"}</span>
      </Link>
    </nav>
  );
}
