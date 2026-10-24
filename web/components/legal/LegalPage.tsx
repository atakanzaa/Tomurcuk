import Link from "next/link";
import type { ReactNode } from "react";
import { formatDayMonth } from "@/lib/dates";
import styles from "./legal.module.css";

interface LegalPageProps {
  title: string;
  /** Yürürlük tarihi (YYYY-MM-DD) ya da sipariş bilgisi gibi kısa not. */
  meta: string;
  /** Altta "Diğer metinler" bağlantıları. */
  others?: { href: string; label: string }[];
  children: ReactNode;
}

/** Sözleşme ve aydınlatma metinlerinin ortak düzeni; başlık çubuğu sayfanın kendisinde. */
export function LegalPage({ title, meta, others = [], children }: LegalPageProps) {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.meta}>{meta}</p>
      <div className={styles.body}>{children}</div>
      {others.length > 0 && (
        <nav aria-label="Diğer metinler" className={styles.others}>
          <h2 className={styles.othersTitle}>Diğer metinler</h2>
          <ul className={styles.othersList}>
            {others.map((o) => (
              <li key={o.href}>
                <Link href={o.href}>{o.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </main>
  );
}

/** "Yürürlük tarihi: 24 Ekim 2026" */
export const effectiveDate = (date: string) => `Yürürlük tarihi: ${formatDayMonth(date)} ${date.slice(0, 4)}`;
