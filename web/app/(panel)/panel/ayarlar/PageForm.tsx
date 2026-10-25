"use client";

import { Camera, X } from "@phosphor-icons/react";
import { useActionState, useRef, useState, type ChangeEvent } from "react";
import { renderPhoto } from "@/components/ProductPhoto";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { Shop } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { initialNotice } from "@/lib/panel/notice";
import { toCoverJpeg, toSquareJpeg } from "@/lib/panel/photo";
import { savePageForm, uploadPagePhoto, type SettingsFormState } from "@/lib/panel/settings-actions";
import { Toast } from "../_components/Toast";
import styles from "../_components/settings.module.css";
import page from "./page.module.css";

interface PageFormProps {
  shop: Shop;
  /** Favori seçimi: satıştaki ürünler. */
  products: { id: string; name: string }[];
  readOnly: boolean;
}

const MAX_STORY_PHOTOS = 3;

const initialState: SettingsFormState = { version: 0, errors: {}, values: {}, notice: initialNotice };

type Kind = "cover" | "square";

/** Fotoğrafı tarayıcıda kırpıp yükler; hata metni ya da adres döner. */
async function upload(kind: Kind, file: File): Promise<{ url: string } | { error: string }> {
  try {
    const body = new FormData();
    body.set("file", await (kind === "cover" ? toCoverJpeg(file) : toSquareJpeg(file)), "foto.jpg");
    return await uploadPagePhoto(kind, body);
  } catch {
    return { error: "Fotoğraf yüklenemedi. Bağlantınızı kontrol edip yeniden deneyin." };
  }
}

