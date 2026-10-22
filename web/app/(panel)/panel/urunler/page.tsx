import type { Metadata } from "next";
import { Suspense } from "react";
import { StatusTag } from "@/components/ui/StatusTag";
import { getCategories, getProducts } from "@/lib/api";
import { productPriceLabel } from "@/lib/catalog";
import { renderProductPhoto } from "@/components/ProductPhoto";
import panel from "../_components/panel.module.css";
import styles from "../_components/simple.module.css";
import { panelSession } from "../_lib";

export const metadata: Metadata = { title: "Ürünler" };

export default function ProductsPage() {
  return (
    <Suspense>
      <Products />
    </Suspense>
  );
}

async function Products() {
  const { shop } = await panelSession();
  const [products, categories] = await Promise.all([getProducts(shop.id), getCategories(shop.id)]);
  return (
    <>
      <header className={panel.pageHead}>
        <div className={panel.pageHeadText}>
          <span className={panel.eyebrow}>{products.length} ürün vitrinde</span>
          <h1 className={panel.pageTitle}>Ürünler</h1>
        </div>
      </header>
      <div className={panel.section}>
        {categories.map((category) => {
          const items = products.filter((p) => p.categoryId === category.id);
          if (!items.length) return null;
          return (
            <section key={category.id} aria-labelledby={`kategori-${category.id}`}>
              <h2 id={`kategori-${category.id}`} className={styles.title}>
                {category.name}
              </h2>
              <ul className={styles.list}>
                {items.map((p) => (
                  <li key={p.id} className={styles.row}>
                    <span className={styles.thumb}>{renderProductPhoto(p, "48px")}</span>
                    <span className={`${styles.rowText} ${styles.grow}`}>
                      <span className={styles.strong}>{p.name}</span>
                      <span className={styles.muted}>
                        {p.summary}
                        {p.options.length > 0 && `, ${p.options.length} seçenek`}
                      </span>
                    </span>
                    <span className={styles.side}>
                      {productPriceLabel(p)}
                      <StatusTag tone={p.active ? "delivered" : "muted"}>{p.active ? "Satışta" : "Satışta değil"}</StatusTag>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
