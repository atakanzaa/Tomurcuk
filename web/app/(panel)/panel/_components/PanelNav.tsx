"use client";

import { DotsThree, ListBullets, Sun, UsersThree } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import styles from "./panel.module.css";

interface PanelNavProps {
  shopName: string;
  shopShortName: string;
  shopSlug: string;
  todayCount: number;
  reminderCount: number;
}

const isActive = (pathname: string, href: string) =>
  href === "/panel" ? pathname === "/panel" || pathname.startsWith("/panel/siparisler/") && !pathname.endsWith("/yeni") : pathname.startsWith(href);

/** Masaüstünde kenar menü. */
export function PanelSidebar({ shopName, shopShortName, shopSlug, todayCount, reminderCount }: PanelNavProps) {
  const pathname = usePathname();
  const current = (href: string) => (isActive(pathname, href) ? "page" : undefined);
  const rest = shopName.replace(shopShortName, "").trim();
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandName}>{shopShortName}</span>
        {rest && <span className={styles.brandRest}>{rest}</span>}
      </div>
      <nav aria-label="Ana menü" className={styles.sideNav}>
        <Link className={styles.navLink} href="/panel" aria-current={current("/panel")}>
          <span>Bugün</span>
          <span className={styles.navCount}>{todayCount}</span>
        </Link>
        <Link className={styles.navLink} href="/panel/siparisler" aria-current={pathname === "/panel/siparisler" ? "page" : undefined}>
          <span>Siparişler</span>
        </Link>
        <Link className={styles.navLink} href="/panel/musteriler/ozel-gunler" aria-current={current("/panel/musteriler")}>
          <span>Müşteriler</span>
          {reminderCount > 0 && <span className={styles.navReminder}>{reminderCount} özel gün</span>}
        </Link>
        <Link className={styles.navLink} href="/panel/urunler" aria-current={current("/panel/urunler")}>
          <span>Ürünler</span>
        </Link>
        <Link className={styles.navLink} href="/panel/teslimat" aria-current={current("/panel/teslimat")}>
          <span>Teslimat ayarları</span>
        </Link>
        <Link className={styles.navLink} href={`/${shopSlug}`}>
          <span>Dükkân sayfası</span>
        </Link>
      </nav>
      <Button href="/panel/siparisler/yeni" className={styles.addButton}>
        Sipariş ekle
      </Button>
      <Link className={`${styles.navLink} ${styles.navQuiet}`} href="/panel/yardim" aria-current={current("/panel/yardim")}>
        <span>Yardım ve destek</span>
      </Link>
      <Logo className={styles.sideLogo} />
    </aside>
  );
}

/** Telefonda alt menü: tek elle ulaşılır. */
export function PanelTabBar() {
  const pathname = usePathname();
  const items = [
    { href: "/panel", label: "Bugün", icon: Sun, active: isActive(pathname, "/panel") },
    { href: "/panel/siparisler", label: "Siparişler", icon: ListBullets, active: pathname === "/panel/siparisler" },
    { href: "/panel/musteriler/ozel-gunler", label: "Müşteriler", icon: UsersThree, active: pathname.startsWith("/panel/musteriler") },
    {
      href: "/panel/diger",
      label: "Diğer",
      icon: DotsThree,
      active: ["/panel/diger", "/panel/urunler", "/panel/teslimat", "/panel/yardim"].some((p) => pathname.startsWith(p)),
    },
  ];
  return (
    <nav aria-label="Ana menü" className={styles.tabBar}>
      {items.map(({ href, label, icon: Icon, active }) => (
        <Link key={href} href={href} className={styles.tab} aria-current={active ? "page" : undefined}>
          <Icon size={24} aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
