import Link from "next/link";
import { documentPath, ShopDocument, shopDocumentShortTitle } from "@/lib/legal/documents";
import { LogoMark } from "@/components/ui/Logo";
import type { Shop } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import container from "./container.module.css";
import styles from "./StoreFooter.module.css";

/** Dükkânın adı ve adresi, sözleşmeler ve Tomurcuk. İletişim ve teslim semtleri "Bize ulaşın"da. */
export function StoreFooter({ shop }: { shop: Shop }) {
  return (
    <footer className={styles.footer}>
      <div className={cx(container.container, styles.columns)}>
        <div className={styles.block}>
          <h2 className={styles.name}>{shop.name}</h2>
          <address className={styles.address}>
            <span className={styles.muted}>{shop.address}</span>
          </address>
        </div>
      </div>
      <nav aria-label="Sözleşmeler" className={cx(container.container, styles.legal)}>
        {Object.values(ShopDocument).map((doc) => (
          <Link key={doc} href={documentPath(shop.slug, doc)}>
            {shopDocumentShortTitle[doc]}
          </Link>
        ))}
      </nav>
      <p className={cx(container.container, styles.credit)}>
        <LogoMark className={styles.creditMark} />
        Tomurcuk ile hazırlandı
      </p>
    </footer>
  );
}
