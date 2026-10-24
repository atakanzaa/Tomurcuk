"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { PilotApplication } from "@/lib/api/types";
import { openShopAction, type OpenShopState } from "@/lib/onboarding-actions";
import { suggestSlug } from "@/lib/slug";
import { PasswordLinkCard } from "../../_components/PasswordLinkCard";
import styles from "../../_components/onboarding.module.css";

const initialState: OpenShopState = { version: 0, errors: {}, values: {}, link: null };

interface OpenShopFormProps {
  application: PilotApplication | null;
  /** Adres önekinde gösterilir: "tomurcuk.shop/". */
  host: string;
}

export function OpenShopForm({ application, host }: OpenShopFormProps) {
  const [state, action, pending] = useActionState(openShopAction, initialState);
  const v = state.values;
  const [name, setName] = useState(v.name ?? application?.shopName ?? "");
  const [slug, setSlug] = useState(v.slug ?? suggestSlug(application?.shopName ?? ""));
  const [slugEdited, setSlugEdited] = useState(false);
  const [phone, setPhone] = useState(v.phone ?? application?.phone ?? "");

  if (state.link) {
    return (
      <div className={styles.form}>
        <PasswordLinkCard link={state.link} shopName={name} phone={phone} title={`${name} açıldı`} />
        <div className={styles.actions}>
          <Button variant="secondary" href={`/destek/dukkanlar/${state.link.shopId}`}>
            Dükkânın özetine git
          </Button>
          <Link href={`/${state.link.slug}`} target="_blank">
            Vitrini aç
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className={styles.form} noValidate key={state.version}>
      <input type="hidden" name="applicationId" value={application?.id ?? ""} />
      <section className={styles.section} aria-labelledby="dukkan">
        <h2 id="dukkan" className={styles.sectionTitle}>
          Dükkân
        </h2>
        <div className={styles.fields}>
          <Field
            label="Dükkânın adı"
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugEdited) setSlug(suggestSlug(e.target.value));
            }}
            error={state.errors.name}
          />
          <Field label="Kısa adı" name="shortName" hint="Panelde ve SMS'lerde, ör. Nergis." defaultValue={v.shortName ?? name.split(" ")[0]} error={state.errors.shortName} />
          <label className={`tm-field ${styles.wide}`}>
            <span className="tm-field__label">Vitrin adresi</span>
            <span className={styles.slug}>
              <span className={styles.slugPrefix}>{host}/</span>
              <input
                className="tm-field__control"
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(e.target.value.toLowerCase());
                }}
                aria-invalid={state.errors.slug ? true : undefined}
              />
            </span>
            <span className="tm-field__meta">{state.errors.slug ?? "Küçük harf, rakam ve tire. Sonradan değişirse eski adres yeniye yönlenir."}</span>
          </label>
          <Field label="Telefon" name="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={state.errors.phone} />
          <Field
            label="Adres"
            name="address"
            defaultValue={v.address ?? (application ? `${application.district}` : "")}
            error={state.errors.address}
          />
        </div>
      </section>
      <section className={styles.section} aria-labelledby="sahip">
        <h2 id="sahip" className={styles.sectionTitle}>
          Dükkân sahibi
        </h2>
        <div className={styles.fields}>
          <Field label="Adı soyadı" name="ownerName" defaultValue={v.ownerName} error={state.errors.ownerName} />
          <Field
            label="E-posta"
            name="ownerEmail"
            type="email"
            hint="Panele bununla girer; yeni sipariş e-postaları da buraya gider."
            defaultValue={v.ownerEmail}
            error={state.errors.ownerEmail}
          />
        </div>
      </section>
      <p className={styles.cardText}>
        Dükkân pilot planda açılır; 10:00–13:00, 13:00–16:00 ve 16:00–19:00 aralıkları ve &quot;Buketler&quot; kategorisi hazır gelir. Ürünleri,
        teslim bölgelerini ve sözleşme bilgilerini sahibi panelden girer.
      </p>
      <div className={styles.actions}>
        <Button type="submit" disabled={pending} aria-busy={pending || undefined}>
          Dükkânı aç
        </Button>
      </div>
    </form>
  );
}
