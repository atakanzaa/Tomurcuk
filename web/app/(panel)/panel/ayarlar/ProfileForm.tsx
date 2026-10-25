"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { PanelSettings } from "@/lib/api/types";
import { initialNotice } from "@/lib/panel/notice";
import { saveProfileForm, type SettingsFormState } from "@/lib/panel/settings-actions";
import { Toast } from "../_components/Toast";
import styles from "../_components/settings.module.css";

interface ProfileFormProps {
  profile: PanelSettings["profile"];
  /** Çalışan görür ama değiştiremez. */
  readOnly: boolean;
}

const initialState: SettingsFormState = { version: 0, errors: {}, values: {}, notice: initialNotice };

/** Dükkân bilgileri, sözleşmelerdeki satıcı bilgileri ve yeni sipariş SMS'i tek formda. */
export function ProfileForm({ profile, readOnly }: ProfileFormProps) {
  const [state, action, pending] = useActionState(saveProfileForm, initialState);
  const { shop } = profile;
  const v = (key: string, fallback: string | null) => state.values[key] ?? fallback ?? "";
  const [sms, setSms] = useState(profile.notifySms);
  const e = state.errors;

  return (
    <form action={action} className={styles.page} key={state.version}>
      {readOnly && <p className={styles.readOnly}>Ayarları dükkân sahibi değiştirir.</p>}
      <fieldset disabled={readOnly || pending} className={styles.plain}>
        <section className={styles.section} aria-labelledby="dukkan">
          <div className={styles.sectionHead}>
            <h2 id="dukkan" className={styles.sectionTitle}>
              Dükkân
            </h2>
            <p className={styles.sectionHelp}>Vitrininizde ve alıcı ana sayfasında görünür.</p>
          </div>
          <div className={styles.fields}>
            <Field label="Dükkânın adı" name="name" defaultValue={v("name", shop.name)} maxLength={120} error={e.name} />
            <Field
              label="Kısa adı"
              name="shortName"
              hint="Takip sayfasında ve SMS'lerde, ör. Nergis."
              defaultValue={v("shortName", shop.shortName)}
              maxLength={60}
              error={e.shortName}
            />
            <Field label="Telefon" name="phone" type="tel" inputMode="tel" defaultValue={v("phone", shop.phone)} error={e.phone} />
            <Field
              label="Çalışma saatleri"
              name="openingHours"
              optional
              placeholder="Her gün 09:00–20:00"
              defaultValue={v("openingHours", shop.openingHours)}
              maxLength={120}
              error={e.openingHours}
            />
            <Field className={styles.wide} label="Adres" name="address" defaultValue={v("address", shop.address)} maxLength={300} error={e.address} />
            <Field
              className={styles.wide}
              label="Kısa tanıtım"
              name="descriptionShort"
              optional
              hint="Alıcı ana sayfasında dükkânınızın satırında görünür."
              defaultValue={v("descriptionShort", shop.descriptionShort)}
              maxLength={160}
              counter
              error={e.descriptionShort}
            />
            <Field
              className={styles.wide}
              as="textarea"
              label="Tanıtım"
              name="description"
              optional
              rows={3}
              defaultValue={v("description", shop.description)}
              maxLength={1000}
              error={e.description}
            />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="satici">
          <div className={styles.sectionHead}>
            <h2 id="satici" className={styles.sectionTitle}>
              Sözleşmelerdeki bilgiler
            </h2>
            <p className={styles.sectionHelp}>
              Ön bilgilendirme formunda ve mesafeli satış sözleşmesinde satıcı olarak yazar. Faturadaki bilgilerinizle aynı olmalı.
            </p>
          </div>
          <div className={styles.fields}>
            <Field
              className={styles.wide}
              label="Unvan ya da ad soyad"
              name="legalName"
              hint="Şirketse ticaret unvanı, şahıs işletmesiyse ad soyad."
              defaultValue={v("legalName", shop.legalName)}
              maxLength={160}
              error={e.legalName}
            />
            <Field label="Vergi dairesi" name="taxOffice" defaultValue={v("taxOffice", shop.taxOffice)} maxLength={80} error={e.taxOffice} />
            <Field
              label="Vergi ya da T.C. kimlik numarası"
              name="taxNumber"
              inputMode="numeric"
              defaultValue={v("taxNumber", shop.taxNumber)}
              error={e.taxNumber}
            />
            <Field
              className={styles.wide}
              label="E-posta"
              name="email"
              type="email"
              hint="Alıcı şikâyet ve iade için buraya yazabilir."
              defaultValue={v("email", shop.email)}
              error={e.email}
            />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="bildirim">
          <h2 id="bildirim" className={styles.sectionTitle}>
            Bildirimler
          </h2>
          <div className={styles.switchRow}>
            <span className={styles.switchText}>
              <span id="sms" className={styles.switchTitle}>
                Yeni siparişte SMS
              </span>
              <span className={styles.muted}>
                Linkten yeni sipariş gelince cep telefonunuza kısa bir SMS gider. E-posta her durumda gider.
              </span>
            </span>
            <input type="hidden" name="notifySms" value={sms ? "on" : ""} />
            <button type="button" role="switch" aria-checked={sms} aria-labelledby="sms" className={styles.switch} onClick={() => setSms(!sms)} />
          </div>
          <div className={styles.fields}>
            <Field
              label="Cep telefonu"
              name="notifyPhone"
              type="tel"
              inputMode="tel"
              placeholder="05xx xxx xx xx"
              optional={!sms}
              defaultValue={v("notifyPhone", profile.notifyPhone)}
              error={e.notifyPhone}
            />
          </div>
        </section>

        {!readOnly && (
          <div className={styles.actions}>
            <Button type="submit" disabled={pending} aria-busy={pending || undefined}>
              Değişiklikleri kaydet
            </Button>
          </div>
        )}
      </fieldset>
      <Toast notice={state.notice} />
    </form>
  );
}
