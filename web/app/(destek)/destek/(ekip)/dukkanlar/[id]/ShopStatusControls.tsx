"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { ShopStatus, type ShopStatusDetail } from "@/lib/api/types";
import { initialFormState } from "@/lib/checkout/form-state";
import { changeStatusAction } from "@/lib/support-actions";
import styles from "../../_components/dialog.module.css";
import overview from "./overview.module.css";

interface ShopStatusControlsProps {
  shop: { id: string; shortName: string; slugs: string[] };
  status: ShopStatusDetail;
  openOrders: number;
  /** Temsilci de dahil: geçici kapatma ve kaldırma. */
  canPause: boolean;
  /** Lider ve platform sahibi: askıya alma, kalıcı kapatma ve bunlardan geri açma. */
  canSuspend: boolean;
}

const TEXTS: Record<ShopStatus, { button: string; title: string; text: string; submit: string }> = {
  [ShopStatus.Paused]: {
    button: "Siparişleri geçici kapat",
    title: "Siparişleri geçici kapat",
    text: "Vitrin açık kalır ama yeni sipariş alınmaz; alıcı ana sayfasında listelenmez. Var olan siparişler etkilenmez. Dükkân sahibine e-posta gider.",
    submit: "Siparişleri kapat",
  },
  [ShopStatus.Suspended]: {
    button: "Askıya al",
    title: "Dükkânı askıya al",
    text: "Vitrinde yalnızca dükkânın adı ve sipariş almadığı görünür. Dükkân panele girer, var olan siparişlerini teslim eder. Dükkân sahibine e-posta gider.",
    submit: "Askıya al",
  },
  [ShopStatus.Closed]: {
    button: "Kalıcı kapat",
    title: "Dükkânı kalıcı kapat",
    text: "Vitrin yayından kalkar, panel girişi kapanır ve açık oturumlar sonlanır. Veriler silinmez; yeniden açılabilir. Dükkân sahibine e-posta gider.",
    submit: "Kalıcı kapat",
  },
  [ShopStatus.Open]: {
    button: "Yeniden aç",
    title: "Dükkânı yeniden aç",
    text: "Vitrin yeniden sipariş alır ve alıcı ana sayfasında listelenir. Dükkân sahibine e-posta gider.",
    submit: "Yeniden aç",
  },
};

/** Dükkân özetinde durum düğmeleri; her biri gerekçe isteyen bir onay penceresi açar. */
export function ShopStatusControls({ shop, status, openOrders, canPause, canSuspend }: ShopStatusControlsProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [target, setTarget] = useState<ShopStatus>(ShopStatus.Paused);
  const [state, action, pending] = useActionState(async (prev: typeof initialFormState, formData: FormData) => {
    const next = await changeStatusAction(shop, prev, formData);
    if (next.values.done) dialogRef.current?.close();
    return next;
  }, initialFormState);

  const light = status.status === ShopStatus.Open || status.status === ShopStatus.Paused;
  const targets = (
    {
      [ShopStatus.Open]: [ShopStatus.Paused, ShopStatus.Suspended, ShopStatus.Closed],
      [ShopStatus.Paused]: [ShopStatus.Open, ShopStatus.Suspended, ShopStatus.Closed],
      [ShopStatus.Suspended]: [ShopStatus.Open, ShopStatus.Closed],
      [ShopStatus.Closed]: [ShopStatus.Open],
    } as Record<ShopStatus, ShopStatus[]>
  )[status.status].filter((to) =>
    (to === ShopStatus.Paused || to === ShopStatus.Open) && light ? canPause : canSuspend,
  );
  if (targets.length === 0) return null;

  const texts = TEXTS[target];
  return (
    <>
      <div className={overview.statusActions}>
        {targets.map((to) => (
          <Button
            key={to}
            variant={to === ShopStatus.Closed ? "danger" : "secondary"}
            size="s"
            onClick={() => {
              setTarget(to);
              dialogRef.current?.showModal();
            }}
          >
            {TEXTS[to].button}
          </Button>
        ))}
      </div>
      <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="durum-baslik">
        <form key={`${state.version}-${target}`} action={action} className={styles.dialogForm} noValidate>
          <input type="hidden" name="status" value={target} />
          <h2 id="durum-baslik" className={styles.dialogTitle}>
            {texts.title}
          </h2>
          <p className={styles.dialogText}>{texts.text}</p>
          {state.errors.form && (
            <p className={overview.statusError} role="alert">
              {state.errors.form}
            </p>
          )}
          {target === ShopStatus.Paused && (
            <Field as="select" label="Ne kadar" name="duration" defaultValue={state.values.duration ?? "3s"}>
              <option value="1s">1 saat</option>
              <option value="3s">3 saat</option>
              <option value="1g">1 gün</option>
              <option value="3g">3 gün</option>
              <option value="7g">1 hafta</option>
              <option value="">Yeniden açılana kadar</option>
            </Field>
          )}
          <Field
            as="textarea"
            label="Gerekçe"
            name="reason"
            optional={target === ShopStatus.Open}
            hint={target === ShopStatus.Open ? undefined : "Dükkân sahibine giden e-postada ve denetim kaydında görünür."}
            defaultValue={state.values.reason}
            error={state.errors.reason}
            maxLength={500}
          />
          {target === ShopStatus.Closed && openOrders > 0 && (
            <label className={overview.confirm}>
              <input type="checkbox" name="confirmOpenOrders" required />
              <span>
                Dükkânın teslim edilmeyi bekleyen {openOrders} siparişi var; alıcılarla dükkânın ilgilendiğini doğruladım.
              </span>
            </label>
          )}
          <div className={styles.dialogActions}>
            <Button variant="secondary" onClick={() => dialogRef.current?.close()}>
              Vazgeç
            </Button>
            <Button type="submit" variant={target === ShopStatus.Closed ? "danger" : "primary"} disabled={pending}>
              {texts.submit}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
