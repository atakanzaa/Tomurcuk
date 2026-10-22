"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { reveal, type RevealState } from "@/lib/support-actions";
import dialog from "../../_components/dialog.module.css";
import styles from "./ticket.module.css";

const initial: RevealState = { version: 0, phone: null, error: null };

/**
 * Maskeli telefon. "Göster" gerekçe ister; gerekçe ve kişi denetim kaydına yazılır.
 * Açılan numara yalnızca bu ekranda görünür, sayfa yenilenince yeniden maskelenir.
 */
export function PhoneReveal({ orderId, field, masked, context }: { orderId: string; field: "recipient" | "sender"; masked: string; context: string }) {
  const [state, action] = useActionState(reveal.bind(null, orderId, field), initial);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = `goster-${field}-${orderId}`;

  if (state.phone) return <span>{state.phone}</span>;
  return (
    <span className={styles.masked}>
      <span>{masked}</span>
      <button type="button" className={styles.revealButton} onClick={() => dialogRef.current?.showModal()}>
        Göster
      </button>
      <dialog ref={dialogRef} className={dialog.dialog} aria-labelledby={titleId}>
        <form action={action} className={dialog.dialogForm}>
          <h2 id={titleId} className={dialog.dialogTitle}>
            Telefonu göster
          </h2>
          <p className={dialog.dialogText}>Gerekçeniz ve adınız denetim kaydına yazılır; dükkân sahibi kendi kaydında görür.</p>
          <Field as="select" label="Gerekçe" name="reason" defaultValue={context}>
            <option value={context}>{context}</option>
            <option value="Alıcıya ulaşılamıyor, adres teyidi">Alıcıya ulaşılamıyor, adres teyidi</option>
            <option value="other">Diğer, açıklama yazacağım</option>
          </Field>
          <Field label="Açıklama" name="detail" optional error={state.error ?? undefined} />
          <div className={dialog.dialogActions}>
            <Button variant="secondary" onClick={() => dialogRef.current?.close()}>
              Vazgeç
            </Button>
            <Button type="submit">Göster ve kaydet</Button>
          </div>
        </form>
      </dialog>
    </span>
  );
}
