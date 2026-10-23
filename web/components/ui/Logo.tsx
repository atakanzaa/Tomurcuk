import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Logo.module.css";

interface LogoMarkProps {
  className?: string;
}

/**
 * Sap üstünde bir tomurcuk; favicon (app/icon.svg) ile aynı çizim. Renkler temadan gelir:
 * zemin kraft, sap stem, tomurcuk peony. Başka bir zeminde --mark-bg, --mark-stem, --mark-bud ile değişir.
 */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg className={cx(styles.mark, className)} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect className={styles.markBg} width="32" height="32" rx="7" />
      <rect className={styles.markStem} x="15" y="15" width="2.5" height="13" />
      <rect className={styles.markBud} x="11" y="5" width="10.5" height="14" rx="5.25" />
    </svg>
  );
}

interface LogoProps {
  /** Verilirse logo bu adrese giden bağlantıdır. */
  href?: string;
  /** Adın yanında sans ailede ikincil not ("Destek", "çiçekçiler için"). */
  note?: ReactNode;
  className?: string;
}

/** İşaret ve "Tomurcuk" adı. Boyut kapsayıcının yazı boyutundan gelir; işaret adla birlikte büyür. */
export function Logo({ href, note, className }: LogoProps) {
  const content = (
    <>
      <LogoMark />
      <span>Tomurcuk</span>
      {note && <span className={styles.note}>{note}</span>}
    </>
  );
  return href ? (
    <Link href={href} className={cx(styles.logo, className)}>
      {content}
    </Link>
  ) : (
    <span className={cx(styles.logo, className)}>{content}</span>
  );
}
