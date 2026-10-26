"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import type { EmailCheckResult } from "@/lib/api/types";
import { sendTestEmailAction } from "@/lib/support-actions";
import dialog from "./dialog.module.css";
import styles from "./support.module.css";

/**
 * Kendi adresinize deneme e-postası: Resend ayarlarının (alan adı, anahtar, staging izinli
 * adresleri) çalıştığını görmek için. Sağlayıcının yanıtı pencerede görünür.
 */
export function EmailTestButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [result, setResult] = useState<EmailCheckResult | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();

  const send = () =>
    start(async () => {
      setFailed(false);
      try {
        setResult(await sendTestEmailAction());
      } catch {
        setResult(null);
        setFailed(true);
      }
      dialogRef.current?.showModal();
    });

  return (
    <>
      <Button variant="quiet" size="s" onClick={send} disabled={pending} aria-busy={pending || undefined}>
        Deneme e-postası
      </Button>
      <dialog ref={dialogRef} className={dialog.dialog} aria-labelledby="eposta-baslik">
        <div className={dialog.dialogForm}>
          <h2 id="eposta-baslik" className={dialog.dialogTitle}>
            {failed ? "E-posta gönderilemedi" : result?.delivered ? "Deneme e-postası gönderildi" : "E-posta gönderilmedi"}
          </h2>
          {failed && <p className={dialog.dialogText}>API yanıt vermedi. Biraz sonra yeniden deneyin.</p>}
          {result && (
            <>
              <p className={dialog.dialogText}>
                {result.delivered
                  ? `${result.to} adresine gönderildi. Gelen kutunuzu ve istenmeyen klasörünü kontrol edin.`
                  : `${result.to} adresine gönderilmedi.`}
              </p>
              {result.response && <p className={styles.small}>Sağlayıcının yanıtı: {result.response}</p>}
              {!result.delivered && (
                <p className={styles.small}>
                  Sunucudaki .env&apos;de TOMURCUK_EMAIL_PROVIDER=resend ve anahtar olmalı; staging&apos;de adresiniz
                  TOMURCUK_EMAIL_ALLOWED_RECIPIENTS listesinde olmalı; tomurcuk.shop Resend&apos;de doğrulanmış olmalı.
                </p>
              )}
            </>
          )}
          <div className={dialog.dialogActions}>
            <Button variant="secondary" onClick={() => dialogRef.current?.close()}>
              Kapat
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
