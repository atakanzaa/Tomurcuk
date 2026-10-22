"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { initialFormState } from "@/lib/checkout/form-state";
import { impersonate, saveNote } from "@/lib/support-actions";
import { withDativeSuffix } from "@/lib/format";
import styles from "../../_components/dialog.module.css";

/** "Not ekle" ve "Dükkân adına gir": ikisi de gerçek <dialog>, odak içinde kalır. */
export function ShopDialogs({ shopId, shopShortName, ownerName, reasons }: { shopId: string; shopShortName: string; ownerName: string; reasons: string[] }) {
  const noteRef = useRef<HTMLDialogElement>(null);
  const impRef = useRef<HTMLDialogElement>(null);
  const [noteState, noteAction] = useActionState(async (prev: typeof initialFormState, fd: FormData) => {
    const next = await saveNote(shopId, prev, fd);
    if (next.values.done) noteRef.current?.close();
    return next;
  }, initialFormState);
  const [impState, impAction] = useActionState(impersonate.bind(null, shopId), initialFormState);

  return (
    <>
      <Button variant="secondary" onClick={() => noteRef.current?.showModal()}>
        Not ekle
      </Button>
      <Button onClick={() => impRef.current?.showModal()}>Dükkân adına gir</Button>

      <dialog ref={noteRef} className={styles.dialog} aria-labelledby="not-baslik">
        <form key={noteState.version} action={noteAction} className={styles.dialogForm} noValidate>
          <h2 id="not-baslik" className={styles.dialogTitle}>
            Ekip notu
          </h2>
          <p className={styles.dialogText}>Not yalnızca destek ekibine görünür; dükkân görmez.</p>
          <Field as="textarea" label="Not" name="text" defaultValue={noteState.values.text} error={noteState.errors.text} maxLength={1000} />
          <div className={styles.dialogActions}>
            <Button variant="secondary" onClick={() => noteRef.current?.close()}>
              Vazgeç
            </Button>
            <Button type="submit">Notu kaydet</Button>
          </div>
        </form>
      </dialog>

      <dialog ref={impRef} className={styles.dialog} aria-labelledby="giris-baslik">
        <form key={impState.version} action={impAction} className={styles.dialogForm} noValidate>
          <h2 id="giris-baslik" className={styles.dialogTitle}>
            {shopShortName} adına gir
          </h2>
          <p className={styles.dialogText}>
            30 dakika boyunca dükkânın panelini onun gördüğü gibi görürsünüz. Yaptığınız her işlem denetim kaydına yazılır ve {withDativeSuffix(ownerName)} bildirim
            gider. Ödeme hesabını değiştiremez, sipariş iptal edemezsiniz.
          </p>
          <Field as="select" label="Gerekçe" name="reason" defaultValue={impState.values.reason ?? reasons[0]} error={impState.errors.reason}>
            {reasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
            <option value="other">Diğer, açıklama yazacağım</option>
          </Field>
          <Field label="Açıklama" name="detail" optional defaultValue={impState.values.detail} />
          <div className={styles.dialogActions}>
            <Button variant="secondary" onClick={() => impRef.current?.close()}>
              Vazgeç
            </Button>
            <Button type="submit">30 dakikalığına gir</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
