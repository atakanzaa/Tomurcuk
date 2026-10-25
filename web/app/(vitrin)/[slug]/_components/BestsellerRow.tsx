import Link from "next/link";
import type { Product, Shop } from "@/lib/api/types";
import { productPriceLabel } from "@/lib/catalog";
import { productPath } from "@/lib/routes";
import { renderProductPhoto } from "@/components/ProductPhoto";
import styles from "./ShopSections.module.css";

/** Son üç ayda en çok teslim edilen ürün; tek satır. */
export function BestsellerRow({ shop, product, orders }: { shop: Shop; product: Product; orders: number }) {
  return (
    <section aria-labelledby="cok-gonderilen" className={styles.block}>
      <h2 id="cok-gonderilen" className={styles.heading}>
        En çok gönderilen
      </h2>
      <Link href={productPath(shop.slug, product.id)} className={styles.bestseller}>
        <div className={styles.bestsellerPhoto}>
          {renderProductPhoto(product, "112px") ?? (
            <span className={styles.placeholder} aria-hidden="true">
              {product.name}
            </span>
          )}
        </div>
        <span className={styles.bestsellerText}>
          <span className={styles.bestsellerName}>{product.name}</span>
          <span className={styles.muted}>Son üç ayda {orders} kez gönderildi.</span>
          <span className={styles.bestsellerPrice}>{productPriceLabel(product)}</span>
        </span>
      </Link>
    </section>
  );
}
