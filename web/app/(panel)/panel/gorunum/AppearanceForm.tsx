"use client";

import { useActionState, useState } from "react";
import { renderPhoto } from "@/components/ProductPhoto";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ShopLayout, ShopThemeMode, type Shop } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { initialNotice } from "@/lib/panel/notice";
import { saveAppearanceForm, type SettingsFormState } from "@/lib/panel/settings-actions";
import { shopPath } from "@/lib/routes";
import { shopThemeVars } from "@/lib/shop-theme";
import { Toast } from "../_components/Toast";
import styles from "../_components/settings.module.css";
import look from "./appearance.module.css";

const initialState: SettingsFormState = { version: 0, errors: {}, values: {}, notice: initialNotice };

const LAYOUTS: { value: ShopLayout; name: string; description: string }[] = [
  { value: ShopLayout.Cover, name: "Kapak önde", description: "Büyük kapak, sonra favori ve hikâye." },
  { value: ShopLayout.Story, name: "Hikâye önde", description: "Hikâye ve atölye fotoğrafları başta." },
  { value: ShopLayout.Products, name: "Çiçekler önde", description: "İnce kapak, hemen ürünler." },
];

const SWATCHES = [
  { key: "paper", name: "Zemin" },
  { key: "kraft", name: "Yüzey" },
  { key: "line", name: "Çizgi" },
  { key: "stem", name: "Buton" },
  { key: "ink", name: "Metin" },
];

