import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";
import styles from "./Chip.module.css";

interface ChipProps {
  href: LinkProps["href"];
  current: boolean;
  children: ReactNode;
}

/** Kategori ve süzgeç çipi. Süzmek sayfayı başa kaydırmaz. */
export function Chip({ href, current, children }: ChipProps) {
  return (
    <Link href={href} scroll={false} className={styles.chip} aria-current={current ? "true" : undefined}>
      {children}
    </Link>
  );
}
