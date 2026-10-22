import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./ProductItem.module.css";

interface ProductItemProps {
  href: string;
  name: string;
  /** Kısa bilgi: dal sayısı, "Aynı gün" gibi. */
  summary: string;
  /** Biçimlenmiş fiyat: "980 TL", seçenekli üründe "850 TL'den". */
  price: string;
  /** Dükkânın kendi fotoğrafı (4:5). Yoksa kraft zemin üzerinde ürün adı gösterilir. */
  photo?: ReactNode;
  className?: string;
}

/** Vitrinde bir ürün: fotoğraf, ad, kısa bilgi ve fiyat. Kutusuz ve kenarlıksız. */
export function ProductItem({ href, name, summary, price, photo, className }: ProductItemProps) {
  return (
    <Link href={href} className={cx("tm-product", className)}>
      <div className={cx("tm-product__photo", styles.photo)}>
        {photo ?? (
          <span className={styles.placeholder} aria-hidden="true">
            {name}
          </span>
        )}
      </div>
      <h3 className="tm-product__name">{name}</h3>
      <div className="tm-product__meta">
        <span>{summary}</span>
        <span className="tm-product__price">{price}</span>
      </div>
    </Link>
  );
}
