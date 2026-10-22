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
  /** Satıcı panelinde telefonun alt menüsünün üstünde durur. */
  aboveTabBar?: boolean;
}

export function ActionBar({ total, action, caption, inlineOnDesktop, aboveTabBar }: ActionBarProps) {
  return (
    <div className={cx(styles.bar, inlineOnDesktop && styles.inlineOnDesktop, aboveTabBar && styles.aboveTabBar)}>
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
