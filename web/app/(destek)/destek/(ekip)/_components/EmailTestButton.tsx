"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { EmailCheckResult } from "@/lib/api/types";
import { sendTestEmailAction } from "@/lib/support-actions";
import dialog from "./dialog.module.css";
import styles from "./support.module.css";

/**
 * Deneme e-postası: Resend ayarlarının (alan adı, anahtar, staging izinli adresleri) çalıştığını
 * görmek için. Adres yazılmazsa destek hesabının adresine gider. Sağlayıcının yanıtı pencerede
 * görünür.
 */
export function EmailTestButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [result, setResult] = useState<EmailCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const open = () => {
    setResult(null);
    setError(null);
    dialogRef.current?.showModal();
  };

  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const to = String(new FormData(event.currentTarget).get("to") ?? "");
    start(async () => {
      try {
        const sent = await sendTestEmailAction(to);
        if ("error" in sent) {
          setResult(null);
          setError(sent.error);
        } else {
          setError(null);
          setResult(sent.result);
        }
      } catch {
        setResult(null);
        setError("API yanıt vermedi. Biraz sonra yeniden deneyin.");
      }
    });
  };

  return (
    <>
      <Button variant="quiet" size="s" onClick={open}>
        Deneme e-postası
      </Button>
      <dialog ref={dialogRef} className={dialog.dialog} aria-labelledby="eposta-baslik">
        <form className={dialog.dialogForm} onSubmit={send} noValidate>
          <h2 id="eposta-baslik" className={dialog.dialogTitle}>
            Deneme e-postası
          </h2>
          <p className={dialog.dialogText}>
            E-posta ayarlarının çalıştığını görmek için bir adrese deneme e-postası gönderin. Staging&apos;de adres
            TOMURCUK_EMAIL_ALLOWED_RECIPIENTS listesinde olmalı.
          </p>
          <Field
            label="Adres"
            name="to"
            type="email"
            optional
            autoComplete="email"
            placeholder="siz@ornek.com"
            hint="Boş bırakırsanız destek hesabınızın adresine gider."
            error={error ?? undefined}
          />
          {result && (
            <div role="status" className={dialog.dialogText}>
              <p className={result.delivered ? undefined : styles.small}>
                <strong>{result.delivered ? "Gönderildi." : "Gönderilmedi."}</strong>{" "}
                {result.delivered
                  ? `${result.to} adresine gitti. Gelen kutusuna ve istenmeyen klasörüne bakın.`
                  : `${result.to} adresine gitmedi.`}
              </p>
              {result.response && <p className={styles.small}>Sağlayıcının yanıtı: {result.response}</p>}
            </div>
          )}
          <div className={dialog.dialogActions}>
            <Button variant="secondary" onClick={() => dialogRef.current?.close()}>
              Kapat
            </Button>
            <Button type="submit" disabled={pending} aria-busy={pending || undefined}>
              Gönder
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
