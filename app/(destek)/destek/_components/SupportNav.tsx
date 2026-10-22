"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./support.module.css";

const ITEMS = [
  { href: "/destek", label: "Talepler", key: "tickets" },
  { href: "/destek/dukkanlar", label: "Dükkânlar", key: "shops" },
  { href: "/destek/siparisler", label: "Siparişler", key: "orders" },
  { href: "/destek/denetim", label: "Denetim kaydı", key: "audit" },
  { href: "/destek/hazir-cevaplar", label: "Hazır cevaplar", key: "canned" },
] as const;

export function SupportNav({ counts }: { counts: Partial<Record<(typeof ITEMS)[number]["key"], number>> }) {
  const pathname = usePathname();
  const active = (href: string) =>
    href === "/destek" ? pathname === "/destek" || pathname.startsWith("/destek/talepler") : pathname.startsWith(href);
  return (
    <nav aria-label="Destek menüsü" className={styles.nav}>
      {ITEMS.map((item) => (
        <Link key={item.href} href={item.href} className={styles.navLink} aria-current={active(item.href) ? "page" : undefined}>
          <span>{item.label}</span>
          {counts[item.key] !== undefined && <span className={styles.navCount}>{counts[item.key]}</span>}
        </Link>
      ))}
    </nav>
  );
}
