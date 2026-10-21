"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/flow/SubmitButton";
import { Field } from "@/components/ui/Field";
import { TicketCategory } from "@/lib/api/types";
import { initialFormState } from "@/lib/checkout/form-state";
import { openTicket } from "@/lib/panel/actions";
import { ticketCategoryLabel } from "@/lib/support";
import styles from "../_components/simple.module.css";

export function TicketForm() {
  const [state, action] = useActionState(openTicket, initialFormState);
  const sent = state.values.sent === "1";
  return (
    <form key={state.version} action={action} noValidate className={styles.form}>
      {sent && (
        <p className={styles.notice} role="status">
          Talebiniz alındı. Bugün teslim edilecek bir siparişle ilgiliyse 15 dakika içinde, diğerlerinde 4 saat içinde dönüyoruz.
        </p>
      )}
      <Field as="select" label="Konu" name="category" defaultValue={sent ? "" : (state.values.category ?? "")} error={state.errors.category}>
        <option value="" disabled>
          Seçin
        </option>
        {Object.values(TicketCategory).map((c) => (
          <option key={c} value={c}>
            {ticketCategoryLabel[c]}
          </option>
        ))}
      </Field>
      <Field label="Kısaca ne oldu?" name="subject" defaultValue={sent ? "" : state.values.subject} error={state.errors.subject} maxLength={120} />
      <Field
        label="İlgili sipariş"
        name="orderNumber"
        optional
        placeholder="T-4821"
        defaultValue={sent ? "" : state.values.orderNumber}
        error={state.errors.orderNumber}
        hint="Bugün teslim edilecek bir siparişse talep acil olarak açılır."
      />
      <Field as="textarea" label="Ayrıntı" name="text" defaultValue={sent ? "" : state.values.text} error={state.errors.text} maxLength={2000} />
      <SubmitButton>Talep aç</SubmitButton>
    </form>
  );
}
