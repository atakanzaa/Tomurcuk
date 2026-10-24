"use client";

import { Camera, CaretLeft, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState, useRef, useState, type ChangeEvent } from "react";
import { ActionBar } from "@/components/flow/ActionBar";
import { renderPhoto } from "@/components/ProductPhoto";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { Category, ProductInput } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { toProductJpeg } from "@/lib/panel/photo";
import { removeProduct, saveProductForm, uploadPhoto, type ProductFormState } from "@/lib/panel/product-actions";
import { parseLira, type ChoiceRow, type ProductFormValues } from "@/lib/panel/products";
import { Toast } from "../../_components/Toast";
import styles from "./products.module.css";

const NEW_CATEGORY = "__yeni";
const MAX_PHOTOS = 4;

interface ProductFormProps {
  productId: string | null;
  initial: ProductFormValues;
  categories: Category[];
  /** Satıştaki ürünün vitrin adresi; yeni ya da satışta olmayan üründe yok. */
  showcaseHref: string | null;
  /** "Son değişiklik: bugün 09:12, Ayla Er" */
  lastChange: string | null;
  justCreated: boolean;
}

let rowKey = 0;
const newRow = (price = ""): ChoiceRow => ({ key: `yeni-${++rowKey}`, id: null, name: "", price });

function toInput(values: ProductFormValues): ProductInput {
  const choices = (rows: ChoiceRow[]) => rows.map((r) => ({ id: r.id, name: r.name, price: parseLira(r.price) }));
  return {
    categoryId: values.categoryId === NEW_CATEGORY ? "" : values.categoryId,
    newCategory: values.newCategory,
    name: values.name,
    summary: values.summary,
    description: values.description,
    price: values.sizes.length ? null : parseLira(values.price),
    sizes: choices(values.sizes),
    extras: choices(values.extras),
    photos: values.photos,
    active: values.active,
  };
}

/**
 * Ürün ekleme ve düzenleme. Alanlar burada tutulur ve tek JSON olarak gider; hata gelince
 * alanlar `key` ile yeniden kurulur ama değerler korunur. Fotoğraflar seçilir seçilmez yüklenir.
 */
