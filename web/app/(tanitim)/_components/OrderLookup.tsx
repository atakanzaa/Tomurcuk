"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Field } from "@/components/ui/Field";
import { initialFormState } from "@/lib/checkout/form-state";
import { lookupOrderAnywhere } from "@/lib/marketing-actions";
import styles from "../home.module.css";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`tm-btn tm-btn--primary ${styles.lookupButton}`} disabled={pending} aria-busy={pending || undefined}>
      Siparişi bul
    </button>
  );
}

/** Dükkân bilinmeden sipariş bulma; bulununca dükkânın takip sayfasına gider. */
export function OrderLookup() {
  const [state, action] = useActionState(lookupOrderAnywhere, initialFormState);
  return (
    <form key={state.version} action={action} noValidate className={styles.lookupForm} aria-label="Sipariş bul">
      {state.errors.form && (
        <p className={styles.lookupError} role="alert">
          {state.errors.form}
        </p>
      )}
      <Field label="Sipariş numarası" name="number" placeholder="T-4821" autoComplete="off" defaultValue={state.values.number} error={state.errors.number} />
      <Field
        label="Telefonunuz"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="05xx xxx xx xx"
        defaultValue={state.values.phone}
        error={state.errors.phone}
      />
      <Submit />
    </form>
  );
}
