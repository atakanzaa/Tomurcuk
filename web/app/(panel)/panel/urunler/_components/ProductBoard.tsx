import { Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { renderPhoto } from "@/components/ProductPhoto";
import { Button } from "@/components/ui/Button";
import { StatusTag } from "@/components/ui/StatusTag";
import { getCategories, getPanelProducts } from "@/lib/api";
import type { PanelProduct, PanelSession } from "@/lib/api/types";
import { productPriceLabel } from "@/lib/catalog";
import { cx } from "@/lib/cx";
import { relativeDayName, formatDayMonth } from "@/lib/dates";
import { zonedNow } from "@/lib/format";
import { Permission, shopCan } from "@/lib/permissions";
import {
  ProductStatusFilter,
  productFormValues,
  productListMeta,
  productPriceMeta,
} from "@/lib/panel/products";
import { productPath } from "@/lib/routes";
import panel from "../../_components/panel.module.css";
import { Toast } from "../../_components/Toast";
import { ProductForm } from "./ProductForm";
import styles from "./products.module.css";

interface ProductBoardProps {
  session: PanelSession;
  filter: ProductStatusFilter;
  query: string;
  /** Seçili ürün ya da yeni ürün formu: telefonda tam ekran, masaüstünde listenin yanında. */
  selected: PanelProduct | "new" | null;
  justCreated?: boolean;
  notice?: string;
}

const TR = "tr-TR";

const filterLabel: Record<ProductStatusFilter, string> = {
  [ProductStatusFilter.All]: "Tümü",
  [ProductStatusFilter.OnSale]: "Satışta",
  [ProductStatusFilter.OffSale]: "Satışta değil",
};

function lastChangeText(updatedAt: string | null, updatedBy: string | null, timeZone: string): string | null {
  if (!updatedAt) return null;
  const today = zonedNow(new Date(), timeZone).date;
  const at = zonedNow(new Date(updatedAt), timeZone);
  const name = relativeDayName(at.date, today);
  const day = name === "Bugün" || name === "Dün" ? name.toLocaleLowerCase(TR) : formatDayMonth(at.date);
  return `Son değişiklik: ${day} ${at.time}${updatedBy ? `, ${updatedBy}` : ""}`;
}

export async function ProductBoard({ session, filter, query, selected, justCreated = false, notice }: ProductBoardProps) {
  const { shop, user } = session;
  const canEdit = shopCan(user.role, Permission.CatalogEdit);
  const [all, categories] = await Promise.all([getPanelProducts(shop.id), getCategories(shop.id)]);
  const onSale = all.filter((p) => p.product.active).length;
  const needle = query.toLocaleLowerCase(TR);
  const shown = all.filter(
    ({ product }) =>
      (filter === ProductStatusFilter.All || product.active === (filter === ProductStatusFilter.OnSale)) &&
      (!needle || product.name.toLocaleLowerCase(TR).includes(needle)),
  );
  const selectedId = selected && selected !== "new" ? selected.product.id : null;
  const listQuery = new URLSearchParams({ ...(filter && { durum: filter }), ...(query && { ara: query }) }).toString();
  const href = (path: string) => (listQuery ? `${path}?${listQuery}` : path);
  // Kategorisi silinmiş ürün kalmasın diye listede olmayan kategoriler sona eklenir.
  const groups = [
    ...categories.map((c) => ({ id: c.id, name: c.name })),
    ...[...new Set(all.map((p) => p.product.categoryId))]
      .filter((id) => !categories.some((c) => c.id === id))
      .map((id) => ({ id, name: "Diğer" })),
  ];
  const Title = selected ? "p" : "h1";

  return (
    <div className={styles.board} data-selected={Boolean(selected)}>
      <header className={cx(panel.pageHead, styles.boardHead)}>
        <div className={panel.pageHeadText}>
          <span className={panel.eyebrow}>
            {all.length} ürün, {onSale === all.length ? "hepsi vitrinde" : `${onSale}'i vitrinde`}
          </span>
          <Title className={panel.pageTitle}>Ürünler</Title>
        </div>
        <Link href={`/${shop.slug}`} className={styles.showcaseMobile}>
          Vitrini aç
        </Link>
        <form action="/panel/urunler" role="search" className={styles.searchDesktop}>
          {filter && <input type="hidden" name="durum" value={filter} />}
          <label>
            <span className="visually-hidden">Ürün ara</span>
            <input className="tm-field__control" name="ara" defaultValue={query} placeholder="Ürün adı" />
          </label>
          {canEdit && (
            <Button href="/panel/urunler/yeni" className={styles.addDesktop}>
              Ürün ekle
            </Button>
          )}
        </form>
      </header>

      <div className={styles.columns}>
        <section aria-label="Ürün listesi" className={styles.list}>
          <div role="group" aria-label="Süz" className={styles.chips}>
            {Object.values(ProductStatusFilter).map((f) => {
              const count = f === ProductStatusFilter.OffSale ? all.length - onSale : 0;
              const params = new URLSearchParams({ ...(f && { durum: f }), ...(query && { ara: query }) }).toString();
              return (
                <Link
                  key={f || "tumu"}
                  href={params ? `/panel/urunler?${params}` : "/panel/urunler"}
                  className={styles.chip}
                  aria-current={f === filter ? "true" : undefined}
                >
                  {filterLabel[f]}
                  {count > 0 && ` ${count}`}
                </Link>
              );
            })}
          </div>

          {all.length === 0 ? (
            <p className={panel.empty}>
              Henüz ürün yok. {canEdit && <Link href="/panel/urunler/yeni">İlk ürününüzü ekleyin</Link>}
            </p>
          ) : shown.length === 0 ? (
            <p className={panel.empty}>Bu süzgeçle eşleşen ürün yok.</p>
          ) : (
            groups.map((group) => {
              const items = shown.filter((p) => p.product.categoryId === group.id);
              if (!items.length) return null;
              return (
                <div key={group.id}>
                  <h2 className={panel.groupTitle}>
                    <span>{group.name}</span>
                    <span>{items.length}</span>
                  </h2>
                  <ul className={styles.rows}>
                    {items.map(({ product }) => {
                      const content = (
                        <>
                          <span className={styles.thumb}>
                            {renderPhoto(product.photoUrl, "48px") ?? <span className={styles.thumbName}>{product.name}</span>}
                          </span>
                          <span className={styles.rowText}>
                            <span className={styles.rowName}>{product.name}</span>
                            <span className={cx(styles.rowMeta, styles.metaMobile)}>{productListMeta(product)}</span>
                            <span className={cx(styles.rowMeta, styles.metaDesktop)}>{productPriceMeta(product)}</span>
                          </span>
                          <span className={styles.rowSide}>
                            <span className={styles.metaMobile}>{productPriceLabel(product)}</span>
                            <StatusTag tone={product.active ? "delivered" : "muted"}>{product.active ? "Satışta" : "Satışta değil"}</StatusTag>
                          </span>
                        </>
                      );
                      return (
                        <li key={product.id}>
                          {canEdit ? (
                            <Link
                              href={href(`/panel/urunler/${product.id}`)}
                              className={styles.row}
                              aria-current={product.id === selectedId ? "true" : undefined}
                            >
                              {content}
                            </Link>
                          ) : (
                            <div className={styles.row}>{content}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          )}
          {!canEdit && <p className={styles.staffNote}>Ürünleri dükkân sahibi ekler ve değiştirir.</p>}
        </section>

        <aside aria-label="Ürün bilgileri" className={styles.aside}>
          {selected && canEdit ? (
            <ProductForm
              key={selected === "new" ? "new" : selected.product.id}
              productId={selected === "new" ? null : selected.product.id}
              initial={productFormValues(selected === "new" ? null : selected.product, categories[0]?.id ?? "")}
              categories={categories}
              showcaseHref={selected !== "new" && selected.product.active ? productPath(shop.slug, selected.product.id) : null}
              lastChange={selected === "new" ? null : lastChangeText(selected.updatedAt, selected.updatedBy, shop.timeZone)}
              justCreated={justCreated}
            />
          ) : (
            <p className={styles.asideEmpty}>
              {canEdit ? "Düzenlemek için listeden bir ürün seçin." : "Ürünleri dükkân sahibi ekler ve değiştirir."}
            </p>
          )}
        </aside>
      </div>

      {canEdit && (
        <Button href="/panel/urunler/yeni" className={styles.fab}>
          <Plus size={20} aria-hidden="true" />
          Ürün ekle
        </Button>
      )}
      {notice && <Toast notice={{ version: 1, message: notice, error: false }} />}
    </div>
  );
}
