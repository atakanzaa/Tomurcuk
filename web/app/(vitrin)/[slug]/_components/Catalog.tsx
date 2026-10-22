import Link from "next/link";
import { ProductItem } from "@/components/ui/ProductItem";
import type { Category, Product, Shop } from "@/lib/api/types";
import {
  CatalogFilter,
  catalogFilterLabel,
  catalogQuery,
  productPriceLabel,
  selectProducts,
  type CatalogSelection,
} from "@/lib/catalog";
import { cx } from "@/lib/cx";
import { productPath, shopPath } from "@/lib/routes";
import { Chip } from "./Chip";
import { renderProductPhoto } from "@/components/ProductPhoto";
import container from "./container.module.css";
import styles from "./Catalog.module.css";

interface CatalogProps {
  shop: Shop;
  categories: Category[];
  products: Product[];
  selection: CatalogSelection;
}

const PHOTO_SIZES = "(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw";

/** Ürün listesi ve süzgeçler. Seçim URL'de taşınır: ?kategori=buketler&filtre=vazolu */
export function Catalog({ shop, categories, products, selection }: CatalogProps) {
  const visible = selectProducts(products, selection);
  const href = (change: Partial<CatalogSelection>) => ({
    pathname: shopPath(shop.slug),
    query: catalogQuery(selection, change),
  });

  return (
    <section aria-labelledby="urunler" className={cx(container.container, styles.catalog)}>
      <nav aria-label="Kategoriler" className={styles.categoryChips}>
        <Chip href={href({ category: null })} current={!selection.category}>
          Hepsi
        </Chip>
        {categories.map((category) => (
          <Chip key={category.id} href={href({ category })} current={selection.category?.id === category.id}>
            {category.name}
          </Chip>
        ))}
      </nav>

      <div className={styles.headingRow}>
        <h2 id="urunler" className={styles.heading}>
          {selection.category?.name ?? "Bugün gönderilebilenler"}
        </h2>
        <nav aria-label="Süzgeçler" className={styles.filters}>
          <Chip href={href({ filter: null })} current={!selection.filter}>
            Hepsi
          </Chip>
          {Object.values(CatalogFilter).map((filter) => (
            <Chip key={filter} href={href({ filter })} current={selection.filter === filter}>
              {catalogFilterLabel[filter]}
            </Chip>
          ))}
        </nav>
      </div>

      {visible.length ? (
        <div className={styles.grid}>
          {visible.map((product) => (
            <ProductItem
              key={product.id}
              href={productPath(shop.slug, product.id)}
              name={product.name}
              summary={product.summary}
              price={productPriceLabel(product)}
              photo={renderProductPhoto(product, PHOTO_SIZES)}
            />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>
          Bu seçimde ürün yok.{" "}
          <Link href={shopPath(shop.slug)} scroll={false}>
            Tüm ürünleri görün
          </Link>
        </p>
      )}
    </section>
  );
}
