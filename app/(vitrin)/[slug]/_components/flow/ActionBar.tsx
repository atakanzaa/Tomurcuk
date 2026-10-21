import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./ActionBar.module.css";

interface ActionBarProps {
  /** Biçimlenmiş toplam: "1.320 TL". Verilmezse yalnızca eylem gösterilir. */
  total?: string;
  /** Birincil eylem (genellikle formun gönder butonu). */
  action: ReactNode;
  /** Butonun altındaki kısa not. */
  caption?: ReactNode;
  inlineOnDesktop?: boolean;
}

export function ActionBar({ total, action, caption, inlineOnDesktop }: ActionBarProps) {
  return (
    <div className={cx(styles.bar, inlineOnDesktop && styles.inlineOnDesktop)}>
      <div className={cx(styles.inner, caption ? styles.stacked : undefined)}>
        {total && (
          <div className={styles.total} aria-live="polite">
            <span className={styles.totalLabel}>Toplam</span>
            <span className={styles.totalAmount}>{total}</span>
          </div>
        )}
        <div className={styles.action}>{action}</div>
        {caption && <span className={styles.caption}>{caption}</span>}
      </div>
    </div>
  );
}