/** Vitrinin rengi (kapaktan), düzeni, iletişim bağlantıları ve paylaşım açıklaması; yanında önizleme. */
export function AppearanceForm({ shop, readOnly }: { shop: Shop; readOnly: boolean }) {
  const [state, action, pending] = useActionState(saveAppearanceForm, initialState);
  const [useTomurcuk, setUseTomurcuk] = useState(shop.themeMode === ShopThemeMode.Tomurcuk);
  const [layout, setLayout] = useState<ShopLayout>(shop.layout);
  const [share, setShare] = useState(state.values.shareDescription ?? shop.shareDescription);
  const v = (key: string, fallback: string | null) => state.values[key] ?? fallback ?? "";
  const e = state.errors;
  // Kayıtlı tema "tomurcuk" seçiliyken null gelir; önizleme için kapak rengi yoksa varsayılan kalır.
  const theme = useTomurcuk ? null : shop.theme;

  return (
    <form action={action} className={look.layout} key={state.version}>
      <fieldset disabled={readOnly || pending} className={look.form}>
        <section className={styles.section} aria-labelledby="renk">
          <div className={styles.sectionHead}>
            <h2 id="renk" className={styles.sectionTitle}>
              Renk
            </h2>
            <p className={styles.sectionHelp}>
              {shop.theme
                ? "Renginiz kapak fotoğrafınızdan geliyor. Kapağı değiştirince renk de değişir; yazılar her renkte okunur kalacak şekilde ayarlanır."
                : shop.coverPhotoUrl
                  ? "Kapak fotoğrafınızdan renk çıkmadı; vitrininiz Tomurcuk'un renklerinde. Renkli bir kapak fotoğrafı yüklerseniz renk ondan gelir."
                  : "Kapak fotoğrafı yükleyince vitrininizin rengi ondan gelir. Kapağı Dükkân ayarlarından ekleyin."}
            </p>
          </div>
          {shop.theme && (
            <div className={look.swatches} aria-label="Kapaktan çıkan renkler">
              {SWATCHES.map((swatch) => (
                <span key={swatch.key} className={look.swatch}>
                  <span className={look.chip} style={{ background: shop.theme!.light[swatch.key] }} />
                  <span className={look.chipName}>{swatch.name}</span>
                </span>
              ))}
            </div>
          )}
          <label className={look.check}>
            <input
              type="checkbox"
              name="useTomurcukColors"
              checked={useTomurcuk}
              onChange={(event) => setUseTomurcuk(event.target.checked)}
            />
            <span className={look.checkText}>
              <span>Tomurcuk&apos;un renklerini kullan</span>
              <span className={styles.muted}>Kraft ve sap yeşili; kapaktan renk alınmaz.</span>
            </span>
          </label>
        </section>

        <section className={styles.section} aria-labelledby="duzen">
          <div className={styles.sectionHead}>
            <h2 id="duzen" className={styles.sectionTitle}>
              Düzen
            </h2>
            <p className={styles.sectionHelp}>Bölümler aynıdır; sıraları ve ağırlıkları değişir.</p>
          </div>
          <div role="radiogroup" aria-labelledby="duzen" className={look.layouts}>
            {LAYOUTS.map((option) => (
              <label key={option.value} className={cx(look.layoutOption, layout === option.value && look.selected)}>
                <span className={cx(look.thumb, look[`thumb_${option.value}`])} aria-hidden="true">
                  <span className={look.thumbCover} />
                  <span className={look.thumbTitle} />
                  <span className={look.thumbGrid}>
                    <span />
                    <span />
                  </span>
                </span>
                <span className={look.layoutName}>
                  <input
                    type="radio"
                    name="layout"
                    value={option.value}
                    checked={layout === option.value}
                    onChange={() => setLayout(option.value)}
                  />
                  {option.name}
                </span>
                <span className={styles.muted}>{option.description}</span>
              </label>
            ))}
          </div>
          {e.layout && (
            <p className={styles.fieldError} role="alert">
              {e.layout}
            </p>
          )}
        </section>

        <section className={styles.section} aria-labelledby="iletisim">
          <div className={styles.sectionHead}>
            <h2 id="iletisim" className={styles.sectionTitle}>
              İletişim
            </h2>
            <p className={styles.sectionHelp}>
              Vitrininizin altındaki &quot;Bize ulaşın&quot; bölümünde görünür. Adres, çalışma saatleri ve teslim semtleri
              Dükkân ve Teslimat ayarlarından gelir.
            </p>
          </div>
          <div className={styles.fields}>
            <Field
              label="Instagram kullanıcı adı"
              name="instagram"
              optional
              placeholder="nergiscicek"
              autoComplete="off"
              defaultValue={v("instagram", shop.instagram)}
              error={e.instagram}
            />
            <Field
              label="WhatsApp numarası"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              optional
              placeholder={shop.phone}
              defaultValue={v("whatsapp", shop.whatsapp)}
              hint="Boş bırakırsanız dükkân telefonunuz kullanılır."
              error={e.whatsapp}
            />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="paylasim">
          <div className={styles.sectionHead}>
            <h2 id="paylasim" className={styles.sectionTitle}>
              Paylaşım açıklaması
            </h2>
            <p className={styles.sectionHelp}>
              Bağlantınız WhatsApp&apos;ta, Instagram&apos;da paylaşılınca ve aramalarda kapağınızın altında görünen cümle.
            </p>
          </div>
          <Field
            as="textarea"
            label="Açıklama"
            name="shareDescription"
            optional
            rows={2}
            maxLength={160}
            value={share}
            onChange={(event) => setShare(event.target.value)}
            placeholder={shop.descriptionShort}
            hint="Boş bırakırsanız kısa tanıtımınız kullanılır."
            error={e.shareDescription}
          />
        </section>

        {!readOnly && (
          <div className={styles.actions}>
            <Button type="submit" disabled={pending} aria-busy={pending || undefined}>
              Görünümü kaydet
            </Button>
          </div>
        )}
      </fieldset>

      <aside className={look.preview} aria-label="Önizleme">
        <span className={look.previewLabel}>Önizleme</span>
        <div className={look.previewCard} style={theme ? shopThemeVars(theme.light) : undefined}>
          {layout !== ShopLayout.Story && (
            <div className={cx(look.previewCover, layout === ShopLayout.Products && look.previewStrip)}>
              {shop.coverPhotoUrl && renderPhoto(shop.coverPhotoUrl, "300px")}
            </div>
          )}
          <div className={look.previewBody}>
            <span className={look.previewName}>{shop.name}</span>
            <span className={look.previewBand}>
              <strong>Bugün teslim</strong> için {shop.sameDayCutoff}&apos;e kadar.
            </span>
            <span className={look.previewProduct} />
            <span className={look.previewButton}>Teslimat bilgilerine geç</span>
          </div>
        </div>
        <a href={shopPath(shop.slug)} target="_blank" rel="noopener noreferrer" className={look.previewLink}>
          Vitrininizi yeni sekmede açın
        </a>
        {(share || shop.descriptionShort) && (
          <div className={look.sharePreview}>
            <span className={look.previewLabel}>Paylaşılınca</span>
            <span className={look.shareTitle}>{shop.name}</span>
            <span className={look.shareText}>{share || shop.descriptionShort}</span>
          </div>
        )}
      </aside>
      <Toast notice={state.notice} />
    </form>
  );
}
