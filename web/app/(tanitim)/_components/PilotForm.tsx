"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field } from "@/components/ui/Field";
import { initialFormState } from "@/lib/checkout/form-state";
import { applyForPilot } from "@/lib/marketing-actions";
import { useFormStatus } from "react-dom";
import styles from "../landing.module.css";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`tm-btn tm-btn--primary tm-btn--block ${styles.bigButton}`} disabled={pending}>
      Pilota başvur
    </button>
  );
}

export function PilotForm() {
  const [state, action] = useActionState(applyForPilot, initialFormState);
  if (state.values.done) {
    return (
      <div className={styles.form} role="status">
        <h3 className={styles.formDone}>Başvurunuz alındı.</h3>
        <p className={styles.formNote}>
          {state.values.shopName} için 2 iş günü içinde sizi arayıp dükkânınızı ziyaret etmek üzere gün ayarlıyoruz.
        </p>
      </div>
    );
  }
  return (
    <form key={state.version} action={action} noValidate className={styles.form}>
      <Field label="Dükkânınızın adı" name="shopName" placeholder="Ör. Nergis Çiçek Atölyesi" defaultValue={state.values.shopName} error={state.errors.shopName} />
      <div className={styles.formPair}>
        <Field label="Telefon" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="05xx xxx xx xx" defaultValue={state.values.phone} error={state.errors.phone} />
        <Field label="İlçe" name="district" placeholder="Ör. Kadıköy" defaultValue={state.values.district} error={state.errors.district} />
      </div>
      <Field label="Instagram hesabınız" name="instagram" optional placeholder="@dukkaniniz" defaultValue={state.values.instagram} error={state.errors.instagram} />
      <Submit />
      <span className={styles.formNote}>
        2 iş günü içinde sizi arayıp dükkânınızı ziyaret etmek için gün ayarlıyoruz. Bilgileriniz{" "}
        <Link href="/gizlilik">gizlilik metnindeki</Link> gibi işlenir.
      </span>
    </form>
  );
}