export function ProductForm({ productId, initial, categories, showcaseHref, lastChange, justCreated }: ProductFormProps) {
  const initialState: ProductFormState = {
    version: 0,
    errors: {},
    notice: justCreated
      ? { version: 1, message: "Ürün eklendi. Vitrininizde görünüyor.", error: false }
      : { version: 0, message: "", error: false },
  };
  const [state, action, pending] = useActionState(saveProductForm, initialState);
  const [values, setValues] = useState<ProductFormValues>(() =>
    categories.length ? initial : { ...initial, categoryId: NEW_CATEGORY },
  );
  const [uploading, setUploading] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const errors = state.errors;
  const title = productId ? initial.name : "Ürün ekle";

  return (
    <div className={styles.formWrap}>
      <header className={styles.formHead}>
        <Link href="/panel/urunler" className={styles.back}>
          <CaretLeft size={20} aria-hidden="true" />
          Ürünler
        </Link>
        <div className={styles.formTitleRow}>
          <h1 className={styles.formTitle}>{title}</h1>
          {showcaseHref && (
            <Link href={showcaseHref} className={styles.showcaseLink}>
              Vitrinde gör
            </Link>
          )}
        </div>
      </header>

      <form action={action} aria-label={title} className={styles.form}>
        <input type="hidden" name="productId" value={productId ?? ""} />
        <input type="hidden" name="payload" value={JSON.stringify(toInput(values))} />
        {errors.form && (
          <p role="alert" className={styles.formError}>
            {errors.form}
          </p>
        )}

        <div key={state.version} className={styles.formBody}>
          <PhotoPicker
            photos={values.photos}
            onChange={(update) => setValues((v) => ({ ...v, photos: update(v.photos) }))}
            onUploading={(delta) => setUploading((n) => n + delta)}
            error={errors.photos}
          />

          <section className={styles.fields}>
            <Field label="Ürün adı" value={values.name} maxLength={80} onChange={(e) => set("name", e.target.value)} error={errors.name} />
            {categories.length > 0 && (
              <Field
                as="select"
                label="Kategori"
                value={values.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
                error={values.categoryId === NEW_CATEGORY ? undefined : errors.category}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value={NEW_CATEGORY}>Yeni kategori</option>
              </Field>
            )}
            {values.categoryId === NEW_CATEGORY && (
              <Field
                label={categories.length ? "Yeni kategorinin adı" : "Kategori"}
                hint="Vitrinde ürünler bu başlık altında görünür, ör. Buketler."
                value={values.newCategory}
                maxLength={40}
                onChange={(e) => set("newCategory", e.target.value)}
                error={errors.category}
              />
            )}
            <Field
              className={styles.wide}
              label="Kısa açıklama"
              hint="Listede ürün adının altında görünür."
              value={values.summary}
              maxLength={80}
              counter
              onChange={(e) => set("summary", e.target.value)}
              error={errors.summary}
            />
            <Field
              className={styles.wide}
              as="textarea"
              label="Açıklama"
              optional
              rows={3}
              value={values.description}
              maxLength={1000}
              onChange={(e) => set("description", e.target.value)}
              error={errors.description}
            />
          </section>

          <div className={styles.choiceColumns}>
            <section className={styles.section} aria-labelledby="boylar">
              <div className={styles.sectionHead}>
                <h2 id="boylar" className={styles.sectionTitle}>
                  Boylar ve fiyat
                </h2>
                {values.sizes.length > 0 && <span className={styles.help}>Alıcı birini seçer</span>}
              </div>
              {values.sizes.length === 0 && (
                <PriceInput label="Fiyat" value={values.price} onChange={(price) => set("price", price)} error={errors.price} />
              )}
              <ChoiceRows
                rows={values.sizes}
                nameLabel="Boy"
                priceLabel="Fiyat"
                placeholder="Küçük, 10 dal"
                onChange={(sizes) => set("sizes", sizes)}
              />
              {errors.sizes && <p className={styles.fieldError}>{errors.sizes}</p>}
              <button
                type="button"
                className={cx("tm-btn tm-btn--quiet", styles.addRow)}
                // İlk boy eklenince tek fiyat o boya geçer.
                onClick={() => setValues((v) => ({ ...v, sizes: [...v.sizes, newRow(v.sizes.length ? "" : v.price)] }))}
              >
                Boy ekle
              </button>
              {values.sizes.length === 0 && (
                <span className={styles.help}>Tek fiyatlı ürünlerde boy eklemeyin; yalnızca fiyatı yazın.</span>
              )}
            </section>

            <section className={styles.section} aria-labelledby="ekler">
              <div className={styles.sectionHead}>
                <h2 id="ekler" className={styles.sectionTitle}>
                  Ek seçenekler
                </h2>
                <span className={styles.help}>Alıcı istediğini ekler</span>
              </div>
              <ChoiceRows
                rows={values.extras}
                nameLabel="Seçenek"
                priceLabel="Ek ücret"
                placeholder="Cam vazo"
                onChange={(extras) => set("extras", extras)}
              />
              {errors.extras && <p className={styles.fieldError}>{errors.extras}</p>}
              <button
                type="button"
                className={cx("tm-btn tm-btn--quiet", styles.addRow)}
                onClick={() => setValues((v) => ({ ...v, extras: [...v.extras, newRow()] }))}
              >
                Seçenek ekle
              </button>
            </section>
          </div>

          <div className={styles.saleRow}>
            <span className={styles.saleText}>
              <span id="satista" className={styles.saleTitle}>
                Satışta
              </span>
              <span className={styles.saleHelp}>Kapatırsanız vitrinden ve alıcı sayfasından kalkar; geçmiş siparişler etkilenmez.</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={values.active}
              aria-labelledby="satista"
              className={styles.switch}
              onClick={() => set("active", !values.active)}
            />
          </div>
        </div>

        <ActionBar
          aboveTabBar
          inlineOnDesktop
          captionBeside
          action={
            <div className={styles.submitRow}>
              <Button type="submit" block disabled={pending || uploading > 0} aria-busy={pending || undefined}>
                {productId ? "Değişiklikleri kaydet" : "Ürünü kaydet"}
              </Button>
            </div>
          }
          caption={uploading > 0 ? "Fotoğraf yükleniyor; bitince kaydedebilirsiniz." : (lastChange ?? "Kaydedince vitrininizde hemen görünür.")}
        />
      </form>

      {productId && (
        <form action={removeProduct} className={styles.deleteRow}>
          <input type="hidden" name="productId" value={productId} />
          {confirmDelete ? (
            <>
              <span className={styles.saleHelp}>Ürün vitrinden ve bu listeden kalkar; geçmiş siparişler etkilenmez.</span>
              <span className={styles.deleteActions}>
                <Button type="submit" variant="danger" size="s">
                  Ürünü sil
                </Button>
                <Button type="button" variant="quiet" size="s" onClick={() => setConfirmDelete(false)}>
                  Vazgeç
                </Button>
              </span>
            </>
          ) : (
            <button type="button" className={cx("tm-btn tm-btn--quiet", styles.deleteButton)} onClick={() => setConfirmDelete(true)}>
              Ürünü sil
            </button>
          )}
        </form>
      )}

      <Toast notice={state.notice} />
    </div>
  );
}

function PriceInput({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <label className={cx("tm-field", styles.priceField, error && "tm-field--error")}>
      <span className="tm-field__label">{label}</span>
      <span className={styles.suffix}>
        <input className="tm-field__control" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
        <span aria-hidden="true">TL</span>
      </span>
      {error && <span className="tm-field__meta">{error}</span>}
    </label>
  );
}

interface ChoiceRowsProps {
  rows: ChoiceRow[];
  nameLabel: string;
  priceLabel: string;
  placeholder: string;
  onChange: (rows: ChoiceRow[]) => void;
}

function ChoiceRows({ rows, nameLabel, priceLabel, placeholder, onChange }: ChoiceRowsProps) {
  const update = (key: string, patch: Partial<ChoiceRow>) => onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  return rows.map((row, i) => (
    <div key={row.key} className={styles.choice}>
      <label className="tm-field">
        <span className="tm-field__label">{nameLabel}</span>
        <input
          className="tm-field__control"
          value={row.name}
          maxLength={80}
          placeholder={i === 0 ? placeholder : undefined}
          onChange={(e) => update(row.key, { name: e.target.value })}
        />
      </label>
      <label className="tm-field">
        <span className="tm-field__label">{priceLabel}</span>
        <span className={styles.suffix}>
          <input className="tm-field__control" inputMode="decimal" value={row.price} onChange={(e) => update(row.key, { price: e.target.value })} />
          <span aria-hidden="true">TL</span>
        </span>
      </label>
      <button
        type="button"
        className={styles.iconButton}
        aria-label={`${row.name || `${i + 1}. satır`}: kaldır`}
        onClick={() => onChange(rows.filter((r) => r.key !== row.key))}
      >
        <X size={20} aria-hidden="true" />
      </button>
    </div>
  ));
}

interface PhotoPickerProps {
  photos: string[];
  onChange: (update: (photos: string[]) => string[]) => void;
  onUploading: (delta: number) => void;
  error?: string;
}

function PhotoPicker({ photos, onChange, onUploading, error }: PhotoPickerProps) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const free = MAX_PHOTOS - photos.length - pending;

  async function upload(file: File) {
    setPending((n) => n + 1);
    onUploading(1);
    try {
      const body = new FormData();
      body.set("file", await toProductJpeg(file), "foto.jpg");
      const result = await uploadPhoto(body);
      if ("url" in result) onChange((list) => (list.length < MAX_PHOTOS ? [...list, result.url] : list));
      else setUploadError(result.error);
    } catch {
      setUploadError("Fotoğraf yüklenemedi. Bağlantınızı kontrol edip yeniden deneyin.");
    } finally {
      setPending((n) => n - 1);
      onUploading(-1);
    }
  }

  function choose(event: ChangeEvent<HTMLInputElement>) {
    setUploadError(null);
    const files = [...(event.target.files ?? [])].slice(0, Math.max(free, 0));
    event.target.value = "";
    files.forEach((file) => void upload(file));
  }

  const message = uploadError ?? error;
  return (
    <section className={styles.section} aria-labelledby="fotograflar">
      <h2 id="fotograflar" className={styles.sectionTitle}>
        Fotoğraflar
      </h2>
      <div className={styles.photos}>
        {photos.map((url, i) => (
          <div key={url} className={styles.photo}>
            {renderPhoto(url, "(min-width: 1024px) 140px, 30vw")}
            {i === 0 ? (
              <span className={styles.coverChip}>Kapak</span>
            ) : (
              <button type="button" className={styles.coverButton} onClick={() => onChange((list) => [url, ...list.filter((u) => u !== url)])}>
                Kapak yap
              </button>
            )}
            <button
              type="button"
              className={styles.photoRemove}
              aria-label={`${i + 1}. fotoğrafı kaldır`}
              onClick={() => onChange((list) => list.filter((u) => u !== url))}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        ))}
        {Array.from({ length: pending }, (_, i) => (
          <div key={`yukleniyor-${i}`} className={cx(styles.photo, styles.photoPending)}>
            Yükleniyor
          </div>
        ))}
        {free > 0 && (
          <button type="button" className={styles.photoAdd} onClick={() => input.current?.click()}>
            <Camera size={22} aria-hidden="true" />
            Fotoğraf ekle
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        hidden
        onChange={choose}
      />
      {message ? (
        <p className={styles.fieldError} role="alert">
          {message}
        </p>
      ) : (
        <span className={styles.help}>
          En fazla 4 fotoğraf. 4:5 oranında kırpılır; ilk fotoğraf kapak olur, vitrinde ve alıcı sayfasında görünür.
        </span>
      )}
    </section>
  );
}