/** Vitrinin kendisi: kapak, logo, hikâye, atölye fotoğrafları, favori ürün ve çiçekçinin notu. */
export function PageForm({ shop, products, readOnly }: PageFormProps) {
  const [state, action, pending] = useActionState(savePageForm, initialState);
  const [cover, setCover] = useState(shop.coverPhotoUrl);
  const [logo, setLogo] = useState(shop.logoUrl);
  const [storyPhotos, setStoryPhotos] = useState(shop.storyPhotos);
  const [uploading, setUploading] = useState(0);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const v = (key: string, fallback: string | number | null) => state.values[key] ?? String(fallback ?? "");
  const e = state.errors;

  const track = async (kind: Kind, file: File, done: (url: string) => void) => {
    setPhotoError(null);
    setUploading((n) => n + 1);
    const result = await upload(kind, file);
    setUploading((n) => n - 1);
    if ("url" in result) done(result.url);
    else setPhotoError(result.error);
  };

  return (
    <form action={action} className={styles.page} key={state.version}>
      <input type="hidden" name="payload" value={JSON.stringify({ coverPhotoUrl: cover, logoUrl: logo, storyPhotos })} />
      <fieldset disabled={readOnly || pending} className={styles.plain}>
        <section className={styles.section} aria-labelledby="sayfa">
          <div className={styles.sectionHead}>
            <h2 id="sayfa" className={styles.sectionTitle}>
              Dükkânınızın sayfası
            </h2>
            <p className={styles.sectionHelp}>
              Alıcı vitrininizi açınca önce bunları görür. Kendi çektiğiniz fotoğrafları kullanın; kapak 3:2, logo ve atölye
              fotoğrafları kare kırpılır.
            </p>
          </div>
          <div className={page.photoRow}>
            <PhotoSlot
              label="Kapak fotoğrafı"
              shape="cover"
              url={cover}
              disabled={readOnly}
              onPick={(file) => track("cover", file, setCover)}
              onRemove={() => setCover(null)}
            />
            <PhotoSlot
              label="Logo"
              shape="square"
              url={logo}
              disabled={readOnly}
              onPick={(file) => track("square", file, setLogo)}
              onRemove={() => setLogo(null)}
            />
          </div>
          {(photoError || e.coverPhotoUrl || e.logoUrl) && (
            <p className={page.error} role="alert">
              {photoError ?? e.coverPhotoUrl ?? e.logoUrl}
            </p>
          )}
          {uploading > 0 && <span className={styles.muted}>Fotoğraf yükleniyor.</span>}
        </section>

        <section className={styles.section} aria-labelledby="favori">
          <div className={styles.sectionHead}>
            <h2 id="favori" className={styles.sectionTitle}>
              Dükkânın favorisi
            </h2>
            <p className={styles.sectionHelp}>Vitrinde adınızın altında; notunuz kart notu etiketinde görünür.</p>
          </div>
          <div className={styles.fields}>
            <Field as="select" label="Favori ürün" name="featuredProductId" defaultValue={v("featuredProductId", shop.featuredProductId)} error={e.featuredProductId}>
              <option value="">Seçilmedi</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Field>
            <Field
              className={styles.wide}
              as="textarea"
              label="Neden seviyorsunuz"
              name="favoriteNote"
              optional
              rows={2}
              placeholder="Her pazartesi seradan yeni laleler geliyor."
              defaultValue={v("favoriteNote", shop.favoriteNote)}
              maxLength={200}
              error={e.favoriteNote}
            />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="hikaye">
          <div className={styles.sectionHead}>
            <h2 id="hikaye" className={styles.sectionTitle}>
              Hikâyeniz
            </h2>
            <p className={styles.sectionHelp}>Dükkânı kim, ne zaman açtı; çiçekleri nasıl seçiyorsunuz. Kısa ve sizin sesinizle.</p>
          </div>
          <div className={styles.fields}>
            <Field
              label="Kuruluş yılı"
              name="foundedYear"
              inputMode="numeric"
              optional
              placeholder="2009"
              defaultValue={v("foundedYear", shop.foundedYear)}
              maxLength={4}
              error={e.foundedYear}
            />
            <Field
              className={styles.wide}
              as="textarea"
              label="Hikâyemiz"
              name="story"
              optional
              rows={5}
              defaultValue={v("story", shop.story)}
              maxLength={1500}
              error={e.story}
            />
          </div>
          <div className={page.slot}>
            <span className={page.slotLabel}>Atölye fotoğrafları</span>
            <div className={page.squares}>
              {storyPhotos.map((url, i) => (
                <div key={url} className={cx(page.photo, page.square)}>
                  {renderPhoto(url, "120px")}
                  {!readOnly && (
                    <button type="button" className={page.remove} aria-label={`${i + 1}. atölye fotoğrafını kaldır`} onClick={() => setStoryPhotos((list) => list.filter((u) => u !== url))}>
                      <X size={18} aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
              {!readOnly && storyPhotos.length < MAX_STORY_PHOTOS && (
                <PickButton
                  className={cx(page.add, page.square)}
                  onPick={(file) => track("square", file, (url) => setStoryPhotos((list) => (list.length < MAX_STORY_PHOTOS ? [...list, url] : list)))}
                />
              )}
            </div>
            {e.storyPhotos ? (
              <p className={page.error} role="alert">
                {e.storyPhotos}
              </p>
            ) : (
              <span className={styles.muted}>En fazla 3 fotoğraf: atölye, tezgâh, ekip.</span>
            )}
          </div>
        </section>

        {!readOnly && (
          <div className={styles.actions}>
            <Button type="submit" disabled={pending || uploading > 0} aria-busy={pending || undefined}>
              Sayfayı kaydet
            </Button>
          </div>
        )}
      </fieldset>
      <Toast notice={state.notice} />
    </form>
  );
}

function PhotoSlot({ label, shape, url, disabled, onPick, onRemove }: { label: string; shape: "cover" | "square"; url: string | null; disabled: boolean; onPick: (file: File) => void; onRemove: () => void }) {
  return (
    <div className={page.slot}>
      <span className={page.slotLabel}>{label}</span>
      {url ? (
        <div className={cx(page.photo, page[shape])}>
          {renderPhoto(url, shape === "cover" ? "360px" : "120px")}
          {!disabled && (
            <button type="button" className={page.remove} aria-label={`${label} kaldır`} onClick={onRemove}>
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      ) : disabled ? (
        <div className={cx(page.photo, page[shape], page.pending)}>Yok</div>
      ) : (
        <PickButton className={cx(page.add, page[shape])} onPick={onPick} />
      )}
    </div>
  );
}

function PickButton({ className, onPick }: { className: string; onPick: (file: File) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onPick(file);
  };
  return (
    <>
      <button type="button" className={className} onClick={() => input.current?.click()}>
        <Camera size={22} aria-hidden="true" />
        Fotoğraf ekle
      </button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" hidden onChange={choose} />
    </>
  );
}
