import Link from "next/link";
import type { ReactNode } from "react";
import type { Category, Shop } from "@/lib/api/types";
import { catalogQuery, type CatalogSelection } from "@/lib/catalog";
import { cx } from "@/lib/cx";
import { shopPath, trackingPath } from "@/lib/routes";
import container from "./container.module.css";
import styles from "./StoreHeader.module.css";

interface StoreHeaderProps {
  shop: Shop;
  /** Masaüstündeki kategori menüsü; seçim URL'den okunduğu için ayrı akar. */
  categoryNav: ReactNode;
}

export function StoreHeader({ shop, categoryNav }: StoreHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={cx(container.container, styles.bar)}>
        <Link href={shopPath(shop.slug)} className={styles.brand}>
          {shop.shortName}
        </Link>
        {categoryNav}
        <div className={styles.actions}>
          <Link href={trackingPath(shop.slug)} className={styles.track}>
            Siparişim nerede?
          </Link>
          <span className={styles.phone}>{shop.phone}</span>
        </div>
      </div>
    </header>
  );
}

interface HeaderCategoriesProps {
  shop: Shop;
  categories: Category[];
  selection: CatalogSelection;
}

/** Masaüstü başlığındaki kategori bağlantıları; mobilde katalog üstündeki çipler bu işi yapar. */
export function HeaderCategories({ shop, categories, selection }: HeaderCategoriesProps) {
  return (
    <nav aria-label="Kategoriler" className={styles.categories}>
      <ul className={styles.categoryList}>
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={{ pathname: shopPath(shop.slug), query: catalogQuery(selection, { category }) }}
              scroll={false}
              aria-current={selection.category?.id === category.id ? "page" : undefined}
            >
              {category.name}
            </Link>
          </li>
        ))}
        {shop.story.trim() && (
          <li>
            <a href="#hikayemiz">Hikâyemiz</a>
          </li>
        )}
      </ul>
    </nav>
  );
}
