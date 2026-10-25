import Link from "next/link";
import { StarMark } from "@/components/ui/Stars";
import type { Product, Rating, Shop } from "@/lib/api/types";
import { productPriceLabel } from "@/lib/catalog";
import { formatRating } from "@/lib/reviews";
import { productPath } from "@/lib/routes";
import { renderProductPhoto } from "@/components/ProductPhoto";
import styles from "./ShopSections.module.css";

/** Son üç ayda en çok teslim edilen ürün; tek satır. */
interface BestsellerRowProps {
  shop: Shop;
  product: Product;
  orders: number;
  /** Ürünün yorumu yoksa yok. */
  rating?: Rating;
}

export function BestsellerRow({ shop, product, orders, rating }: BestsellerRowProps) {
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
          {rating && (
            <span className={styles.bestsellerRating}>
              <StarMark size={14} />
              {formatRating(rating.average)} <span className={styles.muted}>({rating.count} yorum)</span>
            </span>
          )}
          <span className={styles.bestsellerPrice}>{productPriceLabel(product)}</span>
        </span>
      </Link>
    </section>
  );
}
