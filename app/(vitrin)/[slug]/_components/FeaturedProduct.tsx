import Link from "next/link";
import type { Product } from "@/lib/api/types";
import { productPriceLabel } from "@/lib/catalog";
import { productPath } from "@/lib/routes";
import { renderProductPhoto } from "./ProductPhoto";
import styles from "./FeaturedProduct.module.css";

export function FeaturedProduct({ shopSlug, product }: { shopSlug: string; product: Product }) {
  return (
    <Link href={productPath(shopSlug, product.id)} className={styles.featured}>
      <div className={styles.photo}>
        {renderProductPhoto(product, "(min-width: 1024px) 600px, 100vw")}
      </div>
      <div className={styles.caption}>
        <h2 className={styles.name}>{product.name}</h2>
        <span className={styles.price}>{productPriceLabel(product)}</span>
      </div>
      <p className={styles.summary}>{product.summary}</p>
    </Link>
  );
}
