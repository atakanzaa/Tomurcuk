import Link from "next/link";
import { GiftTag } from "@/components/ui/GiftTag";
import type { Product, Shop } from "@/lib/api/types";
import { productPriceLabel } from "@/lib/catalog";
import { withAblativeSuffix } from "@/lib/format";
import { productPath } from "@/lib/routes";
import { renderProductPhoto } from "@/components/ProductPhoto";
import styles from "./ShopSections.module.css";

interface FavoriteProductProps {
  shop: Shop;
  product: Product;
  /** En çok gönderilen de bu ürünse son üç aydaki sipariş sayısı. */
  sentCount: number | null;
}

/** Dükkânın seçtiği ürün ve çiçekçinin notu; not kart notu etiketinde. */
export function FavoriteProduct({ shop, product, sentCount }: FavoriteProductProps) {
  return (
    <section aria-labelledby="favori" className={styles.favorite}>
      <h2 id="favori" className={styles.heading}>
        Dükkânın favorisi
      </h2>
      <div className={styles.favoriteBody}>
        <Link href={productPath(shop.slug, product.id)} className={styles.favoriteLink}>
          <div className={styles.favoritePhoto}>
            {renderProductPhoto(product, "(min-width: 1024px) 360px, 100vw") ?? (
              <span className={styles.placeholder} aria-hidden="true">
                {product.name}
              </span>
            )}
          </div>
          <span className={styles.favoriteCaption}>
            <span className={styles.favoriteName}>{product.name}</span>
            <span className={styles.favoritePrice}>{productPriceLabel(product)}</span>
          </span>
          {sentCount ? <span className={styles.muted}>Son üç ayda {sentCount} kez gönderildi.</span> : null}
        </Link>
        {shop.favoriteNote && (
          <GiftTag className={styles.note} message={shop.favoriteNote} from={withAblativeSuffix(shop.shortName)} />
        )}
      </div>
    </section>
  );
}
